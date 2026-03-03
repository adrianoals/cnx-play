import type { SupabaseDeal } from '@/types'

export function mapDeal(row: Record<string, unknown>): SupabaseDeal {
  const user = row.users as Record<string, unknown> | null | undefined

  return {
    id: row.id as string,
    authorId: row.author_id as string,
    companyName: (row.partner_company_name as string) || '',
    value: Number(row.value_brl) || 0,
    dealDate: (row.deal_date as string) || '',
    description: (row.description as string) || null,
    createdAt: (row.created_at as string) || new Date().toISOString(),
    authorName: user ? ((user.full_name as string) || '') : undefined,
    status: (row.status as SupabaseDeal['status']) || 'pending',
    adminApprovedBy: (row.admin_approved_by as string) || null,
    adminApprovedAt: (row.admin_approved_at as string) || null,
  }
}
