import type { SocialMatch, Message, Notification } from '@/types'
import { companies } from '@/data/mock-companies'
import { getCurrentUser } from './auth.service'

const KEYS = {
  LIKES: 'social_likes',
  MATCHES: 'social_matches',
  MESSAGES: 'social_messages',
  NOTIFICATIONS: 'social_notifications',
}

function getJSON<T>(key: string): T[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(key) || '[]') } catch { return [] }
}

export function getMatches(): (SocialMatch & { company: { id: number | string; name: string; image?: string | null; segment?: string } })[] {
  const matches = getJSON<SocialMatch>(KEYS.MATCHES)
  const user = getCurrentUser()
  if (!user) return []
  const allUsers = getJSON<{ id: string; companyName?: string; fullName?: string; avatar?: string; email?: string; phone?: string; segment?: string }>(
    'users'
  )
  return matches
    .filter(m => String(m.user1Id) === String(user.id) || String(m.user2Id) === String(user.id))
    .map(match => {
      const otherId = String(match.user1Id) === String(user.id) ? match.user2Id : match.user1Id
      const partner = companies.find(c => String(c.id) === String(otherId))
      let companyData: { id: number | string; name: string; image?: string | null; segment?: string }
      if (partner) {
        companyData = { id: partner.id, name: partner.name, image: partner.image, segment: partner.segment }
      } else {
        const up = allUsers.find(u => String(u.id) === String(otherId))
        companyData = up
          ? { id: up.id, name: up.companyName || up.fullName || 'Usuário', image: up.avatar, segment: up.segment || 'Empresário' }
          : { id: otherId, name: 'Usuário Desconhecido', image: null, segment: 'N/A' }
      }
      return { ...match, company: companyData }
    })
}

export function getMessages(matchId: number): Message[] {
  return getJSON<Message>(KEYS.MESSAGES)
    .filter(m => m.matchId === matchId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
}

export function sendMessage(matchId: number, text: string): Message {
  const user = getCurrentUser()
  if (!user) throw new Error('Not authenticated')
  const messages = getJSON<Message>(KEYS.MESSAGES)
  const msg: Message = {
    id: Date.now(), matchId, senderId: user.id, text,
    timestamp: new Date().toISOString(), read: false
  }
  localStorage.setItem(KEYS.MESSAGES, JSON.stringify([...messages, msg]))

  const matches = getJSON<SocialMatch>(KEYS.MATCHES)
  const match = matches.find(m => m.id === matchId)
  if (match) {
    const receiverId = String(match.user1Id) === String(user.id) ? match.user2Id : match.user1Id
    createNotification(receiverId, 'message', `Nova mensagem de ${user.companyName || user.fullName}`)
  }
  return msg
}

export function createMatch(otherUserId: string, source = 'manual'): SocialMatch {
  const user = getCurrentUser()
  if (!user) throw new Error('Not authenticated')
  const matches = getJSON<SocialMatch>(KEYS.MATCHES)
  const existing = matches.find(
    m => (String(m.user1Id) === String(user.id) && String(m.user2Id) === String(otherUserId)) ||
         (String(m.user1Id) === String(otherUserId) && String(m.user2Id) === String(user.id))
  )
  if (existing) return existing

  const newMatch: SocialMatch = {
    id: Date.now(), user1Id: user.id, user2Id: otherUserId,
    timestamp: new Date().toISOString(), source
  }
  localStorage.setItem(KEYS.MATCHES, JSON.stringify([...matches, newMatch]))

  let partnerName = companies.find(c => String(c.id) === String(otherUserId))?.name
  if (!partnerName) {
    const u = getJSON<{ id: string; companyName?: string; fullName?: string }>('users').find(x => String(x.id) === String(otherUserId))
    partnerName = u ? (u.companyName || u.fullName || 'Novo Parceiro') : 'Novo Parceiro'
  }
  createNotification(user.id, 'match', `Nova conexão com ${partnerName}!`)
  return newMatch
}

export function startConversation(targetUserId: string) {
  return createMatch(targetUserId, 'direct_message')
}

export function addLike(targetId: string): { status: 'match' | 'liked' | 'already_liked' } {
  const user = getCurrentUser()
  if (!user) return { status: 'already_liked' }
  const likes = getJSON<{ fromId: string; toId: string }>(KEYS.LIKES)
  if (likes.find(l => String(l.fromId) === String(user.id) && String(l.toId) === String(targetId))) return { status: 'already_liked' }

  localStorage.setItem(KEYS.LIKES, JSON.stringify([...likes, { fromId: user.id, toId: targetId, timestamp: new Date().toISOString() }]))

  const reverseLike = likes.find(l => String(l.fromId) === String(targetId) && String(l.toId) === String(user.id))
  if (reverseLike) {
    createMatch(targetId, 'mutual_like')
    return { status: 'match' }
  }
  return { status: 'liked' }
}

export function getNotifications(): Notification[] {
  const user = getCurrentUser()
  if (!user) return []
  return getJSON<Notification>(KEYS.NOTIFICATIONS)
    .filter(n => String(n.userId) === String(user.id))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

export function createNotification(userId: string, type: Notification['type'], content: string) {
  const all = getJSON<Notification>(KEYS.NOTIFICATIONS)
  const n: Notification = {
    id: Date.now() + Math.random(), userId, type, content,
    read: false, timestamp: new Date().toISOString()
  }
  localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify([...all, n]))
  return n
}

export function markNotificationsRead() {
  const user = getCurrentUser()
  if (!user) return
  const all = getJSON<Notification>(KEYS.NOTIFICATIONS)
  localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(
    all.map(n => String(n.userId) === String(user.id) ? { ...n, read: true } : n)
  ))
}
