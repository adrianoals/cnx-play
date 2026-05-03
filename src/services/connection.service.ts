import { createClient } from '@/lib/supabase'
import type { Connection, ConnectionListItem } from '@/types'

const supabase = () => createClient()

async function getMyId(): Promise<string> {
  const { data: { user } } = await supabase().auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return user.id
}

const SIMPLE_SELECT = 'id, requester_id, requested_id, status, created_at, responded_at'

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
  const { error } = await supabase()
    .from('connections')
    .delete()
    .eq('id', connectionId)

  if (error) throw error
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

/** Busca todas as conexões em que o usuário é o destinatário (qualquer status) — ordem decrescente */
export async function fetchReceivedConnections(): Promise<ConnectionListItem[]> {
  const me = await getMyId()

  const { data, error } = await supabase()
    .from('connections')
    .select('id, requester_id, requested_id, status, created_at, responded_at')
    .eq('requested_id', me)
    .order('created_at', { ascending: false })

  if (error) throw error
  return enrichPartnerCentric(data || [], me)
}

/** Busca todas as conexões em que o usuário é o solicitante (qualquer status) — ordem decrescente */
export async function fetchSentConnections(): Promise<ConnectionListItem[]> {
  const me = await getMyId()

  const { data, error } = await supabase()
    .from('connections')
    .select('id, requester_id, requested_id, status, created_at, responded_at')
    .eq('requester_id', me)
    .order('created_at', { ascending: false })

  if (error) throw error
  return enrichPartnerCentric(data || [], me)
}

async function enrichPartnerCentric(
  rows: Array<{ id: string; requester_id: string; requested_id: string; status: string; created_at: string; responded_at: string | null }>,
  me: string
): Promise<ConnectionListItem[]> {
  if (rows.length === 0) return []

  const partnerIds = rows.map(r => (r.requester_id === me ? r.requested_id : r.requester_id))
  const uniqueIds = [...new Set(partnerIds)]

  const { data: users } = await supabase()
    .from('users')
    .select('id, full_name, avatar_url, phone')
    .in('id', uniqueIds)

  const { data: companies } = await supabase()
    .from('companies')
    .select('user_id, name, contact_phone, is_primary, categories(name)')
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

  return rows.map(row => {
    const partnerId = row.requester_id === me ? row.requested_id : row.requester_id
    const partner = userMap.get(partnerId)
    const comp = compMap.get(partnerId)
    const phone = partner?.phone || comp?.contactPhone || null

    return {
      connectionId: row.id,
      partnerId,
      partnerName: partner?.full_name || '',
      partnerAvatar: partner?.avatar_url ?? null,
      partnerCompany: comp?.name || '',
      partnerCategory: comp?.categoryName || '',
      partnerPhone: phone,
      status: row.status as ConnectionListItem['status'],
      createdAt: row.created_at,
      respondedAt: row.responded_at,
    }
  })
}

// Helper: enrich connection rows with user/company info
