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

  const { data, error } = await supabase().rpc('get_conversations', { p_user_id: me })
  if (error) throw error
  if (!data || !Array.isArray(data)) return []

  return (data as Record<string, unknown>[]).map(row => ({
    otherUserId: row.other_user_id as string,
    otherUserName: (row.other_user_name as string) || 'Usuário',
    otherUserAvatar: (row.other_user_avatar as string) ?? null,
    otherUserCompany: (row.other_user_company as string) || '',
    connectionId: row.connection_id as string,
    lastMessage: (row.last_message as string) ?? null,
    lastMessageAt: (row.last_message_at as string) ?? null,
    unreadCount: (row.unread_count as number) ?? 0,
  }))
}

export async function fetchMessages(otherUserId: string): Promise<Message[]> {
  const me = await getMyId()

  const { data, error } = await supabase()
    .from('messages')
    .select('id, sender_id, receiver_id, text, created_at, read')
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
    .select('id, sender_id, receiver_id, text, created_at, read')
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
