"use client"

import { useState, useEffect, useRef } from "react"
import type { Category } from "@/types"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import {
  Building2, FileText, Tag, MapPin, Briefcase, Mail, Phone, Linkedin,
  Save, Loader2, Plus, X, Star, StarOff,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

function formatCNPJ(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 14)
  if (digits.length <= 2) return digits
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11)
  if (digits.length <= 2) return digits.length ? `(${digits}` : ""
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export interface CompanyFormData {
  id?: string
  name: string
  cnpj?: string
  categoryId?: string
  description?: string
  location?: string
  contactEmail?: string
  contactPhone?: string
  linkedin?: string
  isPrimary: boolean
  gallery: string[]
}

interface CompanyEditModalProps {
  company: CompanyFormData | null
  isOpen: boolean
  onClose: () => void
  onSave: (data: CompanyFormData) => void
  userId: string
  categories?: Category[]
}

function Field({
  label, value, onChange, icon: Icon, placeholder = "", type = "text",
}: {
  label: string; value: string; onChange: (v: string) => void
  icon?: React.ComponentType<{ className?: string }>; placeholder?: string; type?: string
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />}
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full bg-secondary/50 border border-input rounded-xl py-2.5 ${Icon ? "pl-9" : "pl-3"} pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all`}
        />
      </div>
    </div>
  )
}

const MAX_GALLERY = 5

export default function CompanyEditModal({ company, isOpen, onClose, onSave, userId, categories = [] }: CompanyEditModalProps) {
  const { toast } = useToast()
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [form, setForm] = useState({
    name: "", cnpj: "", categoryId: "", description: "",
    location: "", contactEmail: "", contactPhone: "", linkedin: "",
    isPrimary: true, gallery: [] as string[],
  })

  useEffect(() => {
    if (isOpen) {
      if (company) {
        setForm({
          name: company.name,
          cnpj: company.cnpj || "",
          categoryId: company.categoryId || "",
          description: company.description || "",
          location: company.location || "",
          contactEmail: company.contactEmail || "",
          contactPhone: company.contactPhone || "",
          linkedin: company.linkedin || "",
          isPrimary: company.isPrimary,
          gallery: [...(company.gallery || [])],
        })
      } else {
        setForm({
          name: "", cnpj: "", categoryId: "", description: "",
          location: "", contactEmail: "", contactPhone: "", linkedin: "",
          isPrimary: true, gallery: [],
        })
      }
    }
  }, [isOpen, company])

  const handleGalleryUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast({ variant: "destructive", title: "Formato inválido", description: "Use PNG ou JPG." })
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ variant: "destructive", title: "Arquivo muito grande", description: "Máximo 2MB por imagem." })
      return
    }
    if (form.gallery.length >= MAX_GALLERY) {
      toast({ variant: "destructive", title: "Limite atingido", description: `Máximo ${MAX_GALLERY} fotos por empresa.` })
      return
    }

    setUploading(true)
    try {
      const supabase = createClient()
      const ext = file.name.split(".").pop() || "jpg"
      const filePath = `${userId}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from("gallery")
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from("gallery").getPublicUrl(filePath)
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`

      setForm(prev => ({ ...prev, gallery: [...prev.gallery, publicUrl] }))
      toast({ title: "Foto adicionada!", className: "bg-green-600 border-green-500 text-white" })
    } catch (err) {
      console.error("Gallery upload error:", err)
      toast({ variant: "destructive", title: "Erro ao enviar foto", description: "Tente novamente." })
    } finally {
      setUploading(false)
      if (galleryInputRef.current) galleryInputRef.current.value = ""
    }
  }

  const removeGalleryImage = async (index: number) => {
    const url = form.gallery[index]
    setForm(prev => ({ ...prev, gallery: prev.gallery.filter((_, i) => i !== index) }))

    // Try to remove from storage
    try {
      const supabase = createClient()
      const match = url.match(/\/gallery\/(.+?)(\?|$)/)
      if (match) {
        await supabase.storage.from("gallery").remove([decodeURIComponent(match[1])])
      }
    } catch { /* best-effort */ }
  }

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast({ variant: "destructive", title: "Nome obrigatório", description: "Informe o nome da empresa." })
      return
    }

    setSaving(true)
    onSave({
      ...(company?.id ? { id: company.id } : {}),
      name: form.name.trim(),
      cnpj: form.cnpj.trim() || undefined,
      categoryId: form.categoryId || undefined,
      description: form.description.trim() || undefined,
      location: form.location.trim() || undefined,
      contactEmail: form.contactEmail.trim() || undefined,
      contactPhone: form.contactPhone.trim() || undefined,
      linkedin: form.linkedin.trim() || undefined,
      isPrimary: form.isPrimary,
      gallery: form.gallery,
    })
    setSaving(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={open => { if (!open) onClose() }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-purple-500" />
            {company ? "Editar Empresa" : "Adicionar Empresa"}
          </DialogTitle>
          <DialogDescription>
            {company ? "Atualize os dados desta empresa." : "Preencha os dados da sua empresa para aparecer nas buscas."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nome da Empresa *" value={form.name} onChange={v => setForm({ ...form, name: v })} icon={Building2} placeholder="Razão Social" />
            <Field label="CNPJ" value={form.cnpj} onChange={v => setForm({ ...form, cnpj: formatCNPJ(v) })} icon={FileText} placeholder="00.000.000/0001-00" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Categoria</label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <select
                  value={form.categoryId}
                  onChange={e => setForm({ ...form, categoryId: e.target.value })}
                  className="w-full bg-secondary/50 border border-input rounded-xl py-2.5 pl-9 pr-3 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all appearance-none"
                >
                  <option value="">Selecione uma categoria...</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <Field label="Localização" value={form.location} onChange={v => setForm({ ...form, location: v })} icon={MapPin} placeholder="Cidade - UF" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Descrição</label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Sobre a empresa, serviços e diferenciais..."
                rows={3}
                className="w-full bg-secondary/50 border border-input rounded-xl py-2.5 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all resize-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="E-mail Comercial" value={form.contactEmail} onChange={v => setForm({ ...form, contactEmail: v })} icon={Mail} placeholder="contato@empresa.com" />
            <Field label="Telefone Comercial" value={form.contactPhone} onChange={v => setForm({ ...form, contactPhone: formatPhone(v) })} icon={Phone} placeholder="(00) 00000-0000" />
          </div>

          <Field label="LinkedIn" value={form.linkedin} onChange={v => setForm({ ...form, linkedin: v })} icon={Linkedin} placeholder="https://linkedin.com/in/seu-perfil" />

          <button
            type="button"
            onClick={() => setForm({ ...form, isPrimary: !form.isPrimary })}
            className={`flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-xl border transition-colors ${
              form.isPrimary
                ? "bg-amber-500/10 border-amber-500/30 text-amber-500"
                : "bg-secondary/50 border-input text-muted-foreground hover:text-foreground"
            }`}
          >
            {form.isPrimary ? <Star className="h-4 w-4" /> : <StarOff className="h-4 w-4" />}
            {form.isPrimary ? "Empresa Principal" : "Marcar como Principal"}
          </button>

          {/* Gallery */}
          <div className="space-y-3 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground">
                Galeria ({form.gallery.length}/{MAX_GALLERY})
              </label>
              {form.gallery.length < MAX_GALLERY && (
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => galleryInputRef.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                  {uploading ? "Enviando..." : "Adicionar"}
                </Button>
              )}
            </div>
            <input type="file" ref={galleryInputRef} onChange={handleGalleryUpload} accept="image/*" className="hidden" />
            {form.gallery.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {form.gallery.map((img, idx) => (
                  <div key={idx} className="relative group aspect-square bg-muted rounded-xl overflow-hidden border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeGalleryImage(idx)}
                      className="absolute top-1 right-1 p-0.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div
                onClick={() => galleryInputRef.current?.click()}
                className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-muted-foreground/20 rounded-xl cursor-pointer hover:bg-secondary/30 transition-colors text-muted-foreground"
              >
                <Plus className="h-6 w-6 mb-1" />
                <span className="text-xs">Adicionar fotos da empresa</span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={saving || uploading} className="min-w-[120px]">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {company ? "Salvar" : "Adicionar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
