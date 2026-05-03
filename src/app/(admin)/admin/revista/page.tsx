"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import {
  fetchAllMagazineEntrepreneurs,
  createMagazineEntrepreneur,
  updateMagazineEntrepreneur,
  deleteMagazineEntrepreneur,
  uploadMagazinePhoto,
  reorderMagazineEntrepreneurs,
} from "@/services/magazine.service"
import type { MagazineEntrepreneur } from "@/types"
import {
  Plus, Trash2, Edit, GripVertical, Loader2, BookOpen, Upload, Eye, EyeOff, Image as ImageIcon,
} from "lucide-react"
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

const FIELD_LIMITS = {
  name: 60,
  company_name: 80,
  role_title: 60,
  bio: 500,
  institutional_text: 300,
}

function CharCounter({ current, max }: { current: number; max: number }) {
  const isNear = current >= max * 0.9
  return (
    <span className={`text-xs ${isNear ? "text-amber-400" : "text-muted-foreground"}`}>
      {current}/{max}
    </span>
  )
}

interface EntrepreneurForm {
  name: string
  company_name: string
  role_title: string
  bio: string
  bio_full: string
  institutional_text: string
  institutional_text_full: string
  instagram: string
  phone: string
  photo_url: string
  is_active: boolean
}

const emptyForm: EntrepreneurForm = {
  name: "",
  company_name: "",
  role_title: "",
  bio: "",
  bio_full: "",
  institutional_text: "",
  institutional_text_full: "",
  instagram: "",
  phone: "",
  photo_url: "",
  is_active: true,
}

