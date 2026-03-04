import type { User, AdminCompany, SupabaseReferral, SupabaseDeal, DailyMatchRow } from '@/types'
import { createClient } from '@/lib/supabase'
import { mapProfile } from '@/lib/map-profile'
import { mapCompany } from '@/lib/map-company'
import { mapReferral } from '@/lib/map-referral'
import { mapDeal } from '@/lib/map-deal'

export async function fetchAllUsers(): Promise<User[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data || []).map(mapProfile)
}

export async function updateUserProfile(
  id: string,
  updates: {
    full_name?: string
    phone?: string
    cpf?: string
    address?: string
    role?: 'user' | 'admin'
    status?: 'active' | 'pending' | 'inactive'
  }
): Promise<User> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return mapProfile(data)
}

export async function changeUserStatus(
  id: string,
  status: 'active' | 'pending' | 'inactive'
): Promise<void> {
  await updateUserProfile(id, { status })
}

export async function deleteUserProfile(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function createUserViaApi(data: {
  email: string
  password: string
  fullName: string
  phone?: string
  cpf?: string
  role?: 'user' | 'admin'
  status?: 'active' | 'pending' | 'inactive'
}): Promise<User> {
  const response = await fetch('/api/admin/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Falha ao criar usuário.')
  }

  return response.json()
}

// ── Companies ──────────────────────────────────────────────

export async function fetchAllCompanies(): Promise<AdminCompany[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('companies')
    .select('*, categories(name), users(full_name, email)')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data || []).map(mapCompany)
}

export async function createCompanyForUser(input: {
  userId: string
  name: string
  cnpj?: string
  categoryId?: string
  description?: string
  location?: string
  contactEmail?: string
  contactPhone?: string
  linkedin?: string
  isPrimary?: boolean
  gallery?: string[]
}): Promise<AdminCompany> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('companies')
    .insert({
      user_id: input.userId,
      name: input.name,
      cnpj: input.cnpj || null,
      category_id: input.categoryId || null,
      description: input.description || null,
      location: input.location || null,
      contact_email: input.contactEmail || null,
      contact_phone: input.contactPhone || null,
      linkedin: input.linkedin || null,
      is_primary: input.isPrimary ?? true,
      gallery: input.gallery || [],
    })
    .select('*, categories(name), users(full_name, email)')
    .single()

  if (error) throw new Error(error.message)
  return mapCompany(data)
}

export async function updateCompanyAdmin(
  id: string,
  updates: {
    name?: string
    cnpj?: string
    categoryId?: string
    description?: string
    location?: string
    contactEmail?: string
    contactPhone?: string
    linkedin?: string
    isPrimary?: boolean
    gallery?: string[]
  }
): Promise<AdminCompany> {
  const supabase = createClient()

  const payload: Record<string, unknown> = {}
  if (updates.name !== undefined) payload.name = updates.name
  if (updates.cnpj !== undefined) payload.cnpj = updates.cnpj || null
  if (updates.categoryId !== undefined) payload.category_id = updates.categoryId || null
  if (updates.description !== undefined) payload.description = updates.description || null
  if (updates.location !== undefined) payload.location = updates.location || null
  if (updates.contactEmail !== undefined) payload.contact_email = updates.contactEmail || null
  if (updates.contactPhone !== undefined) payload.contact_phone = updates.contactPhone || null
  if (updates.linkedin !== undefined) payload.linkedin = updates.linkedin || null
  if (updates.isPrimary !== undefined) payload.is_primary = updates.isPrimary
  if (updates.gallery !== undefined) payload.gallery = updates.gallery

  const { data, error } = await supabase
    .from('companies')
    .update(payload)
    .eq('id', id)
    .select('*, categories(name), users(full_name, email)')
    .single()

  if (error) throw new Error(error.message)
  return mapCompany(data)
}

export async function deleteCompanyAdmin(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('companies')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
}

// ── Deals ─────────────────────────────────────────────────

export async function fetchAllDeals(): Promise<SupabaseDeal[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('deals')
    .select('*, users!deals_author_id_fkey(full_name)')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data || []).map((row: Record<string, unknown>) => {
    const nested = row.users as Record<string, unknown> | null
    return mapDeal({ ...row, users: nested })
  })
}

