"use client"

import { useState, useEffect, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Pagination } from "@/components/ui/pagination"
import { useAuthContext } from "@/providers/auth-provider"
import { SUPER_ADMINS } from "@/lib/constants"
import {
  fetchUsersPage, fetchRecentUsers, fetchUsersForExport,
  updateUserProfile, deleteUserProfile, changeUserStatus, createUserViaApi,
  type AdminUserStatusFilter,
} from "@/services/admin.service"
import type { User } from "@/types"
import {
  Search, Trash2, Edit, FileSpreadsheet, Calendar,
  MoreHorizontal, UserPlus, Clock, CheckCircle, XCircle,
  Phone, Fingerprint, Plus, MapPin,
  ShieldAlert, Lock, Loader2, Users,
} from "lucide-react"

const ITEMS_PER_PAGE = 10

function getStatusBadge(status: string) {
  switch (status) {
    case "active":
      return <Badge className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border-emerald-500/20">Aprovado</Badge>
    case "pending":
      return <Badge className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border-amber-500/20">Pendente</Badge>
    case "inactive":
      return <Badge className="bg-muted text-muted-foreground hover:bg-muted/80 border-muted">Inativo</Badge>
    default:
      return <Badge variant="outline">Desconhecido</Badge>
  }
}

export default function AdminUsersPage() {
  const { toast } = useToast()
  const { user: currentUser } = useAuthContext()

  // ── Users state ──
  const [users, setUsers] = useState<User[]>([])
  const [totalUsers, setTotalUsers] = useState(0)
  const [pendingCount, setPendingCount] = useState(0)
  const [recentUsers, setRecentUsers] = useState<User[]>([])

  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [activeTab, setActiveTab] = useState<AdminUserStatusFilter>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [searching, setSearching] = useState(false)

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<(User & { address?: string }) | null>(null)
  const [savingEdit, setSavingEdit] = useState(false)

  const [isNewUsersModalOpen, setIsNewUsersModalOpen] = useState(false)

  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false)
  const [creatingUser, setCreatingUser] = useState(false)
  const [newUserData, setNewUserData] = useState({
    name: "", email: "", password: "",
    phone: "", cpf: "", role: "user" as "user" | "admin", status: "active" as "active" | "pending" | "inactive",
  })

  // Debounce do termo de busca (400ms)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 400)
    return () => clearTimeout(t)
  }, [searchTerm])

  // Reset para página 1 quando filtros mudam
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearch, activeTab])

  // ── Load data (server-side pagination) ──
  const loadUsers = useCallback(async () => {
    setSearching(true)
    try {
      const result = await fetchUsersPage({
        page: currentPage,
        perPage: ITEMS_PER_PAGE,
        search: debouncedSearch,
        status: activeTab,
      })
      setUsers(result.users)
      setTotalUsers(result.total)
      setPendingCount(result.pendingCount)
    } catch (err) {
      toast({
        title: "Erro ao carregar usuários",
        description: err instanceof Error ? err.message : "",
        variant: "destructive",
      })
    } finally {
      setSearching(false)
      setLoadingUsers(false)
    }
  }, [currentPage, debouncedSearch, activeTab, toast])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  // Carregamento separado dos "novos cadastros" (Top 5 mais recentes) — usado no modal
  useEffect(() => {
    fetchRecentUsers(5)
      .then(setRecentUsers)
      .catch(() => {})
  }, [])

  const totalPages = Math.max(1, Math.ceil(totalUsers / ITEMS_PER_PAGE))

  const handleDelete = async (id: string) => {
    const userToDelete = users.find(u => u.id === id)

    if (userToDelete && userToDelete.email === currentUser?.email) {
      toast({ title: "Ação bloqueada", description: "Você não pode excluir sua própria conta.", variant: "destructive" })
      return
    }
    if (userToDelete && SUPER_ADMINS.includes(userToDelete.email.toLowerCase())) {
      toast({ title: "Ação bloqueada", description: "Este é um Usuário Mestre e não pode ser excluído.", variant: "destructive" })
      return
    }

    if (window.confirm("Tem certeza que deseja excluir este usuário permanentemente?")) {
      try {
        await deleteUserProfile(id)
        await loadUsers()
        fetchRecentUsers(5).then(setRecentUsers).catch(() => {})
        toast({ title: "Usuário excluído", description: "O usuário foi removido do sistema.", variant: "destructive" })
      } catch (error) {
        toast({ title: "Erro", description: error instanceof Error ? error.message : "Falha ao excluir.", variant: "destructive" })
      }
    }
  }

  const handleStatusChange = async (id: string, newStatus: User["status"]) => {
    // Capturar o usuário antes do reload (para enviar e-mail caso seja aprovação)
    const approvedUser = newStatus === "active" ? users.find(u => u.id === id) : undefined

    try {
      await changeUserStatus(id, newStatus)
      await loadUsers()
      toast({
        title: newStatus === "active" ? "Usuário Aprovado" : "Usuário Atualizado",
        description: `O status foi alterado para ${newStatus === "active" ? "Ativo" : newStatus === "inactive" ? "Inativo" : "Pendente"}.`,
        className: newStatus === "active" ? "bg-green-600 border-green-500 text-white" : "",
      })

      // Send approval email when user is activated
      if (approvedUser) {
        fetch("/api/admin/approve-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: approvedUser.email, fullName: approvedUser.fullName || approvedUser.name }),
        }).catch(() => {
          // Email failure should not block the approval flow
        })
      }
    } catch (error) {
      toast({ title: "Erro", description: error instanceof Error ? error.message : "Falha ao alterar status.", variant: "destructive" })
    }
  }

  const handleEditClick = (user: User) => {
    setEditingUser({
      ...user,
      name: user.name || user.fullName,
      phone: user.phone || "",
      cpf: user.cpf || "",
      address: user.address || "",
    })
    setIsEditModalOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingUser) return

    if (SUPER_ADMINS.includes(editingUser.email.toLowerCase())) {
      if (editingUser.role !== "admin" || editingUser.status !== "active") {
        toast({ title: "Ação Proibida", description: "Não é possível remover privilégios deste usuário.", variant: "destructive" })
        return
      }
    }

    setSavingEdit(true)
    try {
      await updateUserProfile(editingUser.id, {
        full_name: editingUser.name,
        phone: editingUser.phone || undefined,
        cpf: editingUser.cpf || undefined,
        address: editingUser.address || undefined,
        role: editingUser.role,
        status: editingUser.status,
      })
      await loadUsers()
      setIsEditModalOpen(false)
      toast({ title: "Usuário atualizado", description: "As informações foram salvas com sucesso.", className: "bg-green-600 border-green-500 text-white" })
    } catch (error) {
      toast({ title: "Erro", description: error instanceof Error ? error.message : "Falha ao salvar.", variant: "destructive" })
    } finally {
      setSavingEdit(false)
    }
  }

  const handleCreateUser = async () => {
    if (!newUserData.name || !newUserData.email || !newUserData.password) {
      toast({ title: "Erro", description: "Nome, Email e Senha são obrigatórios.", variant: "destructive" })
      return
    }
    if (newUserData.password.length < 6) {
      toast({ title: "Erro", description: "A senha deve ter pelo menos 6 caracteres.", variant: "destructive" })
      return
    }

    setCreatingUser(true)
    try {
      await createUserViaApi({
        email: newUserData.email,
        password: newUserData.password,
        fullName: newUserData.name,
        phone: newUserData.phone || undefined,
        cpf: newUserData.cpf || undefined,
        role: newUserData.role,
        status: newUserData.status,
      })
      await loadUsers()
      fetchRecentUsers(5).then(setRecentUsers).catch(() => {})
      setIsCreateUserModalOpen(false)
      setNewUserData({ name: "", email: "", password: "", phone: "", cpf: "", role: "user", status: "active" })
      toast({ title: "Usuário Criado", description: "O usuário foi adicionado com sucesso.", className: "bg-green-600 text-white border-none" })
    } catch (error) {
      toast({ title: "Erro", description: error instanceof Error ? error.message : "Falha ao criar.", variant: "destructive" })
    } finally {
      setCreatingUser(false)
    }
  }

  const handleExportCSV = async () => {
    try {
      // Busca todos os usuários que batem o filtro/busca, ignorando paginação
      const allFiltered = await fetchUsersForExport({ search: debouncedSearch, status: activeTab })
      const headers = ["ID", "Nome", "Email", "Telefone", "CPF", "Regiao", "Status", "Função", "Data Cadastro"]
      const csvContent = [
        headers.join(","),
        ...allFiltered.map(u =>
          [
            u.id,
            `"${u.name || u.fullName}"`,
            u.email,
            u.phone || "",
            u.cpf || "",
            `"${u.address || ""}"`,
            u.status,
            u.role,
            new Date(u.createdAt).toLocaleDateString("pt-BR"),
          ].join(",")
        ),
      ].join("\n")

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `usuarios_admin_${new Date().toISOString().slice(0, 10)}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      toast({ title: "Erro ao exportar", description: err instanceof Error ? err.message : "", variant: "destructive" })
    }
  }

  const formatDate = (dateStr: string) => {
    try { return new Date(dateStr).toLocaleDateString("pt-BR") } catch { return "N/A" }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Users className="h-8 w-8 text-amber-500" /> Usuários
          </h1>
          <p className="text-muted-foreground">Gerenciamento de usuários da plataforma.</p>
        </div>
      </div>

      {/* Users actions bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => setIsCreateUserModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] text-white shadow-lg flex-1 md:flex-none transition-all cursor-pointer">
          <Plus className="mr-2 h-4 w-4" /> Criar Usuário
        </Button>
        <Button onClick={() => setIsNewUsersModalOpen(true)} variant="secondary" className="hover:bg-secondary/80 hover:scale-[1.02] active:scale-[0.98] flex-1 md:flex-none transition-all cursor-pointer border border-border">
          <UserPlus className="mr-2 h-4 w-4" /> Novos Cadastros
          {pendingCount > 0 && (
            <span className="ml-2 bg-red-500 text-white text-[10px] px-1.5 rounded-full">
              {pendingCount}
            </span>
          )}
        </Button>
        <Button onClick={handleExportCSV} className="bg-green-600 hover:bg-green-700 hover:scale-[1.02] active:scale-[0.98] text-white shadow-lg flex-1 md:flex-none transition-all cursor-pointer">
          <FileSpreadsheet className="mr-2 h-4 w-4" /> Exportar
        </Button>
      </div>

      {/* Users filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <Tabs defaultValue="all" value={activeTab} onValueChange={(v) => setActiveTab(v as AdminUserStatusFilter)} className="w-full md:w-auto">
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="pending">
              Pendentes
              {pendingCount > 0 && (
                <span className="ml-2 w-2 h-2 rounded-full bg-amber-500 inline-block" />
              )}
            </TabsTrigger>
            <TabsTrigger value="active">Aprovados</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="bg-card border border-border p-2 rounded-xl flex items-center gap-2 shadow-sm w-full md:w-80">
          <Search className="ml-2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="bg-transparent border-none focus-visible:ring-0 placeholder:text-muted-foreground h-8"
          />
        </div>
      </div>

      {/* Users table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        {loadingUsers ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-3 text-muted-foreground">Carregando usuários...</span>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Usuário</TableHead>
                  <TableHead className="text-muted-foreground hidden lg:table-cell">Contato</TableHead>
                  <TableHead className="text-muted-foreground text-center">Status</TableHead>
                  <TableHead className="text-muted-foreground hidden md:table-cell">Cadastro</TableHead>
                  <TableHead className="text-right text-muted-foreground w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length > 0 ? (
                  users.map(user => (
                    <TableRow key={user.id} className="border-border hover:bg-secondary/30 transition-colors">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold flex items-center gap-2">
                            {user.name || user.fullName}
                            {user.role === "admin" && <span className="text-[10px] uppercase bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/30">Admin</span>}
                          </span>
                          <span className="text-xs text-muted-foreground">{user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex flex-col">
                          <span className="text-sm">{user.phone || "—"}</span>
                          {user.address && (
                            <span className="text-xs text-muted-foreground flex items-center gap-0.5 mt-1"><MapPin className="w-2.5 h-2.5" /> {user.address}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{getStatusBadge(user.status)}</TableCell>
                      <TableCell className="text-muted-foreground hidden md:table-cell">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-3 w-3" /> {formatDate(user.createdAt)}
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
                            {user.status === "pending" && (
                              <>
                                <DropdownMenuItem onClick={() => handleStatusChange(user.id, "active")} className="cursor-pointer text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/20">
                                  <CheckCircle className="mr-2 h-4 w-4" /> Aprovar Cadastro
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(user.id, "inactive")} className="cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-950/20">
                                  <XCircle className="mr-2 h-4 w-4" /> Rejeitar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            {user.status === "active" && (
                              <>
                                <DropdownMenuItem onClick={() => handleStatusChange(user.id, "inactive")} className="cursor-pointer text-amber-600 dark:text-amber-400">
                                  <XCircle className="mr-2 h-4 w-4" /> Desativar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            {user.status === "inactive" && (
                              <>
                                <DropdownMenuItem onClick={() => handleStatusChange(user.id, "active")} className="cursor-pointer text-emerald-400">
                                  <CheckCircle className="mr-2 h-4 w-4" /> Reativar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            <DropdownMenuItem onClick={() => handleEditClick(user)}>
                              <Edit className="mr-2 h-4 w-4" /> Ver / Editar Dados
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(user.id)} className="text-red-400">
                              <Trash2 className="mr-2 h-4 w-4" /> Excluir Usuário
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Nenhum usuário encontrado.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <div className="p-4 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-2">
                {searching && <Loader2 className="h-3 w-3 animate-spin" />}
                Mostrando {totalUsers === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, totalUsers)} de {totalUsers}
                {" · "}{pendingCount} aguardando aprovação
              </span>
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
          </>
        )}
      </div>

      {/* ════════════════ MODALS ════════════════ */}

      {/* Create User Modal */}
      <Dialog open={isCreateUserModalOpen} onOpenChange={setIsCreateUserModalOpen}>
        <DialogContent className="sm:max-w-[600px] overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Usuário</DialogTitle>
            <DialogDescription>Preencha os dados abaixo para cadastrar um novo usuário manualmente.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome Completo *</Label>
                <Input value={newUserData.name} onChange={e => setNewUserData({ ...newUserData, name: e.target.value })} placeholder="Ex: João Silva" />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input value={newUserData.email} onChange={e => setNewUserData({ ...newUserData, email: e.target.value })} placeholder="Ex: joao@empresa.com" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><Lock className="w-3 h-3" /> Senha *</Label>
              <Input type="password" value={newUserData.password} onChange={e => setNewUserData({ ...newUserData, password: e.target.value })} placeholder="Mínimo 6 caracteres" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><Phone className="w-3 h-3" /> Telefone</Label>
                <Input value={newUserData.phone} onChange={e => setNewUserData({ ...newUserData, phone: e.target.value })} placeholder="(00) 00000-0000" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><Fingerprint className="w-3 h-3" /> CPF</Label>
                <Input value={newUserData.cpf} onChange={e => setNewUserData({ ...newUserData, cpf: e.target.value })} placeholder="000.000.000-00" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border">
              <div className="space-y-2">
                <Label>Função</Label>
                <select value={newUserData.role} onChange={e => setNewUserData({ ...newUserData, role: e.target.value as "user" | "admin" })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none">
                  <option value="user">Usuário Comum</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Status Inicial</Label>
                <select value={newUserData.status} onChange={e => setNewUserData({ ...newUserData, status: e.target.value as "active" | "pending" | "inactive" })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none">
                  <option value="active">Ativo (Aprovado)</option>
                  <option value="pending">Pendente</option>
                  <option value="inactive">Inativo</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateUserModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateUser} disabled={creatingUser} className="bg-blue-600 hover:bg-blue-700 text-white">
              {creatingUser ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Criar Usuário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[700px] overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Editar / Visualizar Usuário</DialogTitle>
            <DialogDescription>Visualize os dados completos do cadastro e edite se necessário.</DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input value={editingUser.name} onChange={e => setEditingUser({ ...editingUser, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={editingUser.email} readOnly className="opacity-70 cursor-not-allowed" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><Phone className="w-3 h-3" /> Telefone</Label>
                  <Input value={editingUser.phone} onChange={e => setEditingUser({ ...editingUser, phone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><Fingerprint className="w-3 h-3" /> CPF</Label>
                  <Input value={editingUser.cpf || ""} onChange={e => setEditingUser({ ...editingUser, cpf: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Endereço</Label>
                <Input value={editingUser.address || ""} onChange={e => setEditingUser({ ...editingUser, address: e.target.value })} placeholder="Ex: Rua, Número, Bairro, Cidade - UF" />
              </div>

              {SUPER_ADMINS.includes(editingUser.email.toLowerCase()) && (
                <div className="bg-amber-900/20 border border-amber-500/30 p-3 rounded-lg flex items-center gap-2 text-xs text-amber-400">
                  <ShieldAlert className="w-4 h-4" />
                  Este é um Usuário Mestre protegido. Permissões não podem ser removidas.
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border">
                <div className="space-y-2">
                  <Label>Função</Label>
                  <select
                    value={editingUser.role || "user"}
                    onChange={e => setEditingUser({ ...editingUser, role: e.target.value as "user" | "admin" })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none"
                    disabled={SUPER_ADMINS.includes(editingUser.email.toLowerCase())}
                  >
                    <option value="user">Usuário Comum</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <select
                    value={editingUser.status || "pending"}
                    onChange={e => setEditingUser({ ...editingUser, status: e.target.value as "active" | "pending" | "inactive" })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none"
                    disabled={SUPER_ADMINS.includes(editingUser.email.toLowerCase())}
                  >
                    <option value="pending">Pendente</option>
                    <option value="active">Aprovado (Ativo)</option>
                    <option value="inactive">Inativo (Bloqueado)</option>
                  </select>
                </div>
              </div>

              <div className="text-xs text-muted-foreground pt-2 border-t border-border">
                <span>Cadastrado em: {formatDate(editingUser.createdAt)}</span>
                {editingUser.referralCode && <span className="ml-4">Código de indicação: {editingUser.referralCode}</span>}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveEdit} disabled={savingEdit} className="bg-blue-600 hover:bg-blue-700 text-white">
              {savingEdit ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Users Modal */}
      <Dialog open={isNewUsersModalOpen} onOpenChange={setIsNewUsersModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-full">
                <UserPlus className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <DialogTitle>Novos Usuários (Cadastrados Recentemente)</DialogTitle>
                <DialogDescription>Os 5 cadastros mais recentes na plataforma.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="py-4">
            <div className="rounded-md border border-border">
              {recentUsers.length > 0 ? (
                <div className="divide-y divide-border">
                  {recentUsers.map((user, index) => (
                    <div key={user.id} className="p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted border border-border">
                          <span className="font-semibold text-sm">{user.name ? user.name.charAt(0).toUpperCase() : "?"}</span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none flex items-center gap-2">
                            {user.name || user.fullName}
                            {index === 0 && <Badge variant="secondary" className="bg-green-500/10 text-green-400 text-[10px] border-green-500/20">Novo</Badge>}
                          </p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center text-xs text-muted-foreground gap-1">
                          <Clock className="h-3 w-3" /> {formatDate(user.createdAt)}
                        </div>
                        {getStatusBadge(user.status)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">Nenhum cadastro recente encontrado.</div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsNewUsersModalOpen(false)} className="w-full">Fechar Lista</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
