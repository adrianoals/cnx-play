import type { User, AdminCompany, SupabaseReferral } from '@/types'
import { createClient } from '@/lib/supabase'
import { mapProfile } from '@/lib/map-profile'
import { mapCompany } from '@/lib/map-company'
import { mapReferral } from '@/lib/map-referral'

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
    .select('*, users(full_name, email)')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data || []).map(mapCompany)
}

export async function createCompanyForUser(input: {
  userId: string
  name: string
  cnpj?: string
  description?: string
  location?: string
  contactEmail?: string
  contactPhone?: string
  linkedin?: string
  isPrimary?: boolean
}): Promise<AdminCompany> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('companies')
    .insert({
      user_id: input.userId,
      name: input.name,
      cnpj: input.cnpj || null,
      description: input.description || null,
      location: input.location || null,
      contact_email: input.contactEmail || null,
      contact_phone: input.contactPhone || null,
      linkedin: input.linkedin || null,
      is_primary: input.isPrimary ?? true,
    })
    .select('*, users(full_name, email)')
    .single()

  if (error) throw new Error(error.message)
  return mapCompany(data)
}

export async function updateCompanyAdmin(
  id: string,
  updates: {
    name?: string
    cnpj?: string
    description?: string
    location?: string
    contactEmail?: string
    contactPhone?: string
    linkedin?: string
    isPrimary?: boolean
  }
): Promise<AdminCompany> {
  const supabase = createClient()

  const payload: Record<string, unknown> = {}
  if (updates.name !== undefined) payload.name = updates.name
  if (updates.cnpj !== undefined) payload.cnpj = updates.cnpj || null
  if (updates.description !== undefined) payload.description = updates.description || null
  if (updates.location !== undefined) payload.location = updates.location || null
  if (updates.contactEmail !== undefined) payload.contact_email = updates.contactEmail || null
  if (updates.contactPhone !== undefined) payload.contact_phone = updates.contactPhone || null
  if (updates.linkedin !== undefined) payload.linkedin = updates.linkedin || null
  if (updates.isPrimary !== undefined) payload.is_primary = updates.isPrimary

  const { data, error } = await supabase
    .from('companies')
    .update(payload)
    .eq('id', id)
    .select('*, users(full_name, email)')
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

// ── Referrals ──────────────────────────────────────────────

export async function fetchAllReferrals(): Promise<SupabaseReferral[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('referrals')
    .select('*, users(full_name)')
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
