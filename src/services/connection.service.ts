import { createClient } from '@/lib/supabase'
import type { Connection, AcceptedConnection } from '@/types'

const supabase = () => createClient()

async function getMyId(): Promise<string> {
  const { data: { user } } = await supabase().auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return user.id
}

function mapRow(row: Record<string, unknown>): Connection {
  const reqUser = row.requester as Record<string, unknown> | null
  const reqComp = row.requester_company as Record<string, unknown> | null
  const tgtUser = row.requested as Record<string, unknown> | null
  const tgtComp = row.requested_company as Record<string, unknown> | null
  return {
    id: row.id as string,
    requesterId: row.requester_id as string,
    requestedId: row.requested_id as string,
    status: row.status as Connection['status'],
    createdAt: row.created_at as string,
    respondedAt: (row.responded_at as string) || null,
    requesterName: reqUser ? (reqUser.full_name as string) : undefined,
    requesterAvatar: reqUser ? (reqUser.avatar_url as string | null) : undefined,
    requesterCompany: reqComp ? (reqComp.name as string) : undefined,
    requestedName: tgtUser ? (tgtUser.full_name as string) : undefined,
    requestedAvatar: tgtUser ? (tgtUser.avatar_url as string | null) : undefined,
    requestedCompany: tgtComp ? (tgtComp.name as string) : undefined,
  }
}

const CONNECTION_SELECT = `
  id, requester_id, requested_id, status, created_at, responded_at,
  requester:users!connections_requester_id_fkey(full_name, avatar_url),
  requester_company:companies!inner(name)...(requester_id),
  requested:users!connections_requested_id_fkey(full_name, avatar_url)
`

// Simpler select that avoids complex join syntax
const SIMPLE_SELECT = 'id, requester_id, requested_id, status, created_at, responded_at'

export async function fetchMyConnections(): Promise<Connection[]> {
  const me = await getMyId()
  const { data, error } = await supabase()
    .from('connections')
    .select(SIMPLE_SELECT)
    .eq('status', 'accepted')
    .or(`requester_id.eq.${me},requested_id.eq.${me}`)
    .order('created_at', { ascending: false })

  if (error) throw error

  // Enrich with user/company data
  const userIds = new Set<string>()
  for (const row of data || []) {
    userIds.add(row.requester_id)
    userIds.add(row.requested_id)
  }

  const enriched = await enrichConnections(data || [], userIds)
  return enriched
}

export async function fetchPendingReceived(): Promise<Connection[]> {
  const me = await getMyId()
  const { data, error } = await supabase()
    .from('connections')
    .select(SIMPLE_SELECT)
    .eq('requested_id', me)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) throw error

  const userIds = new Set<string>()
  for (const row of data || []) {
    userIds.add(row.requester_id)
    userIds.add(row.requested_id)
  }
  return enrichConnections(data || [], userIds)
}

export async function fetchPendingSent(): Promise<Connection[]> {
  const me = await getMyId()
  const { data, error } = await supabase()
    .from('connections')
    .select(SIMPLE_SELECT)
    .eq('requester_id', me)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) throw error

  const userIds = new Set<string>()
  for (const row of data || []) {
    userIds.add(row.requester_id)
    userIds.add(row.requested_id)
  }
  return enrichConnections(data || [], userIds)
}

export async function requestConnection(targetId: string): Promise<Connection> {
  const me = await getMyId()
  const { data, error } = await supabase()
    .from('connections')
    .insert({ requester_id: me, requested_id: targetId })
    .select(SIMPLE_SELECT)
    .single()

  if (error) throw error
  return {
    id: data.id,
    requesterId: data.requester_id,
    requestedId: data.requested_id,
    status: data.status,
    createdAt: data.created_at,
    respondedAt: data.responded_at,
  }
}

export async function respondConnection(connectionId: string, accept: boolean): Promise<void> {
  const { error } = await supabase()
    .from('connections')
    .update({
      status: accept ? 'accepted' : 'rejected',
      responded_at: new Date().toISOString(),
    })
    .eq('id', connectionId)

  if (error) throw error
}

export async function deleteConnection(connectionId: string): Promise<void> {
  // First get the connection to know both user IDs
  const { data: conn, error: fetchErr } = await supabase()
    .from('connections')
    .select('requester_id, requested_id')
    .eq('id', connectionId)
    .single()

  if (fetchErr) throw fetchErr

  // Delete all messages between the two users
  const me = await getMyId()
  const otherId = conn.requester_id === me ? conn.requested_id : conn.requester_id

  const { error: msgErr } = await supabase()
    .from('messages')
    .delete()
    .or(`and(sender_id.eq.${me},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${me})`)

  if (msgErr) throw msgErr

  // Delete the connection
  const { error: delErr } = await supabase()
    .from('connections')
    .delete()
    .eq('id', connectionId)

  if (delErr) throw delErr
}

