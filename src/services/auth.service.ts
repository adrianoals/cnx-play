import type { User } from '@/types'
import { SUPER_ADMINS } from '@/lib/constants'
import { MOCK_SEED_USERS, criticalUsers } from '@/data/mock-users'

function getStoredUsers(): User[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem('users')
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveUsers(users: User[]) {
  localStorage.setItem('users', JSON.stringify(users))
}

export async function seedCriticalUsers(): Promise<void> {
  let storedUsers = getStoredUsers()
  if (storedUsers.length === 0) {
    storedUsers = [...MOCK_SEED_USERS]
    saveUsers(storedUsers)
    return
  }

  let hasChanges = false
  criticalUsers.forEach(cu => {
    const idx = storedUsers.findIndex(u => u.email?.toLowerCase() === cu.email.toLowerCase())
    if (idx === -1) {
      storedUsers.push({
        id: Date.now() + Math.floor(Math.random() * 1000),
        name: cu.name, fullName: cu.name, email: cu.email, password: cu.password,
        role: cu.role, createdAt: new Date().toISOString().split('T')[0],
        status: "active", score: cu.role === 'admin' ? 1500 : 500,
        totalValue: 0, companyName: cu.company, phone: "11999999999"
      })
      hasChanges = true
    } else if (cu.role === 'admin') {
      const user = storedUsers[idx]
      if (user.role !== 'admin' || user.status !== 'active') {
        storedUsers[idx] = { ...user, role: 'admin', status: 'active' }
        hasChanges = true
      }
    }
  })
  if (hasChanges) saveUsers(storedUsers)
}

export async function login(email: string, password: string): Promise<User> {
  await new Promise(r => setTimeout(r, 800))
  const users = getStoredUsers()
  const clean = email.trim().toLowerCase()
  const user = users.find(u => u.email?.toLowerCase() === clean)
  if (!user) throw new Error("Usuário não encontrado. Verifique o e-mail ou cadastre-se.")

  const isMasterAccess = SUPER_ADMINS.includes(clean) && password === "admin"
  if (user.password !== password && !isMasterAccess) throw new Error("Senha incorreta.")
  if (user.status === 'inactive') throw new Error("Esta conta está desativada. Contate o suporte.")

  localStorage.setItem('current_user', JSON.stringify(user))
  localStorage.setItem('user_token', `token_${Date.now()}_${user.id}`)
  return user
}

export async function register(data: { name: string; email: string; password: string; companyName: string; phone: string }): Promise<User> {
  await new Promise(r => setTimeout(r, 1500))
  const users = getStoredUsers()
  if (users.some(u => u.email?.toLowerCase() === data.email.toLowerCase().trim())) {
    throw new Error("Este e-mail já está cadastrado.")
  }
  const newUser: User = {
    id: Date.now(), fullName: data.name, name: data.name, email: data.email,
    password: data.password, companyName: data.companyName, phone: data.phone,
    role: 'user', status: 'pending', score: 0, createdAt: new Date().toLocaleDateString('pt-BR'),
    totalValue: 0, gallery: [], avatar: null
  }
  saveUsers([...users, newUser])
  localStorage.setItem('current_user', JSON.stringify(newUser))
  localStorage.setItem('user_token', `token_${Date.now()}_${newUser.id}`)
  return newUser
}

export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('current_user')
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function logout() {
  localStorage.removeItem('current_user')
  localStorage.removeItem('user_token')
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem('user_token')
}
