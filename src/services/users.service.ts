import type { User } from '@/types'
import { SUPER_ADMINS } from '@/lib/constants'

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

export async function getAllUsers(): Promise<User[]> {
  return getStoredUsers()
}

export async function updateUser(id: number, data: Partial<User>): Promise<User> {
  const users = getStoredUsers()
  const idx = users.findIndex(u => u.id === id)
  if (idx === -1) throw new Error('Usuário não encontrado')
  users[idx] = { ...users[idx], ...data, fullName: data.name || users[idx].fullName }
  saveUsers(users)
  return users[idx]
}

export async function deleteUser(id: number): Promise<void> {
  const users = getStoredUsers()
  const user = users.find(u => u.id === id)
  if (user && SUPER_ADMINS.includes(user.email.toLowerCase())) {
    throw new Error('Não é possível excluir um Usuário Mestre.')
  }
  saveUsers(users.filter(u => u.id !== id))
}

export async function changeStatus(id: number, status: User['status']): Promise<void> {
  const users = getStoredUsers()
  const idx = users.findIndex(u => u.id === id)
  if (idx === -1) return
  users[idx] = { ...users[idx], status }
  saveUsers(users)
}

export async function createUser(data: Partial<User> & { name: string; email: string; password: string }): Promise<User> {
  const users = getStoredUsers()
  if (users.some(u => u.email?.toLowerCase() === data.email.toLowerCase())) {
    throw new Error('Email já cadastrado.')
  }
  const newUser: User = {
    id: Date.now(), name: data.name, fullName: data.name, email: data.email,
    password: data.password, role: data.role || 'user', status: data.status || 'active',
    createdAt: new Date().toLocaleDateString('pt-BR'), score: 0, totalValue: 0,
    companyName: data.companyName || '', phone: data.phone || '',
    cpf: data.cpf, cnpj: data.cnpj,
  }
  saveUsers([...users, newUser])
  return newUser
}
