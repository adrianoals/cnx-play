import type { User } from '@/types'

export const MOCK_SEED_USERS: User[] = [
  { id: 1, name: "Lucas Reccchia", fullName: "Lucas Reccchia", email: "lucasreccchia@companyconexaoplay.com", password: "admin", role: "admin", createdAt: "2025-12-01", status: "active", score: 1250, totalValue: 0, companyName: "Conexão Play", phone: "11999999999" },
  { id: 99, name: "Lucas Reccchia", fullName: "Lucas Reccchia", email: "lucasreccchia@gmail.com", password: "admin", role: "admin", createdAt: "2025-12-01", status: "active", score: 1500, totalValue: 0, companyName: "Conexão Play", phone: "11999999999" },
  { id: 2, name: "Empresa Alpha", fullName: "Empresa Alpha", email: "contato@alpha.com", password: "123", role: "user", createdAt: "2025-12-15", status: "pending", score: 0, totalValue: 0, companyName: "Alpha Ltd", phone: "21988887777" },
  { id: 3, name: "Tech Soluções", fullName: "Tech Soluções", email: "admin@techsolucoes.com", password: "123", role: "user", createdAt: "2025-11-20", status: "inactive", score: 120, totalValue: 15000, companyName: "Tech Solutions", phone: "31977776666" },
  { id: 100, name: "Usuário Teste", fullName: "Usuário Teste", email: "teste@conexao.com", password: "123", role: "user", createdAt: "2025-12-20", status: "active", score: 500, totalValue: 0, companyName: "Empresa de Teste Ltda", phone: "11950222063" },
]

export const criticalUsers = [
  { email: "lucasreccchia@companyconexaoplay.com", name: "Lucas Reccchia", password: "admin", role: "admin" as const, company: "Conexão Play (Admin)" },
  { email: "lucasreccchia@gmail.com", name: "Lucas Reccchia", password: "admin", role: "admin" as const, company: "Conexão Play (Pessoal)" },
  { email: "teste@conexao.com", name: "Usuário Teste", password: "123", role: "user" as const, company: "Empresa de Teste Ltda" },
]