export async function updateDealStatus(
  id: string,
  status: 'pending' | 'approved' | 'rejected',
  adminId: string
): Promise<void> {
  const supabase = createClient()
  const payload: Record<string, unknown> = { status }
  if (status === 'approved' || status === 'rejected') {
    payload.admin_approved_by = adminId
    payload.admin_approved_at = new Date().toISOString()
  } else {
    payload.admin_approved_by = null
    payload.admin_approved_at = null
  }
  const { error } = await supabase
    .from('deals')
    .update(payload)
    .eq('id', id)

  if (error) throw new Error(error.message)
}

// ── Referrals ──────────────────────────────────────────────

export async function fetchAllReferrals(): Promise<SupabaseReferral[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('referrals')
    .select('*, users!referrals_referrer_id_fkey(full_name)')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data || []).map(mapReferral)
}

export async function updateReferralStatus(
  id: string,
  status: 'pending' | 'completed' | 'rejected'
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('referrals')
    .update({ status })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

// ── Daily Matches (Admin) ─────────────────────────────────

export interface AdminDailyMatch extends DailyMatchRow {
  userAName: string
  userBName: string
  userACompany: string
  userBCompany: string
  userACategory: string
  userBCategory: string
  repeatCount: number
}

export async function fetchDailyMatchesAdmin(date: string): Promise<AdminDailyMatch[]> {
  const supabase = createClient()

  const { data: matches, error } = await supabase
    .from('daily_matches')
    .select('*')
    .eq('match_date', date)
    .order('time_slot')
    .order('created_at')

  if (error) throw new Error(error.message)
  if (!matches || matches.length === 0) return []

  // Collect all user IDs
  const userIds = new Set<string>()
  for (const m of matches) {
    userIds.add(m.user_id)
    userIds.add(m.suggested_user_id)
  }
  const ids = Array.from(userIds)

  const { data: users } = await supabase
    .from('users')
    .select('id, full_name')
    .in('id', ids)

  const { data: companies } = await supabase
    .from('companies')
    .select('user_id, name, category_id, categories(name)')
    .eq('is_primary', true)
    .in('user_id', ids)

  const userMap = new Map<string, string>()
  for (const u of users || []) userMap.set(u.id, u.full_name)

  const compMap = new Map<string, { name: string; categoryName: string }>()
  for (const c of companies || []) {
    const raw = c.categories as unknown
    const cat = Array.isArray(raw) ? (raw[0] as { name: string } | undefined) : (raw as { name: string } | null)
    compMap.set(c.user_id, { name: c.name, categoryName: cat?.name || '' })
  }

  // Get repeat counts from history
  const { data: history } = await supabase
    .from('daily_match_history')
    .select('user_id, shown_user_id')

  const pairCounts = new Map<string, number>()
  for (const h of history || []) {
    const key = [h.user_id, h.shown_user_id].sort().join('|')
    pairCounts.set(key, (pairCounts.get(key) || 0) + 1)
  }

  // Dedupe: only return one row per pair (user_id < suggested_user_id)
  const seen = new Set<string>()
  const result: AdminDailyMatch[] = []

  for (const row of matches) {
    const pairKey = [row.user_id, row.suggested_user_id].sort().join('|')
    if (seen.has(pairKey + row.time_slot)) continue
    seen.add(pairKey + row.time_slot)

    const compA = compMap.get(row.user_id)
    const compB = compMap.get(row.suggested_user_id)

    result.push({
      id: row.id,
      userId: row.user_id,
      suggestedUserId: row.suggested_user_id,
      matchDate: row.match_date,
      timeSlot: row.time_slot,
      status: row.status,
      createdAt: row.created_at,
      userAName: userMap.get(row.user_id) || '',
      userBName: userMap.get(row.suggested_user_id) || '',
      userACompany: compA?.name || '',
      userBCompany: compB?.name || '',
      userACategory: compA?.categoryName || '',
      userBCategory: compB?.categoryName || '',
      repeatCount: pairCounts.get(pairKey) || 0,
    })
  }

  return result
}

export async function deleteDailyMatch(matchId: string): Promise<void> {
  const supabase = createClient()

  // Get the match to find the bilateral pair
  const { data: match, error: fetchErr } = await supabase
    .from('daily_matches')
    .select('user_id, suggested_user_id, match_date, time_slot')
    .eq('id', matchId)
    .single()

  if (fetchErr) throw new Error(fetchErr.message)

  // Delete both directions
  const { error } = await supabase
    .from('daily_matches')
    .delete()
    .eq('match_date', match.match_date)
    .eq('time_slot', match.time_slot)
    .or(`and(user_id.eq.${match.user_id},suggested_user_id.eq.${match.suggested_user_id}),and(user_id.eq.${match.suggested_user_id},suggested_user_id.eq.${match.user_id})`)

  if (error) throw new Error(error.message)
}

export async function createManualMatch(
  userA: string,
  userB: string,
  date: string,
  slot: '07:00' | '19:00'
): Promise<void> {
  const supabase = createClient()

  const { data: { user: admin } } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('daily_matches')
    .insert([
      { user_id: userA, suggested_user_id: userB, match_date: date, time_slot: slot, assigned_by: admin?.id },
      { user_id: userB, suggested_user_id: userA, match_date: date, time_slot: slot, assigned_by: admin?.id },
    ])

  if (error) throw new Error(error.message)

  // Record in history
  await supabase
    .from('daily_match_history')
    .insert([
      { user_id: userA, shown_user_id: userB, shown_date: date },
      { user_id: userB, shown_user_id: userA, shown_date: date },
    ])
}

export async function swapMatch(
  matchId: string,
  newPartnerId: string
): Promise<void> {
  const supabase = createClient()

  // Get existing match
  const { data: match, error: fetchErr } = await supabase
    .from('daily_matches')
    .select('user_id, suggested_user_id, match_date, time_slot')
    .eq('id', matchId)
    .single()

  if (fetchErr) throw new Error(fetchErr.message)

  const oldPartner = match.suggested_user_id
  const user = match.user_id

  // Delete old bilateral pair
  await supabase
    .from('daily_matches')
    .delete()
    .eq('match_date', match.match_date)
    .eq('time_slot', match.time_slot)
    .or(`and(user_id.eq.${user},suggested_user_id.eq.${oldPartner}),and(user_id.eq.${oldPartner},suggested_user_id.eq.${user})`)

  const { data: { user: admin } } = await supabase.auth.getUser()

  // Create new bilateral pair
  const { error } = await supabase
    .from('daily_matches')
    .insert([
      { user_id: user, suggested_user_id: newPartnerId, match_date: match.match_date, time_slot: match.time_slot, assigned_by: admin?.id },
      { user_id: newPartnerId, suggested_user_id: user, match_date: match.match_date, time_slot: match.time_slot, assigned_by: admin?.id },
    ])

  if (error) throw new Error(error.message)

  // Record in history
  await supabase
    .from('daily_match_history')
    .insert([
      { user_id: user, shown_user_id: newPartnerId, shown_date: match.match_date },
      { user_id: newPartnerId, shown_user_id: user, shown_date: match.match_date },
    ])
}

export async function fetchAvailableUsersForDate(
  date: string,
  slot: '07:00' | '19:00'
): Promise<Array<{ id: string; name: string; company: string }>> {
  const supabase = createClient()

  const slotCol = slot === '07:00' ? 'slot_07' : 'slot_19'

  const { data: avail, error } = await supabase
    .from('user_availability')
    .select('user_id')
    .eq('available_date', date)
    .eq(slotCol, true)

  if (error) throw new Error(error.message)
  if (!avail || avail.length === 0) return []

  const userIds = avail.map(a => a.user_id)

  const { data: users } = await supabase
    .from('users')
    .select('id, full_name')
    .eq('status', 'active')
    .in('id', userIds)

  const { data: companies } = await supabase
    .from('companies')
    .select('user_id, name')
    .eq('is_primary', true)
    .in('user_id', userIds)

  const compMap = new Map<string, string>()
  for (const c of companies || []) compMap.set(c.user_id, c.name)

  return (users || []).map(u => ({
    id: u.id,
    name: u.full_name,
    company: compMap.get(u.id) || '',
  }))
}
