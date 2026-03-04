import { createClient } from '@/lib/supabase'
import type { UserAvailability } from '@/types'

const supabase = () => createClient()

async function getMyId(): Promise<string> {
  const { data: { user } } = await supabase().auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return user.id
}

function mapRow(row: Record<string, unknown>): UserAvailability {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    availableDate: row.available_date as string,
    slot07: row.slot_07 as boolean,
    slot19: row.slot_19 as boolean,
  }
}

export async function fetchWeekAvailability(weekStart: string): Promise<UserAvailability[]> {
  const me = await getMyId()

  // Calculate end of week (7 days from start)
  const start = new Date(weekStart + 'T00:00:00')
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const weekEnd = end.toISOString().slice(0, 10)

  const { data, error } = await supabase()
    .from('user_availability')
    .select('*')
    .eq('user_id', me)
    .gte('available_date', weekStart)
    .lte('available_date', weekEnd)
    .order('available_date')

  if (error) throw error
  return (data || []).map(mapRow)
}

export async function upsertDayAvailability(
  date: string,
  slot07: boolean,
  slot19: boolean
): Promise<UserAvailability> {
  const me = await getMyId()

  const { data, error } = await supabase()
    .from('user_availability')
    .upsert(
      {
        user_id: me,
        available_date: date,
        slot_07: slot07,
        slot_19: slot19,
      },
      { onConflict: 'user_id,available_date' }
    )
    .select('*')
    .single()

  if (error) throw error
  return mapRow(data)
}
