import type { AdminCompany } from '@/types'

/** Map Supabase company row (snake_case) to frontend AdminCompany (camelCase) */
export function mapCompany(row: Record<string, unknown>): AdminCompany {
  const user = row.users as Record<string, unknown> | null | undefined
  const category = row.categories as Record<string, unknown> | null | undefined

  return {
    id: row.id as string,
    userId: row.user_id as string,
    name: (row.name as string) || '',
    cnpj: (row.cnpj as string) || undefined,
    categoryId: (row.category_id as string) || undefined,
    description: (row.description as string) || undefined,
    location: (row.location as string) || undefined,
    contactEmail: (row.contact_email as string) || undefined,
    contactPhone: (row.contact_phone as string) || undefined,
    linkedin: (row.linkedin as string) || undefined,
    opportunities: (row.opportunities as string[]) || [],
    gallery: (row.gallery as string[]) || [],
    isPrimary: (row.is_primary as boolean) ?? true,
    createdAt: (row.created_at as string) || new Date().toISOString(),
    updatedAt: (row.updated_at as string) || new Date().toISOString(),
    ownerName: user ? ((user.full_name as string) || '') : '',
    ownerEmail: user ? ((user.email as string) || '') : '',
    categoryName: category ? (category.name as string) : undefined,
  }
}
