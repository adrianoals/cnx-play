import { createClient } from '@/lib/supabase'
import type { Notification } from '@/types'

const supabase = () => createClient()

export async function fetchNotifications(): Promise<Notification[]> {
  const { data: { user } } = await supabase().auth.getUser()
  if (!user) return []

  const { data, error } = await supabase()
    .from('notifications')
    .select('id, user_id, type, title, content, read, created_at, reference_id, reference_type')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw error

  return (data || []).map(row => ({
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    content: row.content,
    read: row.read,
    createdAt: row.created_at,
    referenceId: row.reference_id,
    referenceType: row.reference_type,
  }))
}

export async function markAllRead(): Promise<void> {
  const { data: { user } } = await supabase().auth.getUser()
  if (!user) return

  const { error } = await supabase()
    .from('notifications')
    .update({ read: true })
    .eq('user_id', user.id)
    .eq('read', false)

  if (error) throw error
}

export async function markOneRead(id: string): Promise<void> {
  const { error } = await supabase()
    .from('notifications')
    .update({ read: true })
    .eq('id', id)

  if (error) throw error
}
