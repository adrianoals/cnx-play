import type { User } from '@/types'
import { createClient } from '@/lib/supabase'
import { mapProfile } from '@/lib/map-profile'

/** Fetch user profile from public.users */
export async function fetchProfile(userId: string): Promise<User | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error || !data) return null
  return mapProfile(data)
}

export async function login(email: string, password: string): Promise<User> {
  const supabase = createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  })

  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      throw new Error('E-mail ou senha incorretos.')
    }
    if (error.message.includes('Email not confirmed')) {
      throw new Error('E-mail não confirmado. Verifique sua caixa de entrada.')
    }
    throw new Error(error.message)
  }

  if (!data.user) throw new Error('Erro ao realizar login.')

  const profile = await fetchProfile(data.user.id)
  if (!profile) throw new Error('Perfil não encontrado. Contate o suporte.')

  if (profile.status === 'inactive') {
    await supabase.auth.signOut()
    throw new Error('Esta conta está desativada. Contate o suporte.')
  }

  // Backward compat: store in localStorage for components that still read directly
  localStorage.setItem('current_user', JSON.stringify(profile))
  localStorage.setItem('user_token', `sb_${data.session?.access_token?.slice(-20)}`)

  return profile
}

export async function register(data: {
  name: string
  email: string
  password: string
  phone: string
}): Promise<User> {
  const supabase = createClient()

  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email.trim().toLowerCase(),
    password: data.password,
    options: {
      data: {
        full_name: data.name,
        phone: data.phone,
      },
    },
  })

  if (error) {
    if (error.message.includes('already registered') || error.message.includes('already been registered')) {
      throw new Error('Este e-mail já está cadastrado.')
    }
    if (error.message.includes('Password should be at least')) {
      throw new Error('A senha deve ter pelo menos 6 caracteres.')
    }
    throw new Error(error.message)
  }

  if (!authData.user) throw new Error('Erro ao criar conta.')

  // Wait briefly for the trigger to create the profile
  await new Promise(r => setTimeout(r, 500))

  const profile = await fetchProfile(authData.user.id)
  if (!profile) {
    // Trigger may not have fired yet, build profile from auth data
    const fallback: User = {
      id: authData.user.id,
      name: data.name,
      fullName: data.name,
      email: data.email,
      phone: data.phone,
      role: 'user',
      status: 'pending',
      createdAt: new Date().toISOString(),
      score: 0,
      totalValue: 0,
    }
    localStorage.setItem('current_user', JSON.stringify(fallback))
    localStorage.setItem('user_token', `sb_${authData.session?.access_token?.slice(-20) || 'new'}`)
    return fallback
  }

  localStorage.setItem('current_user', JSON.stringify(profile))
  localStorage.setItem('user_token', `sb_${authData.session?.access_token?.slice(-20) || 'new'}`)

  return profile
}

export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('current_user')
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export async function getCurrentUserAsync(): Promise<User | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    localStorage.removeItem('current_user')
    localStorage.removeItem('user_token')
    return null
  }

  const profile = await fetchProfile(user.id)
  if (profile) {
    localStorage.setItem('current_user', JSON.stringify(profile))
  }
  return profile
}

export async function logout() {
  const supabase = createClient()
  await supabase.auth.signOut()
  localStorage.removeItem('current_user')
  localStorage.removeItem('user_token')
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem('user_token')
}
