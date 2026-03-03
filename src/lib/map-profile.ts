import type { User } from '@/types'

/** Map Supabase row (snake_case) to frontend User (camelCase) */
export function mapProfile(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    name: (row.full_name as string) || '',
    fullName: (row.full_name as string) || '',
    email: (row.email as string) || '',
    phone: (row.phone as string) || '',
    role: (row.role as 'user' | 'admin') || 'user',
    status: (row.status as 'active' | 'pending' | 'inactive') || 'pending',
    cpf: (row.cpf as string) || undefined,
    birthDate: (row.birth_date as string) || undefined,
    address: (row.address as string) || undefined,
    avatar: (row.avatar_url as string) || null,
    referralCode: (row.referral_code as string) || undefined,
    createdAt: (row.created_at as string) || new Date().toISOString(),
    score: 0,
    totalValue: 0,
  }
}
