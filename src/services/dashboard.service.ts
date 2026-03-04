import type { UserStats, PlatformTotals, LeaderboardRow, SupabaseDeal, DailyMatchRow } from '@/types'
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
    .select('*, users!deals_author_id_fkey(full_name)')
    .single()

  if (error) throw new Error(error.message)
  return mapDeal(data)
}

export async function fetchRecentDeals(limit = 10): Promise<SupabaseDeal[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('deals')
    .select('*, users!deals_author_id_fkey(full_name)')
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
    .select('*, users!deals_author_id_fkey(full_name)')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data || []).map(mapDeal)
}

export interface DashboardBundle {
  myStats: UserStats | null
  totals: PlatformTotals
  board: LeaderboardRow[]
  recentDeals: SupabaseDeal[]
  matches: DailyMatchRow[]
}

export async function fetchDashboardBundle(): Promise<DashboardBundle> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase.rpc('get_dashboard_data', { p_user_id: user.id })
  if (error) throw new Error(error.message)

  const raw = data as Record<string, unknown>
  const statsRaw = raw.stats as Record<string, unknown> | null
  const platformRaw = raw.platform as Record<string, unknown>
  const leaderboardRaw = raw.leaderboard as Record<string, unknown>[]
  const dealsRaw = raw.deals as Record<string, unknown>[]
  const matchesRaw = raw.matches as Record<string, unknown>[]

  return {
    myStats: statsRaw ? mapUserStats(statsRaw) : null,
    totals: mapPlatformTotals(platformRaw),
    board: (leaderboardRaw || []).map(mapLeaderboardRow),
    recentDeals: (dealsRaw || []).map(row => ({
      id: row.id as string,
      authorId: row.author_id as string,
      companyName: (row.partner_company_name as string) || '',
      value: Number(row.value_brl) || 0,
      dealDate: (row.deal_date as string) || '',
      description: (row.description as string) || null,
      createdAt: (row.created_at as string) || new Date().toISOString(),
      authorName: (row.author_name as string) || undefined,
      status: (row.status as SupabaseDeal['status']) || 'pending',
      adminApprovedBy: (row.admin_approved_by as string) || null,
      adminApprovedAt: (row.admin_approved_at as string) || null,
    })),
    matches: (matchesRaw || []).map(row => ({
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
    })),
  }
}