export async function getConnectionStatus(
  targetId: string
): Promise<{ connectionId: string; status: Connection['status']; iRequested: boolean } | null> {
  const me = await getMyId()
  const { data, error } = await supabase()
    .from('connections')
    .select('id, requester_id, status')
    .or(`and(requester_id.eq.${me},requested_id.eq.${targetId}),and(requester_id.eq.${targetId},requested_id.eq.${me})`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return {
    connectionId: data.id,
    status: data.status,
    iRequested: data.requester_id === me,
  }
}

export async function fetchConnectionsMap(): Promise<
  Map<string, { connectionId: string; status: Connection['status']; iRequested: boolean }>
> {
  const me = await getMyId()
  const { data, error } = await supabase()
    .from('connections')
    .select('id, requester_id, requested_id, status')
    .or(`requester_id.eq.${me},requested_id.eq.${me}`)

  if (error) throw error

  const map = new Map<string, { connectionId: string; status: Connection['status']; iRequested: boolean }>()
  for (const row of data || []) {
    const otherId = row.requester_id === me ? row.requested_id : row.requester_id
    const iRequested = row.requester_id === me
    map.set(otherId, { connectionId: row.id, status: row.status, iRequested })
  }
  return map
}

// Helper: enrich connection rows with user/company info
/** Busca conexões aceitas com dados completos do parceiro (nome, empresa, telefone) */
export async function fetchAcceptedConnections(): Promise<AcceptedConnection[]> {
  const me = await getMyId()

  const { data, error } = await supabase()
    .from('connections')
    .select('id, requester_id, requested_id, created_at, responded_at')
    .eq('status', 'accepted')
    .or(`requester_id.eq.${me},requested_id.eq.${me}`)
    .order('responded_at', { ascending: false })

  if (error) throw error
  if (!data || data.length === 0) return []

  // Excluir conexões criadas automaticamente pelo match diário
  const { data: matchPairs } = await supabase()
    .from('daily_matches')
    .select('user_id, suggested_user_id')
    .or(`user_id.eq.${me},suggested_user_id.eq.${me}`)

  const matchPairKeys = new Set<string>()
  for (const m of matchPairs || []) {
    const key = [m.user_id as string, m.suggested_user_id as string].sort().join('|')
    matchPairKeys.add(key)
  }

  const filteredData = data.filter(row => {
    const key = [row.requester_id as string, row.requested_id as string].sort().join('|')
    return !matchPairKeys.has(key)
  })

  if (filteredData.length === 0) return []

  // Coletar IDs dos parceiros
  const partnerIds = filteredData.map(row =>
    (row.requester_id as string) === me ? (row.requested_id as string) : (row.requester_id as string)
  )
  const uniqueIds = [...new Set(partnerIds)]

  const { data: users } = await supabase()
    .from('users')
    .select('id, full_name, avatar_url, phone')
    .in('id', uniqueIds)

  const { data: companies } = await supabase()
    .from('companies')
    .select('user_id, name, contact_phone, category_id, is_primary, categories(name)')
    .in('user_id', uniqueIds)
    .order('is_primary', { ascending: false })

  const userMap = new Map<string, { full_name: string; avatar_url: string | null; phone: string | null }>()
  for (const u of users || []) userMap.set(u.id, u)

  const compMap = new Map<string, { name: string; categoryName: string; contactPhone: string | null }>()
  for (const c of companies || []) {
    if (compMap.has(c.user_id)) continue
    const raw = c.categories as unknown
    const cat = Array.isArray(raw) ? (raw[0] as { name: string } | undefined) : (raw as { name: string } | null)
    compMap.set(c.user_id, { name: c.name, categoryName: cat?.name || '', contactPhone: c.contact_phone })
  }

  return filteredData.map(row => {
    const partnerId = (row.requester_id as string) === me
      ? (row.requested_id as string)
      : (row.requester_id as string)
    const partner = userMap.get(partnerId)
    const comp = compMap.get(partnerId)
    const phone = partner?.phone || comp?.contactPhone || null

    return {
      connectionId: row.id as string,
      partnerId,
      partnerName: partner?.full_name || '',
      partnerAvatar: partner?.avatar_url ?? null,
      partnerCompany: comp?.name || '',
      partnerCategory: comp?.categoryName || '',
      partnerPhone: phone,
      connectedAt: (row.responded_at as string) || (row.created_at as string),
    }
  })
}

async function enrichConnections(
  rows: Array<Record<string, unknown>>,
  userIds: Set<string>
): Promise<Connection[]> {
  if (userIds.size === 0) return []

  const ids = Array.from(userIds)

  const { data: users } = await supabase()
    .from('users')
    .select('id, full_name, avatar_url')
    .in('id', ids)

  const { data: comps } = await supabase()
    .from('companies')
    .select('user_id, name')
    .eq('is_primary', true)
    .in('user_id', ids)

  const userMap = new Map<string, { full_name: string; avatar_url: string | null }>()
  for (const u of users || []) userMap.set(u.id, u)

  const compMap = new Map<string, string>()
  for (const c of comps || []) compMap.set(c.user_id, c.name)

  return rows.map(row => {
    const reqUser = userMap.get(row.requester_id as string)
    const tgtUser = userMap.get(row.requested_id as string)
    return {
      id: row.id as string,
      requesterId: row.requester_id as string,
      requestedId: row.requested_id as string,
      status: row.status as Connection['status'],
      createdAt: row.created_at as string,
      respondedAt: (row.responded_at as string) || null,
      requesterName: reqUser?.full_name,
      requesterAvatar: reqUser?.avatar_url ?? null,
      requesterCompany: compMap.get(row.requester_id as string),
      requestedName: tgtUser?.full_name,
      requestedAvatar: tgtUser?.avatar_url ?? null,
      requestedCompany: compMap.get(row.requested_id as string),
    }
  })
}
