import type { MagazineEntrepreneur } from '@/types'
import { createClient } from '@/lib/supabase'

function mapEntrepreneur(row: Record<string, unknown>): MagazineEntrepreneur {
  return {
    id: row.id as string,
    name: row.name as string,
    companyName: row.company_name as string,
    roleTitle: row.role_title as string,
    photoUrl: row.photo_url as string,
    bio: row.bio as string,
    institutionalText: (row.institutional_text as string) || null,
    displayOrder: row.display_order as number,
    isActive: row.is_active as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export async function fetchAllMagazineEntrepreneurs(): Promise<MagazineEntrepreneur[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('magazine_entrepreneurs')
    .select('*')
    .order('display_order', { ascending: true })

  if (error) throw new Error(error.message)
  return (data || []).map(mapEntrepreneur)
}

export async function fetchActiveMagazineEntrepreneurs(): Promise<MagazineEntrepreneur[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('magazine_entrepreneurs')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  if (error) throw new Error(error.message)
  return (data || []).map(mapEntrepreneur)
}

export async function createMagazineEntrepreneur(
  input: {
    name: string
    company_name: string
    role_title: string
    photo_url: string
    bio: string
    institutional_text?: string
    display_order: number
    is_active?: boolean
  }
): Promise<MagazineEntrepreneur> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('magazine_entrepreneurs')
    .insert(input)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return mapEntrepreneur(data)
}

export async function updateMagazineEntrepreneur(
  id: string,
  updates: {
    name?: string
    company_name?: string
    role_title?: string
    photo_url?: string
    bio?: string
    institutional_text?: string | null
    display_order?: number
    is_active?: boolean
  }
): Promise<MagazineEntrepreneur> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('magazine_entrepreneurs')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return mapEntrepreneur(data)
}

export async function deleteMagazineEntrepreneur(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('magazine_entrepreneurs')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function uploadMagazinePhoto(file: File): Promise<string> {
  const supabase = createClient()
  const ext = file.name.split('.').pop()
  const fileName = `${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage
    .from('magazine-photos')
    .upload(fileName, file, { contentType: file.type })

  if (error) throw new Error(error.message)

  const { data: urlData } = supabase.storage
    .from('magazine-photos')
    .getPublicUrl(fileName)

  return urlData.publicUrl
}

export async function reorderMagazineEntrepreneurs(
  items: { id: string; display_order: number }[]
): Promise<void> {
  const supabase = createClient()

  const promises = items.map(item =>
    supabase
      .from('magazine_entrepreneurs')
      .update({ display_order: item.display_order })
      .eq('id', item.id)
  )

  const results = await Promise.all(promises)
  const failed = results.find(r => r.error)
  if (failed?.error) throw new Error(failed.error.message)
}
