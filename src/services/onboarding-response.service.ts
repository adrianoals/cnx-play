import { createClient } from '@/lib/supabase'

export interface OnboardingAnswers {
  impactGoals: string[]
  believesSingleConnection: boolean
  meetingsPerWeek: string
}

/** Retorna true se o usuário atual já respondeu o onboarding. */
export async function hasAnsweredOnboarding(): Promise<boolean> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data, error } = await supabase
    .from('onboarding_responses')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return !!data
}

/** Salva as respostas do onboarding. Falha se já existir (PK = user_id). */
export async function saveOnboardingResponse(answers: OnboardingAnswers): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado.')

  const { error } = await supabase
    .from('onboarding_responses')
    .insert({
      user_id: user.id,
      impact_goals: answers.impactGoals,
      believes_single_connection: answers.believesSingleConnection,
      meetings_per_week: answers.meetingsPerWeek,
    })

  if (error) throw new Error(error.message)
}
