import type { LocalCompany } from '@/types'

const SCHEMA_VERSION_KEY = 'cnxplay_schema_version'
const CURRENT_VERSION = 2

export function migrateLocalStorage(): void {
  if (typeof window === 'undefined') return
  const version = parseInt(localStorage.getItem(SCHEMA_VERSION_KEY) || '1')
  if (version >= CURRENT_VERSION) return

  if (version < 2) migrateV1toV2()

  localStorage.setItem(SCHEMA_VERSION_KEY, CURRENT_VERSION.toString())
}

function migrateV1toV2(): void {
  const users: Record<string, unknown>[] = JSON.parse(localStorage.getItem('users') || '[]')
  const existingCompanies: LocalCompany[] = JSON.parse(localStorage.getItem('companies') || '[]')

  const now = new Date().toISOString()

  users.forEach(user => {
    const userId = user.id as number
    const companyName = user.companyName as string | undefined

    // Skip if user has no company name or already has a company entry
    if (!companyName || existingCompanies.some(c => c.userId === userId)) return

    existingCompanies.push({
      id: Date.now() + Math.floor(Math.random() * 10000) + userId,
      userId,
      name: companyName,
      cnpj: (user.cnpj as string) || undefined,
      category: (user.segment as string) || undefined,
      description: (user.companyDescription as string) || undefined,
      location: (user.companyLocation as string) || (user.address as string) || undefined,
      contactEmail: (user.contactEmail as string) || undefined,
      contactPhone: (user.contactPhone as string) || undefined,
      linkedin: (user.linkedin as string) || undefined,
      isPrimary: true,
      gallery: (user.gallery as string[]) || [],
      createdAt: (user.createdAt as string) || now,
      updatedAt: now,
    })
  })

  localStorage.setItem('companies', JSON.stringify(existingCompanies))
}
