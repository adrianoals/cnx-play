"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Pagination } from "@/components/ui/pagination"
import {
  fetchCompaniesPage, fetchCompaniesStats, createCompanyForUser, updateCompanyAdmin, deleteCompanyAdmin,
  fetchAllUsers,
} from "@/services/admin.service"
import { fetchCategories } from "@/services/category.service"
import { createClient } from "@/lib/supabase"
import type { User, AdminCompany, Category } from "@/types"
import {
  Search, Trash2, Edit, Calendar, MoreHorizontal, Plus, MapPin,
  Loader2, Building2, Mail, Phone, Linkedin, Star, X, Image as ImageIcon,
  Users as UsersIcon, UserCheck, UserX, Building,
} from "lucide-react"

const MAX_GALLERY = 5
const ITEMS_PER_PAGE = 10

const emptyCompanyForm = {
  name: "",
  cnpj: "",
  categoryId: "",
  description: "",
  location: "",
  contactEmail: "",
  contactPhone: "",
  linkedin: "",
  isPrimary: true,
  userId: "",
  gallery: [] as string[],
}

export default function AdminEmpresasPage() {
  const { toast } = useToast()

  const [companies, setCompanies] = useState<AdminCompany[]>([])
  const [totalCompanies, setTotalCompanies] = useState(0)
  const [loadingCompanies, setLoadingCompanies] = useState(true)
  const [searching, setSearching] = useState(false)
  const [companySearch, setCompanySearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  const [users, setUsers] = useState<User[]>([])
  const [categories, setCategories] = useState<Category[]>([])

  // Stats agregadas (queries separadas)
  const [statsCompanies, setStatsCompanies] = useState({
    totalCompanies: 0,
    totalActiveUsers: 0,
    usersWithCompany: 0,
    usersWithMultipleCompanies: 0,
  })

  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false)
  const [companyForm, setCompanyForm] = useState(emptyCompanyForm)
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null)
  const [savingCompany, setSavingCompany] = useState(false)
  const [uploading, setUploading] = useState(false)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  // Debounce do termo de busca (400ms)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(companySearch), 400)
    return () => clearTimeout(t)
  }, [companySearch])

  // Reset para página 1 quando busca muda
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearch])

  // Load paginado das empresas
  const loadCompanies = useCallback(async () => {
    setSearching(true)
    try {
      const result = await fetchCompaniesPage({
        page: currentPage,
        perPage: ITEMS_PER_PAGE,
        search: debouncedSearch,
      })
      setCompanies(result.companies)
      setTotalCompanies(result.total)
    } catch (err) {
      toast({
        title: "Erro ao carregar empresas",
        description: err instanceof Error ? err.message : "",
        variant: "destructive",
      })
    } finally {
      setSearching(false)
      setLoadingCompanies(false)
    }
  }, [currentPage, debouncedSearch, toast])

  useEffect(() => {
    loadCompanies()
  }, [loadCompanies])

  // Load inicial: stats + users (para dropdown) + categorias
  const loadStats = useCallback(async () => {
    try {
      const stats = await fetchCompaniesStats()
      setStatsCompanies(stats)
    } catch {
      // mantém defaults
    }
  }, [])

  useEffect(() => {
    loadStats()
    fetchAllUsers().then(setUsers).catch(() => {})
    fetchCategories().then(setCategories).catch(() => {})
  }, [loadStats])

  const totalPages = Math.max(1, Math.ceil(totalCompanies / ITEMS_PER_PAGE))

  const openCreateCompany = () => {
    setEditingCompanyId(null)
    setCompanyForm(emptyCompanyForm)
    setIsCompanyModalOpen(true)
  }

  const openEditCompany = (company: AdminCompany) => {
    setEditingCompanyId(company.id)
    setCompanyForm({
      name: company.name,
      cnpj: company.cnpj || "",
      categoryId: company.categoryId || "",
      description: company.description || "",
      location: company.location || "",
      contactEmail: company.contactEmail || "",
      contactPhone: company.contactPhone || "",
      linkedin: company.linkedin || "",
      isPrimary: company.isPrimary,
      userId: company.userId,
      gallery: company.gallery || [],
    })
    setIsCompanyModalOpen(true)
  }

  const handleSaveCompany = async () => {
    if (!companyForm.name) {
      toast({ title: "Erro", description: "O nome da empresa é obrigatório.", variant: "destructive" })
      return
    }
    if (!editingCompanyId && !companyForm.userId) {
      toast({ title: "Erro", description: "Selecione o usuário responsável.", variant: "destructive" })
      return
    }

    setSavingCompany(true)
    try {
      if (editingCompanyId) {
        await updateCompanyAdmin(editingCompanyId, {
          name: companyForm.name,
          cnpj: companyForm.cnpj,
          categoryId: companyForm.categoryId || undefined,
          description: companyForm.description,
          location: companyForm.location,
          contactEmail: companyForm.contactEmail,
          contactPhone: companyForm.contactPhone,
          linkedin: companyForm.linkedin,
          isPrimary: companyForm.isPrimary,
          gallery: companyForm.gallery,
        })
        toast({ title: "Empresa atualizada", description: "Os dados foram salvos com sucesso.", className: "bg-green-600 border-green-500 text-white" })
      } else {
        await createCompanyForUser({
          userId: companyForm.userId,
          name: companyForm.name,
          cnpj: companyForm.cnpj || undefined,
          categoryId: companyForm.categoryId || undefined,
          description: companyForm.description || undefined,
          location: companyForm.location || undefined,
          contactEmail: companyForm.contactEmail || undefined,
          contactPhone: companyForm.contactPhone || undefined,
          linkedin: companyForm.linkedin || undefined,
          isPrimary: companyForm.isPrimary,
          gallery: companyForm.gallery,
        })
        toast({ title: "Empresa cadastrada", description: "A empresa foi adicionada com sucesso.", className: "bg-green-600 text-white border-none" })
      }
      await loadCompanies()
      loadStats()
      setIsCompanyModalOpen(false)
    } catch (error) {
      toast({ title: "Erro", description: error instanceof Error ? error.message : "Falha ao salvar empresa.", variant: "destructive" })
    } finally {
      setSavingCompany(false)
    }
  }

  const handleDeleteCompany = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta empresa permanentemente?")) {
      try {
        await deleteCompanyAdmin(id)
        await loadCompanies()
        loadStats()
        toast({ title: "Empresa excluída", description: "A empresa foi removida do sistema.", variant: "destructive" })
      } catch (error) {
        toast({ title: "Erro", description: error instanceof Error ? error.message : "Falha ao excluir.", variant: "destructive" })
      }
    }
  }

  const formatDate = (dateStr: string) => {
    try { return new Date(dateStr).toLocaleDateString("pt-BR") } catch { return "N/A" }
  }

  // Métricas (vêm do fetchCompaniesStats — query separada)
  const usersWithoutCompanyCount = Math.max(0, statsCompanies.totalActiveUsers - statsCompanies.usersWithCompany)

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Building2 className="h-8 w-8 text-amber-500" /> Empresas
        </h1>
        <p className="text-muted-foreground">Gerenciamento de empresas cadastradas.</p>
      </div>

      {/* Summary cards */}
      {!loadingCompanies && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <UsersIcon className="h-4 w-4 text-blue-500" />
              <p className="text-xs text-muted-foreground font-medium">Usuarios aprovados</p>
            </div>
            <p className="text-2xl font-bold">{statsCompanies.totalActiveUsers}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <UserCheck className="h-4 w-4 text-green-500" />
              <p className="text-xs text-muted-foreground font-medium">Com empresa</p>
            </div>
            <p className="text-2xl font-bold">{statsCompanies.usersWithCompany}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <UserX className="h-4 w-4 text-red-500" />
              <p className="text-xs text-muted-foreground font-medium">Sem empresa</p>
            </div>
            <p className="text-2xl font-bold">{usersWithoutCompanyCount}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Building className="h-4 w-4 text-amber-500" />
              <p className="text-xs text-muted-foreground font-medium">Total de empresas</p>
            </div>
            <p className="text-2xl font-bold">{statsCompanies.totalCompanies}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              pertencentes a {statsCompanies.usersWithCompany} usuario(s)
              {statsCompanies.usersWithMultipleCompanies > 0 && (
                <span> · {statsCompanies.usersWithMultipleCompanies} com mais de uma</span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Actions bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <Button onClick={openCreateCompany} className="bg-blue-600 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] text-white shadow-lg transition-all cursor-pointer w-full md:w-auto">
          <Plus className="mr-2 h-4 w-4" /> Cadastrar Empresa
        </Button>

        <div className="bg-card border border-border p-2 rounded-xl flex items-center gap-2 shadow-sm w-full md:w-80">
          <Search className="ml-2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar empresa ou responsável..."
            value={companySearch}
            onChange={e => setCompanySearch(e.target.value)}
            className="bg-transparent border-none focus-visible:ring-0 placeholder:text-muted-foreground h-8"
          />
        </div>
      </div>

      {/* Companies table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        {loadingCompanies ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-3 text-muted-foreground">Carregando empresas...</span>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Empresa</TableHead>
                  <TableHead className="text-muted-foreground hidden lg:table-cell">CNPJ</TableHead>
                  <TableHead className="text-muted-foreground hidden md:table-cell">Categoria</TableHead>
                  <TableHead className="text-muted-foreground hidden md:table-cell">Responsável</TableHead>
                  <TableHead className="text-muted-foreground hidden lg:table-cell">Localização</TableHead>
                  <TableHead className="text-muted-foreground text-center hidden sm:table-cell">Tipo</TableHead>
                  <TableHead className="text-muted-foreground hidden md:table-cell">Cadastro</TableHead>
                  <TableHead className="text-right text-muted-foreground w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.length > 0 ? (
                  companies.map(company => (
                    <TableRow key={company.id} className="border-border hover:bg-secondary/30 transition-colors">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold">{company.name}</span>
                          {company.contactEmail && (
                            <span className="text-xs text-muted-foreground">{company.contactEmail}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">
                        {company.cnpj || "—"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">
                        {company.categoryName || "—"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex flex-col">
                          <span className="text-sm">{company.ownerName || "—"}</span>
                          <span className="text-xs text-muted-foreground">{company.ownerEmail}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {company.location ? (
                          <span className="text-sm flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-muted-foreground" /> {company.location}
                          </span>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-center hidden sm:table-cell">
                        {company.isPrimary ? (
                          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/20">
                            <Star className="w-3 h-3 mr-1" /> Principal
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">Secundária</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden md:table-cell">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-3 w-3" /> {formatDate(company.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                              <span className="sr-only">Abrir menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => openEditCompany(company)}>
                              <Edit className="mr-2 h-4 w-4" /> Editar Empresa
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDeleteCompany(company.id)} className="text-red-400">
                              <Trash2 className="mr-2 h-4 w-4" /> Excluir Empresa
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      {debouncedSearch ? "Nenhuma empresa encontrada." : "Nenhuma empresa cadastrada."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <div className="p-4 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-2">
                {searching && <Loader2 className="h-3 w-3 animate-spin" />}
                Mostrando {totalCompanies === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, totalCompanies)} de {totalCompanies}
              </span>
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
          </>
        )}
      </div>

      {/* Create/Edit Company Modal */}
      <Dialog open={isCompanyModalOpen} onOpenChange={setIsCompanyModalOpen}>
        <DialogContent className="sm:max-w-[650px] overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{editingCompanyId ? "Editar Empresa" : "Cadastrar Nova Empresa"}</DialogTitle>
            <DialogDescription>
              {editingCompanyId
                ? "Altere os dados da empresa abaixo."
                : "Preencha os dados para cadastrar uma nova empresa vinculada a um usuário."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {!editingCompanyId && (
              <div className="space-y-2">
                <Label>Usuário Responsável *</Label>
                <select
                  value={companyForm.userId}
                  onChange={e => setCompanyForm({ ...companyForm, userId: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none"
                >
                  <option value="">Selecione um usuário...</option>
                  {users
                    .filter(u => u.status === "active")
                    .map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name || u.fullName} ({u.email})
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome da Empresa *</Label>
                <Input
                  value={companyForm.name}
                  onChange={e => setCompanyForm({ ...companyForm, name: e.target.value })}
                  placeholder="Ex: Acme Corp"
                />
              </div>
              <div className="space-y-2">
                <Label>CNPJ</Label>
                <Input
                  value={companyForm.cnpj}
                  onChange={e => setCompanyForm({ ...companyForm, cnpj: e.target.value })}
                  placeholder="00.000.000/0000-00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <select
                value={companyForm.categoryId}
                onChange={e => setCompanyForm({ ...companyForm, categoryId: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none"
              >
                <option value="">Selecione uma categoria...</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                value={companyForm.description}
                onChange={e => setCompanyForm({ ...companyForm, description: e.target.value })}
                placeholder="Breve descrição da empresa"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Localização</Label>
              <Input
                value={companyForm.location}
                onChange={e => setCompanyForm({ ...companyForm, location: e.target.value })}
                placeholder="Ex: São Paulo, SP"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><Mail className="w-3 h-3" /> Email de Contato</Label>
                <Input
                  value={companyForm.contactEmail}
                  onChange={e => setCompanyForm({ ...companyForm, contactEmail: e.target.value })}
                  placeholder="contato@empresa.com"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><Phone className="w-3 h-3" /> Telefone</Label>
                <Input
                  value={companyForm.contactPhone}
                  onChange={e => setCompanyForm({ ...companyForm, contactPhone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1"><Linkedin className="w-3 h-3" /> LinkedIn</Label>
              <Input
                value={companyForm.linkedin}
                onChange={e => setCompanyForm({ ...companyForm, linkedin: e.target.value })}
                placeholder="https://linkedin.com/company/..."
              />
            </div>

            {/* Gallery */}
            <div className="space-y-3 pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" /> Galeria ({companyForm.gallery.length}/{MAX_GALLERY})
                </Label>
                {companyForm.gallery.length < MAX_GALLERY && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => galleryInputRef.current?.click()}
                    disabled={uploading || (!editingCompanyId && !companyForm.userId)}
                  >
                    {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                    {uploading ? "Enviando..." : "Adicionar"}
                  </Button>
                )}
              </div>
              <input
                type="file"
                ref={galleryInputRef}
                onChange={async (event) => {
                  const file = event.target.files?.[0]
                  if (!file) return
                  if (!file.type.startsWith("image/")) {
                    toast({ variant: "destructive", title: "Formato inválido", description: "Use PNG ou JPG." })
                    return
                  }
                  if (file.size > 2 * 1024 * 1024) {
                    toast({ variant: "destructive", title: "Arquivo muito grande", description: "Máximo 2MB." })
                    return
                  }
                  const ownerId = companyForm.userId || "admin"
                  setUploading(true)
                  try {
                    const supabase = createClient()
                    const ext = file.name.split(".").pop() || "jpg"
                    const filePath = `${ownerId}/${Date.now()}.${ext}`
                    const { error: uploadError } = await supabase.storage
                      .from("gallery")
                      .upload(filePath, file, { upsert: true })
                    if (uploadError) throw uploadError
                    const { data: urlData } = supabase.storage.from("gallery").getPublicUrl(filePath)
                    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`
                    setCompanyForm(prev => ({ ...prev, gallery: [...prev.gallery, publicUrl] }))
                  } catch (err) {
                    console.error("Gallery upload error:", err)
                    toast({ variant: "destructive", title: "Erro ao enviar foto", description: "Tente novamente." })
                  } finally {
                    setUploading(false)
                    if (galleryInputRef.current) galleryInputRef.current.value = ""
                  }
                }}
                accept="image/*"
                className="hidden"
              />
              {companyForm.gallery.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {companyForm.gallery.map((img, idx) => (
                    <div key={idx} className="relative group aspect-square bg-muted rounded-lg overflow-hidden border border-border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={async () => {
                          const url = companyForm.gallery[idx]
                          setCompanyForm(prev => ({ ...prev, gallery: prev.gallery.filter((_, i) => i !== idx) }))
                          try {
                            const supabase = createClient()
                            const match = url.match(/\/gallery\/(.+?)(\?|$)/)
                            if (match) await supabase.storage.from("gallery").remove([decodeURIComponent(match[1])])
                          } catch { /* best-effort */ }
                        }}
                        className="absolute top-1 right-1 p-0.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  onClick={() => {
                    if (!uploading && (editingCompanyId || companyForm.userId)) galleryInputRef.current?.click()
                  }}
                  className={`flex flex-col items-center justify-center py-4 border-2 border-dashed border-muted-foreground/20 rounded-lg text-muted-foreground text-xs ${
                    !editingCompanyId && !companyForm.userId ? "opacity-50" : "cursor-pointer hover:bg-secondary/30"
                  } transition-colors`}
                >
                  <Plus className="h-5 w-5 mb-1" />
                  <span>{!editingCompanyId && !companyForm.userId ? "Selecione o usuário primeiro" : "Adicionar fotos"}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2 border-t border-border">
              <input
                type="checkbox"
                id="isPrimary"
                checked={companyForm.isPrimary}
                onChange={e => setCompanyForm({ ...companyForm, isPrimary: e.target.checked })}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="isPrimary" className="cursor-pointer flex items-center gap-1">
                <Star className="w-3 h-3" /> Empresa Principal
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCompanyModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveCompany} disabled={savingCompany || uploading} className="bg-blue-600 hover:bg-blue-700 text-white">
              {savingCompany ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editingCompanyId ? "Salvar Alterações" : "Cadastrar Empresa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
