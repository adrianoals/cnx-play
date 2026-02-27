import type { Deal, Referral } from '@/types'

export const initialDeals: Deal[] = [
  { id: 101, companyName: "Varejo Total", value: 150000.00, date: "18/12/2025", author: "Alpha Marketing" },
  { id: 102, companyName: "Construtora Horizonte", value: 450000.50, date: "17/12/2025", author: "Legal Prime Advogados" },
  { id: 103, companyName: "Tech Solutions Global", value: 82000.00, date: "16/12/2025", author: "Logística Express" },
  { id: 104, companyName: "Inova Ventures", value: 1200000.00, date: "15/12/2025", author: "SoftHouse Dev" },
  { id: 105, companyName: "Saúde Mais", value: 25000.00, date: "14/12/2025", author: "RH Estratégico" },
]

export const referralsData: Referral[] = [
  { id: 1, name: "Roberto Almeida", status: "completed", points: 50, meetings: 1 },
  { id: 2, name: "Carla Dias", status: "active", points: 0, meetings: 0 },
  { id: 3, name: "Empresa X", status: "pending", points: 0, meetings: 0 },
]
