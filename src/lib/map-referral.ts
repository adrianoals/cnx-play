import type { SupabaseReferral } from '@/types'

export function mapReferral(row: Record<string, unknown>): SupabaseReferral {
  const user = row.users as Record<string, unknown> | null | undefined

  return {
    id: row.id as string,
    referrerId: row.referrer_id as string,
    referredName: (row.referred_name as string) || '',
    referredEmail: (row.referred_email as string) || null,
    referredPhone: (row.referred_phone as string) || null,
    status: (row.status as SupabaseReferral['status']) || 'pending',
    pointsAwarded: (row.points_awarded as number) || 0,
    createdAt: (row.created_at as string) || new Date().toISOString(),
    referrerName: user ? ((user.full_name as string) || '') : undefined,
  }
}