function SortableRow({
  item,
  onEdit,
  onDelete,
  onToggleStatus,
}: {
  item: MagazineEntrepreneur
  onEdit: (item: MagazineEntrepreneur) => void
  onDelete: (item: MagazineEntrepreneur) => void
  onToggleStatus: (item: MagazineEntrepreneur) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <TableRow ref={setNodeRef} style={style} className={isDragging ? "bg-accent" : ""}>
      <TableCell className="w-10">
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground">
          <GripVertical className="h-4 w-4" />
        </button>
      </TableCell>
      <TableCell className="w-12">
        {item.photoUrl ? (
          <Image src={item.photoUrl} alt={item.name} width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
            <ImageIcon className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
      </TableCell>
      <TableCell className="font-medium">{item.name}</TableCell>
      <TableCell>{item.companyName}</TableCell>
      <TableCell className="hidden md:table-cell">{item.roleTitle}</TableCell>
      <TableCell className="text-center">{item.displayOrder}</TableCell>
      <TableCell>
        <Badge className={item.isActive
          ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border-emerald-500/20"
          : "bg-muted text-muted-foreground hover:bg-muted/80 border-muted"
        }>
          {item.isActive ? "Ativo" : "Inativo"}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => onToggleStatus(item)} title={item.isActive ? "Desativar" : "Ativar"}>
            {item.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onEdit(item)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-300" onClick={() => onDelete(item)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

export default function AdminRevistaPage() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [entrepreneurs, setEntrepreneurs] = useState<MagazineEntrepreneur[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<EntrepreneurForm>(emptyForm)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)

  const [deleteTarget, setDeleteTarget] = useState<MagazineEntrepreneur | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const loadEntrepreneurs = useCallback(async () => {
    try {
      const data = await fetchAllMagazineEntrepreneurs()
      setEntrepreneurs(data)
    } catch (err) {
      toast({ title: "Erro ao carregar", description: err instanceof Error ? err.message : "Falha ao carregar empresarios.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadEntrepreneurs()
  }, [loadEntrepreneurs])

  function openCreate() {
    setEditingId(null)
    setForm({ ...emptyForm })
    setPhotoPreview(null)
    setPhotoFile(null)
    setIsFormOpen(true)
  }

  function openEdit(item: MagazineEntrepreneur) {
    setEditingId(item.id)
    setForm({
      name: item.name,
      company_name: item.companyName,
      role_title: item.roleTitle,
      bio: item.bio,
      bio_full: item.bioFull || "",
      institutional_text: item.institutionalText || "",
      institutional_text_full: item.institutionalTextFull || "",
      instagram: item.instagram || "",
      phone: item.phone || "",
      photo_url: item.photoUrl,
      is_active: item.isActive,
    })
    setPhotoPreview(item.photoUrl)
    setPhotoFile(null)
    setIsFormOpen(true)
  }

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast({ title: "Formato invalido", description: "Use JPEG, PNG ou WebP.", variant: "destructive" })
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "O tamanho maximo e 2MB.", variant: "destructive" })
      return
    }

    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function handleSave() {
    if (!form.name || !form.company_name || !form.role_title || !form.bio) {
      toast({ title: "Campos obrigatorios", description: "Preencha nome, empresa, cargo e bio.", variant: "destructive" })
      return
    }

    if (!editingId && !photoFile && !form.photo_url) {
      toast({ title: "Foto obrigatoria", description: "Selecione uma foto para o empresario.", variant: "destructive" })
      return
    }

    setSaving(true)
    try {
      let photoUrl = form.photo_url

      if (photoFile) {
        setUploading(true)
        photoUrl = await uploadMagazinePhoto(photoFile)
        setUploading(false)
      }

      if (editingId) {
        const updated = await updateMagazineEntrepreneur(editingId, {
          name: form.name,
          company_name: form.company_name,
          role_title: form.role_title,
          bio: form.bio,
          bio_full: form.bio_full || null,
          institutional_text: form.institutional_text || null,
          institutional_text_full: form.institutional_text_full || null,
          instagram: form.instagram || null,
          phone: form.phone || null,
          photo_url: photoUrl,
          is_active: form.is_active,
        })
        setEntrepreneurs(prev => prev.map(e => e.id === editingId ? updated : e))
        toast({ title: "Atualizado", description: "Empresario atualizado com sucesso.", className: "bg-green-600 border-green-500 text-white" })
      } else {
        const nextOrder = entrepreneurs.length > 0 ? Math.max(...entrepreneurs.map(e => e.displayOrder)) + 1 : 1
        const created = await createMagazineEntrepreneur({
          name: form.name,
          company_name: form.company_name,
          role_title: form.role_title,
          bio: form.bio,
          bio_full: form.bio_full || undefined,
          institutional_text: form.institutional_text || undefined,
          institutional_text_full: form.institutional_text_full || undefined,
          instagram: form.instagram || undefined,
          phone: form.phone || undefined,
          photo_url: photoUrl,
          display_order: nextOrder,
          is_active: form.is_active,
        })
        setEntrepreneurs(prev => [...prev, created])
        toast({ title: "Cadastrado", description: "Empresario adicionado a revista.", className: "bg-green-600 border-green-500 text-white" })
      }

      setIsFormOpen(false)
    } catch (err) {
      toast({ title: "Erro ao salvar", description: err instanceof Error ? err.message : "Falha ao salvar.", variant: "destructive" })
    } finally {
      setSaving(false)
      setUploading(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await deleteMagazineEntrepreneur(deleteTarget.id)
      setEntrepreneurs(prev => prev.filter(e => e.id !== deleteTarget.id))
      setDeleteTarget(null)
      toast({ title: "Excluido", description: "Empresario removido da revista.", variant: "destructive" })
    } catch (err) {
      toast({ title: "Erro ao excluir", description: err instanceof Error ? err.message : "Falha ao excluir.", variant: "destructive" })
    }
  }

  async function handleToggleStatus(item: MagazineEntrepreneur) {
    try {
      const updated = await updateMagazineEntrepreneur(item.id, { is_active: !item.isActive })
      setEntrepreneurs(prev => prev.map(e => e.id === item.id ? updated : e))
      toast({
        title: updated.isActive ? "Ativado" : "Desativado",
        description: `${item.name} ${updated.isActive ? "agora aparece" : "nao aparece mais"} na revista.`,
        className: updated.isActive ? "bg-green-600 border-green-500 text-white" : "",
      })
    } catch (err) {
      toast({ title: "Erro", description: err instanceof Error ? err.message : "Falha ao alterar status.", variant: "destructive" })
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = entrepreneurs.findIndex(e => e.id === active.id)
    const newIndex = entrepreneurs.findIndex(e => e.id === over.id)

    const reordered = arrayMove(entrepreneurs, oldIndex, newIndex)
    const withNewOrder = reordered.map((e, i) => ({ ...e, displayOrder: i + 1 }))

    setEntrepreneurs(withNewOrder)

    try {
      await reorderMagazineEntrepreneurs(withNewOrder.map(e => ({ id: e.id, display_order: e.displayOrder })))
    } catch (err) {
      toast({ title: "Erro ao reordenar", description: err instanceof Error ? err.message : "Falha ao salvar ordem.", variant: "destructive" })
      loadEntrepreneurs()
    }
  }

  function updateField(field: keyof EntrepreneurForm, value: string | boolean) {
    if (typeof value === "string") {
      const limit = FIELD_LIMITS[field as keyof typeof FIELD_LIMITS]
      if (limit && value.length > limit) return
    }
    setForm(prev => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Revista Digital</h1>
            <p className="text-sm text-muted-foreground">Gerencie os empresarios da revista</p>
          </div>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Empresario
        </Button>
      </div>

      {entrepreneurs.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">Nenhum empresario cadastrado</p>
          <p className="text-sm">Comece adicionando empresarios para montar a revista.</p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead className="w-12">Foto</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead className="hidden md:table-cell">Cargo</TableHead>
                  <TableHead className="text-center">Ordem</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <SortableContext items={entrepreneurs.map(e => e.id)} strategy={verticalListSortingStrategy}>
                  {entrepreneurs.map(item => (
                    <SortableRow
                      key={item.id}
                      item={item}
                      onEdit={openEdit}
                      onDelete={setDeleteTarget}
                      onToggleStatus={handleToggleStatus}
                    />
                  ))}
                </SortableContext>
              </TableBody>
            </Table>
          </DndContext>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Empresario" : "Novo Empresario"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Atualize as informacoes do empresario." : "Preencha os dados do empresario para a revista."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <Label>Nome *</Label>
                <CharCounter current={form.name.length} max={FIELD_LIMITS.name} />
              </div>
              <Input value={form.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField("name", e.target.value)} placeholder="Nome do empresario" />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label>Empresa *</Label>
                <CharCounter current={form.company_name.length} max={FIELD_LIMITS.company_name} />
              </div>
              <Input value={form.company_name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField("company_name", e.target.value)} placeholder="Nome da empresa" />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label>Cargo *</Label>
                <CharCounter current={form.role_title.length} max={FIELD_LIMITS.role_title} />
              </div>
              <Input value={form.role_title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField("role_title", e.target.value)} placeholder="Cargo ou posicao" />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label>Bio / Apresentacao *</Label>
                <CharCounter current={form.bio.length} max={FIELD_LIMITS.bio} />
              </div>
              <Textarea value={form.bio} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateField("bio", e.target.value)} placeholder="Texto de apresentacao do empresario" rows={3} />
            </div>

            <div>
              <Label>Bio Completa</Label>
              <p className="text-xs text-muted-foreground mb-1">Texto completo exibido no modal &quot;Saiba mais&quot; (opcional)</p>
              <Textarea value={form.bio_full} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm(prev => ({ ...prev, bio_full: e.target.value }))} placeholder="Texto completo da bio do empresario" rows={5} />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label>Texto Institucional</Label>
                <CharCounter current={form.institutional_text.length} max={FIELD_LIMITS.institutional_text} />
              </div>
              <Textarea value={form.institutional_text} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateField("institutional_text", e.target.value)} placeholder="Mensagem institucional (opcional)" rows={4} />
            </div>

            <div>
              <Label>Texto Institucional Completo</Label>
              <p className="text-xs text-muted-foreground mb-1">Texto institucional completo exibido no modal &quot;Saiba mais&quot; (opcional)</p>
              <Textarea value={form.institutional_text_full} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm(prev => ({ ...prev, institutional_text_full: e.target.value }))} placeholder="Texto institucional completo" rows={5} />
            </div>

            <div>
              <Label>Instagram</Label>
              <Input value={form.instagram} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField("instagram", e.target.value)} placeholder="@usuario ou URL do perfil" />
            </div>

            <div>
              <Label>Telefone (WhatsApp)</Label>
              <Input
                value={form.phone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const raw = e.target.value.replace(/\D/g, '').slice(0, 13)
                  let masked = raw
                  if (raw.length > 2) masked = `(${raw.slice(0,2)}) ${raw.slice(2)}`
                  if (raw.length > 7) masked = `(${raw.slice(0,2)}) ${raw.slice(2,7)}-${raw.slice(7)}`
                  updateField("phone", masked)
                }}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div>
              <Label>Foto *</Label>
              <div className="mt-2 flex items-center gap-4">
                {photoPreview ? (
                  <Image src={photoPreview} alt="Preview" width={80} height={80} className="h-20 w-20 rounded-lg object-cover border" />
                ) : (
                  <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center border border-dashed">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="gap-2">
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {photoPreview ? "Trocar foto" : "Selecionar foto"}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">JPEG, PNG ou WebP. Max 2MB.</p>
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoSelect} className="hidden" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch checked={form.is_active} onCheckedChange={(v: boolean) => updateField("is_active", v)} />
              <Label>Ativo na revista</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingId ? "Salvar" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Empresario</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir <strong>{deleteTarget?.name}</strong> da revista? Esta acao nao pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
