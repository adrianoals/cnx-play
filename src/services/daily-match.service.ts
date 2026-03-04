import { createClient } from '@/lib/supabase'
import type { DailyMatchRow, MatchHistoryItem } from '@/types'

const supabase = () => createClient()

async function getMyId(): Promise<string> {
  const { data: { user } } = await supabase().auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return user.id
}

export async function fetchTodayMatches(): Promise<DailyMatchRow[]> {
  const me = await getMyId()

  const { data, error } = await supabase().rpc('get_today_matches', { p_user_id: me })
  if (error) throw error
  if (!data || !Array.isArray(data) || data.length === 0) return []

  return (data as Record<string, unknown>[]).map(row => ({
    id: row.id as string,
    userId: row.user_id as string,
    suggestedUserId: row.suggested_user_id as string,
    matchDate: row.match_date as string,
    timeSlot: row.time_slot as '07:00' | '19:00',
    status: row.status as 'pending' | 'completed',
    createdAt: row.created_at as string,
    partnerName: row.partner_name as string | undefined,
    partnerAvatar: (row.partner_avatar as string) ?? null,
    partnerCompany: row.partner_company as string | undefined,
    partnerCategory: row.partner_category as string | undefined,
  }))
}

export async function confirmMatch(matchId: string): Promise<{ bothConfirmed: boolean }> {
  const me = await getMyId()

  // 1. Get the match record to know the partner, date, and slot
  const { data: myMatch, error: fetchErr } = await supabase()
    .from('daily_matches')
    .select('id, user_id, suggested_user_id, match_date, time_slot, status')
    .eq('id', matchId)
    .single()

  if (fetchErr || !myMatch) throw fetchErr || new Error('Match not found')

  // 2. Mark my match as completed
  const { error } = await supabase()
    .from('daily_matches')
    .update({ status: 'completed' })
    .eq('id', matchId)

  if (error) throw error

  // 3. Find the partner's bilateral match (partner → me, same date + slot)
  const partnerId = myMatch.suggested_user_id as string
  const { data: partnerMatch } = await supabase()
    .from('daily_matches')
    .select('id, status')
    .eq('user_id', partnerId)
    .eq('suggested_user_id', me)
    .eq('match_date', myMatch.match_date)
    .eq('time_slot', myMatch.time_slot)
    .maybeSingle()

  // 4. Always insert MY meeting record (RLS only allows organizer_id = auth.uid())
  const meetingDate = myMatch.match_date as string
  const meetingTime = (myMatch.time_slot as string) + ':00'

  const { error: meetingErr } = await supabase()
    .from('meetings')
    .insert({
      organizer_id: me,
      partner_id: partnerId,
      meeting_date: meetingDate,
      meeting_time: meetingTime,
      status: 'completed',
      platform: 'other',
    })

  if (meetingErr) {
    console.error('Failed to insert meeting:', meetingErr)
  }

  // 5. Check if partner already confirmed → both confirmed
  const bothConfirmed = partnerMatch?.status === 'completed'
  return { bothConfirmed }
}

export async function fetchMatchHistory(): Promise<MatchHistoryItem[]> {
  const me = await getMyId()
  const today = new Date().toISOString().slice(0, 10)

  const { data, error } = await supabase()
    .from('daily_matches')
    .select('id, user_id, suggested_user_id, match_date, time_slot, status, created_at')
    .eq('user_id', me)
    .lt('match_date', today)
    .order('match_date', { ascending: false })
    .order('time_slot', { ascending: true })
    .limit(30)

  if (error) throw error
  if (!data || data.length === 0) return []

  const partnerIds = [...new Set(data.map(r => r.suggested_user_id as string))]

  const { data: users } = await supabase()
    .from('users')
    .select('id, full_name, avatar_url')
    .in('id', partnerIds)

  const { data: companies } = await supabase()
    .from('companies')
    .select('user_id, name, category_id, categories(name)')
    .eq('is_primary', true)
    .in('user_id', partnerIds)

  // Fetch all partner→me matches to check bilateral confirmation
  const { data: partnerMatches } = await supabase()
    .from('daily_matches')
    .select('user_id, suggested_user_id, match_date, time_slot, status')
    .in('user_id', partnerIds)
    .eq('suggested_user_id', me)
    .lt('match_date', today)

  const partnerMatchMap = new Map<string, string>()
  for (const pm of partnerMatches || []) {
    const key = `${pm.user_id}_${pm.match_date}_${pm.time_slot}`
    partnerMatchMap.set(key, pm.status as string)
  }

  const userMap = new Map<string, { full_name: string; avatar_url: string | null }>()
  for (const u of users || []) userMap.set(u.id, u)

  const compMap = new Map<string, { name: string; categoryName?: string }>()
  for (const c of companies || []) {
    const raw = c.categories as unknown
    const cat = Array.isArray(raw) ? (raw[0] as { name: string } | undefined) : (raw as { name: string } | null)
    compMap.set(c.user_id, { name: c.name, categoryName: cat?.name })
  }

  return data.map(row => {
    const partner = userMap.get(row.suggested_user_id)
    const comp = compMap.get(row.suggested_user_id)
    const partnerKey = `${row.suggested_user_id}_${row.match_date}_${row.time_slot}`
    const partnerStatus = partnerMatchMap.get(partnerKey)

    return {
      id: row.id as string,
      userId: row.user_id as string,
      suggestedUserId: row.suggested_user_id as string,
      matchDate: row.match_date as string,
      timeSlot: row.time_slot as '07:00' | '19:00',
      status: row.status as 'pending' | 'completed',
      createdAt: row.created_at as string,
      partnerName: partner?.full_name,
      partnerAvatar: partner?.avatar_url ?? null,
      partnerCompany: comp?.name,
      partnerCategory: comp?.categoryName,
      bothConfirmed: row.status === 'completed' && partnerStatus === 'completed',
    }
  })
}

/** Garante que existe uma conexão aceita entre o usuário logado e o parceiro do match */
export async function ensureMatchConnection(partnerId: string): Promise<void> {
  const me = await getMyId()

  // Verificar se já existe conexão (qualquer status)
  const { data: existing } = await supabase()
    .from('connections')
    .select('id, status')
    .or(
      `and(requester_id.eq.${me},requested_id.eq.${partnerId}),and(requester_id.eq.${partnerId},requested_id.eq.${me})`
    )
    .limit(1)
    .maybeSingle()

  if (existing) {
    // Se já existe mas não está aceita, aceitar
    if (existing.status !== 'accepted') {
      await supabase()
        .from('connections')
        .update({ status: 'accepted', responded_at: new Date().toISOString() })
        .eq('id', existing.id)
    }
    return
  }

  // Criar conexão já aceita (match diário = conexão automática)
  const { error } = await supabase()
    .from('connections')
    .insert({
      requester_id: me,
      requested_id: partnerId,
      status: 'accepted',
      responded_at: new Date().toISOString(),
    })

  if (error) throw error
}
