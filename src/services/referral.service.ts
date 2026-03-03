import type { SupabaseReferral } from '@/types'
import { createClient } from '@/lib/supabase'
import { mapReferral } from '@/lib/map-referral'

export async function createReferral(input: {
  referredName: string
  referredEmail: string
  referredPhone: string
}): Promise<SupabaseReferral> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado.')

  const { data, error } = await supabase
    .from('referrals')
    .insert({
      referrer_id: user.id,
      referred_name: input.referredName,
      referred_email: input.referredEmail || null,
      referred_phone: input.referredPhone || null,
      status: 'pending',
      points_awarded: 0,
      meetings_awarded: 0,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return mapReferral(data)
}

export async function fetchMyReferrals(): Promise<SupabaseReferral[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('referrals')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data || []).map(mapReferral)
}
