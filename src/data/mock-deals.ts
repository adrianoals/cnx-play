import type { Deal, Referral, LeaderboardEntry } from '@/types'

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

export const leaderboardData: LeaderboardEntry[] = [
  { id: 1, name: "Lucas Recchia", company: "Conexão Play", value: 2500000, meetings: 180 },
  { id: 2, name: "Ana Beatriz", company: "Alpha Marketing", value: 1800000, meetings: 150 },
  { id: 3, name: "Carlos Eduardo", company: "Legal Prime", value: 1500000, meetings: 130 },
  { id: 4, name: "Mariana Santos", company: "Tech Solutions", value: 1200000, meetings: 110 },
  { id: 5, name: "Rafael Costa", company: "Construtora Horizonte", value: 950000, meetings: 95 },
  { id: 6, name: "Juliana Ferreira", company: "Saúde Mais", value: 800000, meetings: 80 },
  { id: 7, name: "Pedro Henrique", company: "Logística Express", value: 650000, meetings: 70 },
  { id: 8, name: "Fernanda Lima", company: "Energia Solar", value: 500000, meetings: 60 },
  { id: 9, name: "Gustavo Rocha", company: "AgroTech", value: 380000, meetings: 52 },
  { id: 10, name: "Isabela Mendes", company: "EduTech", value: 250000, meetings: 45 },
]
