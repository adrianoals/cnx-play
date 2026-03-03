import type { UserStats, PlatformTotals, LeaderboardRow, SupabaseDeal } from '@/types'
import { createClient } from '@/lib/supabase'
import { mapUserStats, mapPlatformTotals, mapLeaderboardRow } from '@/lib/map-stats'
import { mapDeal } from '@/lib/map-deal'

export async function fetchMyStats(): Promise<UserStats | null> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('v_user_stats')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error) return null
  return mapUserStats(data)
}

export async function fetchPlatformTotals(): Promise<PlatformTotals> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('v_platform_totals')
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return mapPlatformTotals(data)
}

export async function fetchLeaderboard(limit = 10): Promise<LeaderboardRow[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('v_leaderboard')
    .select('*')
    .limit(limit)

  if (error) throw new Error(error.message)
  return (data || []).map(mapLeaderboardRow)
}

export async function registerDeal(input: {
  companyName: string
  value: number
}): Promise<SupabaseDeal> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado.')

  const { data, error } = await supabase
    .from('deals')
    .insert({
      author_id: user.id,
      partner_company_name: input.companyName,
      value_brl: input.value,
      deal_date: new Date().toISOString().slice(0, 10),
    })
    .select('*, users(full_name)')
    .single()

  if (error) throw new Error(error.message)
  return mapDeal(data)
}

export async function fetchRecentDeals(limit = 10): Promise<SupabaseDeal[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('deals')
    .select('*, users(full_name)')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)
  return (data || []).map(mapDeal)
}

export async function fetchMyDeals(): Promise<SupabaseDeal[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('deals')
    .select('*, users(full_name)')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data || []).map(mapDeal)
}
