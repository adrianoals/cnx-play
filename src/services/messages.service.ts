import { createClient } from '@/lib/supabase'
import type { Message } from '@/types'

const supabase = () => createClient()

async function getMyId(): Promise<string> {
  const { data: { user } } = await supabase().auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return user.id
}

export interface Conversation {
  otherUserId: string
  otherUserName: string
  otherUserAvatar: string | null
  otherUserCompany: string
  connectionId: string
  lastMessage: string | null
  lastMessageAt: string | null
  unreadCount: number
}

export async function fetchConversations(): Promise<Conversation[]> {
  const me = await getMyId()

  // Get accepted connections
  const { data: connections, error: connErr } = await supabase()
    .from('connections')
    .select('id, requester_id, requested_id')
    .eq('status', 'accepted')
    .or(`requester_id.eq.${me},requested_id.eq.${me}`)

  if (connErr) throw connErr
  if (!connections || connections.length === 0) return []

  // Collect other user IDs
  const otherIds: string[] = []
  const connMap = new Map<string, string>() // otherUserId -> connectionId
  for (const c of connections) {
    const otherId = c.requester_id === me ? c.requested_id : c.requester_id
    otherIds.push(otherId)
    connMap.set(otherId, c.id)
  }

  // Fetch user info
  const { data: users } = await supabase()
    .from('users')
    .select('id, full_name, avatar_url')
    .in('id', otherIds)

  const { data: comps } = await supabase()
    .from('companies')
    .select('user_id, name')
    .eq('is_primary', true)
    .in('user_id', otherIds)

  const userMap = new Map<string, { full_name: string; avatar_url: string | null }>()
  for (const u of users || []) userMap.set(u.id, u)
  const compMap = new Map<string, string>()
  for (const c of comps || []) compMap.set(c.user_id, c.name)

  // Fetch all messages involving me to compute last message & unread count per conversation
  const { data: allMessages } = await supabase()
    .from('messages')
    .select('sender_id, receiver_id, text, created_at, read')
    .or(`sender_id.eq.${me},receiver_id.eq.${me}`)
    .order('created_at', { ascending: false })

  // Group by other user
  const msgByUser = new Map<string, { lastText: string; lastAt: string; unread: number }>()
  for (const msg of allMessages || []) {
    const otherId = msg.sender_id === me ? msg.receiver_id : msg.sender_id
    if (!connMap.has(otherId)) continue
    const existing = msgByUser.get(otherId)
    const isUnread = msg.receiver_id === me && !msg.read
    if (!existing) {
      msgByUser.set(otherId, { lastText: msg.text, lastAt: msg.created_at, unread: isUnread ? 1 : 0 })
    } else {
      if (isUnread) existing.unread++
    }
  }

  // Build conversations
  const conversations: Conversation[] = otherIds.map(otherId => {
    const userInfo = userMap.get(otherId)
    const msgInfo = msgByUser.get(otherId)
    return {
      otherUserId: otherId,
      otherUserName: userInfo?.full_name || 'Usuário',
      otherUserAvatar: userInfo?.avatar_url ?? null,
      otherUserCompany: compMap.get(otherId) || '',
      connectionId: connMap.get(otherId)!,
      lastMessage: msgInfo?.lastText ?? null,
      lastMessageAt: msgInfo?.lastAt ?? null,
      unreadCount: msgInfo?.unread ?? 0,
    }
  })

  // Sort: conversations with messages first (by last message date desc), then without messages
  conversations.sort((a, b) => {
    if (a.lastMessageAt && b.lastMessageAt) {
      return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    }
    if (a.lastMessageAt) return -1
    if (b.lastMessageAt) return 1
    return 0
  })

  return conversations
}

export async function fetchMessages(otherUserId: string): Promise<Message[]> {
  const me = await getMyId()

  const { data, error } = await supabase()
    .from('messages')
    .select('*')
    .or(
      `and(sender_id.eq.${me},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${me})`
    )
    .order('created_at', { ascending: true })

  if (error) throw error

  return (data || []).map(row => ({
    id: row.id,
    senderId: row.sender_id,
    receiverId: row.receiver_id,
    text: row.text,
    createdAt: row.created_at,
    read: row.read,
  }))
}

export async function sendMessage(receiverId: string, text: string): Promise<Message> {
  const me = await getMyId()

  const { data, error } = await supabase()
    .from('messages')
    .insert({ sender_id: me, receiver_id: receiverId, text })
    .select('*')
    .single()

  if (error) throw error

  return {
    id: data.id,
    senderId: data.sender_id,
    receiverId: data.receiver_id,
    text: data.text,
    createdAt: data.created_at,
    read: data.read,
  }
}

export async function markMessagesRead(otherUserId: string): Promise<void> {
  const me = await getMyId()

  const { error } = await supabase()
    .from('messages')
    .update({ read: true })
    .eq('sender_id', otherUserId)
    .eq('receiver_id', me)
    .eq('read', false)

  if (error) throw error
}

export async function deleteConversation(otherUserId: string): Promise<void> {
  const me = await getMyId()

  const { error } = await supabase()
    .from('messages')
    .delete()
    .or(
      `and(sender_id.eq.${me},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${me})`
    )

  if (error) throw error
}
