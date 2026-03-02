import type { LocalCompany } from '@/types'

const STORAGE_KEY = 'companies'

function getAll(): LocalCompany[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch { return [] }
}

function saveAll(companies: LocalCompany[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(companies))
}

export function getAllCompanies(): LocalCompany[] {
  return getAll()
}

export function getCompaniesByUserId(userId: string): LocalCompany[] {
  return getAll().filter(c => String(c.userId) === String(userId))
}

export function getPrimaryCompany(userId: string): LocalCompany | null {
  const userCompanies = getCompaniesByUserId(userId)
  return userCompanies.find(c => c.isPrimary) || userCompanies[0] || null
}

export function getCompanyById(id: string): LocalCompany | null {
  return getAll().find(c => String(c.id) === String(id)) || null
}

export function createCompany(data: Omit<LocalCompany, 'id' | 'createdAt' | 'updatedAt'>): LocalCompany {
  const companies = getAll()
  const now = new Date().toISOString()
  const newCompany: LocalCompany = {
    ...data,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  }

  // If this is the first company for user, force isPrimary
  if (!companies.some(c => String(c.userId) === String(data.userId))) {
    newCompany.isPrimary = true
  }

  // If setting as primary, unset others
  if (newCompany.isPrimary) {
    companies.forEach(c => {
      if (String(c.userId) === String(data.userId)) c.isPrimary = false
    })
  }

  companies.push(newCompany)
  saveAll(companies)
  syncUserCompanyName(data.userId)
  return newCompany
}

export function updateCompany(id: string, data: Partial<LocalCompany>): LocalCompany {
  const companies = getAll()
  const idx = companies.findIndex(c => String(c.id) === String(id))
  if (idx === -1) throw new Error('Empresa não encontrada.')

  const updated = { ...companies[idx], ...data, updatedAt: new Date().toISOString() }

  // If setting as primary, unset others
  if (data.isPrimary) {
    companies.forEach(c => {
      if (String(c.userId) === String(updated.userId) && String(c.id) !== String(id)) c.isPrimary = false
    })
  }

  companies[idx] = updated
  saveAll(companies)
  syncUserCompanyName(updated.userId)
  return updated
}

export function deleteCompany(id: string): void {
  const companies = getAll()
  const company = companies.find(c => String(c.id) === String(id))
  if (!company) return

  const filtered = companies.filter(c => String(c.id) !== String(id))

  // If deleted was primary, promote next one
  if (company.isPrimary) {
    const next = filtered.find(c => String(c.userId) === String(company.userId))
    if (next) next.isPrimary = true
  }

  saveAll(filtered)
  syncUserCompanyName(company.userId)
}

export function addGalleryImage(companyId: string, imageUrl: string): void {
  const companies = getAll()
  const company = companies.find(c => String(c.id) === String(companyId))
  if (!company) return

  company.gallery.push(imageUrl)
  company.updatedAt = new Date().toISOString()
  saveAll(companies)
}

export function removeGalleryImage(companyId: string, index: number): void {
  const companies = getAll()
  const company = companies.find(c => String(c.id) === String(companyId))
  if (!company) return

  company.gallery = company.gallery.filter((_, i) => i !== index)
  company.updatedAt = new Date().toISOString()
  saveAll(companies)
}

/** Backward compat: sync primary company name to user object */
function syncUserCompanyName(userId: string): void {
  const primary = getPrimaryCompany(userId)

  // Sync current_user
  try {
    const raw = localStorage.getItem('current_user')
    if (raw) {
      const user = JSON.parse(raw)
      if (String(user.id) === String(userId)) {
        user.companyName = primary?.name || ''
        localStorage.setItem('current_user', JSON.stringify(user))
      }
    }
  } catch { /* ignore */ }
}
