export interface User {
  id: string
  name: string
  fullName: string
  email: string
  role: 'user' | 'admin'
  status: 'active' | 'pending' | 'inactive'
  createdAt: string
  score: number
  totalValue: number
  phone: string
  cpf?: string
  address?: string
  birthDate?: string
  avatar?: string | null
  referralCode?: string
  metadata?: Record<string, string>
  /** @deprecated Use company.service instead */
  companyName?: string
  /** @deprecated Use company.service instead */
  cnpj?: string
  /** @deprecated Use company.service instead */
  segment?: string
  /** @deprecated Use company.service instead */
  gallery?: string[]
}

export interface LocalCompany {
  id: string
  userId: string
  name: string
  cnpj?: string
  category?: string
  description?: string
  location?: string
  contactEmail?: string
  contactPhone?: string
  linkedin?: string
  opportunities?: string[]
  isPrimary: boolean
  gallery: string[]
  createdAt: string
  updatedAt: string
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

export interface AdminCompany {
  id: string
  userId: string
  name: string
  cnpj?: string
  categoryId?: string
  description?: string
  location?: string
  contactEmail?: string
  contactPhone?: string
  linkedin?: string
  opportunities: string[]
  gallery: string[]
  isPrimary: boolean
  createdAt: string
  updatedAt: string
  ownerName: string
  ownerEmail: string
  categoryName?: string
}

export interface Deal {
  id: number
  companyName: string
  value: number
  date: string
  author: string
}

export interface DailyMatchRow {
  id: string
  userId: string
  suggestedUserId: string
  matchDate: string
  timeSlot: '07:00' | '19:00'
  status: 'pending' | 'completed'
  createdAt: string
  partnerName?: string
  partnerAvatar?: string | null
  partnerCompany?: string
  partnerCategory?: string
}

export interface MatchHistoryItem extends DailyMatchRow {
  bothConfirmed: boolean
}

/** Item de listagem nas abas Recebidas/Enviadas — partner-centric com status */
export interface ConnectionListItem {
  connectionId: string
  partnerId: string
  partnerName: string
  partnerAvatar: string | null
  partnerCompany: string
  partnerCategory: string
  partnerPhone: string | null
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: string
  respondedAt: string | null
}

/** Conexão do dia — dados completos do parceiro para exibição */
export interface TodayConnection {
  matchId: string
  matchDate: string
  timeSlot: '07:00' | '19:00'
  status: 'pending' | 'completed'
  partnerId: string
  partnerName: string
  partnerAvatar: string | null
  partnerCompany: string
  partnerCategory: string
  partnerPhone: string | null
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
  user1Id: string
  user2Id: string
  timestamp: string
  source: string
  company?: {
    id: number | string
    name: string
    image?: string | null
    segment?: string
  }
}

export interface Connection {
  id: string
  requesterId: string
  requestedId: string
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: string
  respondedAt: string | null
  requesterName?: string
  requesterAvatar?: string | null
  requesterCompany?: string
  requestedName?: string
  requestedAvatar?: string | null
  requestedCompany?: string
}

export interface Message {
  id: string
  senderId: string
  receiverId: string
  text: string
  createdAt: string
  read: boolean
}

export interface Notification {
  id: string
  userId: string
  type: 'connection' | 'message' | 'meeting' | 'daily_match' | 'referral' | 'system'
  title: string
  content: string
  read: boolean
  createdAt: string
  referenceId?: string | null
  referenceType?: string | null
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

export interface Category {
  id: string
  name: string
  slug: string
  sortOrder: number
}

// ── Magazine ──────────────────────────────────────────────

export interface MagazineEntrepreneur {
  id: string
  name: string
  companyName: string
  roleTitle: string
  photoUrl: string
  bio: string
  bioFull: string | null
  institutionalText: string | null
  institutionalTextFull: string | null
  instagram: string | null
  phone: string | null
  displayOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// ── Supabase-backed types ──────────────────────────────────

export interface UserStats {
  userId: string
  fullName: string
  companyName: string | null
  meetingsCompleted: number
  referralsCompleted: number
  referralPoints: number
  totalDealValue: number
  dealCount: number
  score: number
  level: string
}

export interface PlatformTotals {
  activeUsers: number
  totalMeetings: number
  totalDealValue: number
  totalDeals: number
  totalReferrals: number
  pendingApprovals: number
}

export interface SupabaseDeal {
  id: string
  authorId: string
  authorCompanyId?: string | null
  authorCompanyName?: string
  companyName: string
  value: number
  dealDate: string
  description: string | null
  createdAt: string
  authorName?: string
  status: 'pending' | 'approved' | 'rejected'
  adminApprovedBy?: string | null
  adminApprovedAt?: string | null
}

export interface SupabaseReferral {
  id: string
  referrerId: string
  referredName: string
  referredEmail: string | null
  referredPhone: string | null
  status: 'pending' | 'completed' | 'rejected'
  pointsAwarded: number
  createdAt: string
  referrerName?: string
}

export interface LeaderboardRow {
  userId: string
  fullName: string
  companyName: string | null
  avatarUrl: string | null
  score: number
  meetingsCompleted: number
  totalDealValue: number
  dealCount: number
  level: string
  rankPosition: number
}
