import type { User } from '@/types'
import { createClient } from '@/lib/supabase'
import { mapProfile } from '@/lib/map-profile'

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
