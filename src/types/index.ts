export interface User {
  id: number
  name: string
  fullName: string
  email: string
  password: string
  role: 'user' | 'admin'
  status: 'active' | 'pending' | 'inactive'
  createdAt: string
  score: number
  totalValue: number
  companyName: string
  phone: string
  cpf?: string
  cnpj?: string
  address?: string
  birthDate?: string
  segment?: string
  avatar?: string | null
  gallery?: string[]
  metadata?: Record<string, string>
}

export interface Company {
  id: number
  name: string
  segment: string
  description: string
  location: string
  image: string
  contact: {
    email: string
    phone: string
    linkedin: string
  }
  opportunities?: string[]
}

export interface Deal {
  id: number
  companyName: string
  value: number
  date: string
  author: string
}

export interface DailyMatch {
  id: number
  name: string
  segment: string
  contact: string
  phone: string
  time: string
  status: 'pending' | 'completed'
  image: string
}

export interface Meeting {
  id: number
  company: string
  contact: string
  role?: string
  time: string
  date: string
  duration?: string
  platform?: string
  link?: string
  status: 'scheduled' | 'completed'
  rating?: number
  topics?: string[]
  email?: string
  phone?: string
}

export interface SocialMatch {
  id: number
  user1Id: number
  user2Id: number
  timestamp: string
  source: string
  company?: {
    id: number
    name: string
    image?: string | null
    segment?: string
  }
}

export interface Message {
  id: number
  matchId: number
  senderId: number
  text: string
  timestamp: string
  read: boolean
}

export interface Notification {
  id: number
  userId: number
  type: 'match' | 'message' | 'like' | 'system'
  content: string
  read: boolean
  timestamp: string
}

export interface Referral {
  id: number
  name: string
  status: 'completed' | 'active' | 'pending'
  points: number
  meetings: number
}

export interface LeaderboardEntry {
  id: number
  name: string
  company: string
  value: number
  meetings: number
}
