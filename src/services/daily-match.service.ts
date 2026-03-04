import { createClient } from '@/lib/supabase'
import type { DailyMatchRow } from '@/types'

const supabase = () => createClient()

async function getMyId(): Promise<string> {
  const { data: { user } } = await supabase().auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return user.id
}

export async function fetchTodayMatches(): Promise<DailyMatchRow[]> {
  const me = await getMyId()
  const today = new Date().toISOString().slice(0, 10)

  const { data, error } = await supabase()
    .from('daily_matches')
    .select('*')
    .eq('user_id', me)
    .eq('match_date', today)
    .order('time_slot')

  if (error) throw error
  if (!data || data.length === 0) return []

  // Enrich with partner info
  const partnerIds = data.map(r => r.suggested_user_id)

  const { data: users } = await supabase()
    .from('users')
    .select('id, full_name, avatar_url')
    .in('id', partnerIds)

  const { data: companies } = await supabase()
    .from('companies')
    .select('user_id, name, category_id, categories(name)')
    .eq('is_primary', true)
    .in('user_id', partnerIds)

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
    }
  })
}

export async function confirmMatch(matchId: string): Promise<void> {
  const { error } = await supabase()
    .from('daily_matches')
    .update({ status: 'completed' })
    .eq('id', matchId)

  if (error) throw error
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
