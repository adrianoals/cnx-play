"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase"
import { fetchCategories } from "@/services/category.service"
import { fetchConnectionsMap, requestConnection, deleteConnection } from "@/services/connection.service"
import type { Category, Connection } from "@/types"
import Image from "next/image"
import {
  Search, MapPin, UserPlus, X, Loader2, Building2, Clock, Users, Check,
  Pencil, Eye, ChevronLeft, ChevronRight,
} from "lucide-react"

interface SearchCompany {
  id: string
  name: string
  ownerName: string
  ownerEmail: string
  ownerAvatar: string | null
  userId: string
  categoryName: string
  location: string
  description: string
  gallery: string[]
  score: number
  isOwn: boolean
}

const ITEMS_PER_PAGE = 24
const ALL_CATEGORIES = "Todos"

type CompanyRow = {
  id: string
  name: string | null
  user_id: string
  location: string | null
  description: string | null
  gallery: string[] | null
  categories: { id: string; name: string } | { id: string; name: string }[] | null
  users:
    | { full_name: string | null; email: string | null; avatar_url: string | null; status: string }
    | { full_name: string | null; email: string | null; avatar_url: string | null; status: string }[]
    | null
}

function mapRow(row: CompanyRow, scoreMap: Map<string, number>, currentUserId: string | null): SearchCompany {
  const userRel = Array.isArray(row.users) ? row.users[0] : row.users
  const catRel = Array.isArray(row.categories) ? row.categories[0] : row.categories
  const userId = row.user_id
  return {
    id: row.id,
    name: row.name || "",
    ownerName: userRel?.full_name || "",
    ownerEmail: userRel?.email || "",
    ownerAvatar: userRel?.avatar_url ?? null,
    userId,
    categoryName: catRel?.name || "Diversos",
    location: row.location || "Brasil",
    description: row.description || "",
    gallery: row.gallery || [],
    score: scoreMap.get(userId) || 0,
    isOwn: !!currentUserId && userId === currentUserId,
  }
}

export default function SearchPage() {
  const router = useRouter()
  const { toast } = useToast()
  const searchParams = useSearchParams()

  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "")
  const [debouncedTerm, setDebouncedTerm] = useState(searchTerm)
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORIES)
  const [page, setPage] = useState(0)

  const [categories, setCategories] = useState<Category[]>([])
  const [pageCompanies, setPageCompanies] = useState<SearchCompany[]>([])
  const [myCompanies, setMyCompanies] = useState<SearchCompany[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)

  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [myScore, setMyScore] = useState(0)
  const [connectionsMap, setConnectionsMap] = useState<Map<string, { connectionId: string; status: Connection['status']; iRequested: boolean }>>(new Map())

  const [connecting, setConnecting] = useState<string | null>(null)
  const [confirmTarget, setConfirmTarget] = useState<SearchCompany | null>(null)
  const [detailsCompany, setDetailsCompany] = useState<SearchCompany | null>(null)

  // Debounce do termo de busca (400ms)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedTerm(searchTerm), 400)
    return () => clearTimeout(t)
  }, [searchTerm])

  // Reset para página 0 quando filtros mudam
  useEffect(() => {
    setPage(0)
  }, [debouncedTerm, activeCategory])

  // Load inicial: usuário, score, categorias, connections, "minha(s) empresa(s)"
  useEffect(() => {
    async function loadInitial() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) setCurrentUserId(user.id)

        // Score do usuário logado
        if (user) {
          const { data: myStat } = await supabase
            .from("v_user_stats")
            .select("score")
            .eq("user_id", user.id)
            .maybeSingle()
          setMyScore((myStat?.score as number) || 0)
        }

        // Categorias (filtro)
        const cats = await fetchCategories()
        setCategories(cats)

        // Connections map (todas as conexões do usuário — pequeno volume)
        const cMap = await fetchConnectionsMap()
        setConnectionsMap(cMap)

        // Minhas empresas (sempre fixas no topo, em todas as páginas)
        if (user) {
          const { data: minhas } = await supabase
            .from("companies")
            .select("id, name, user_id, location, description, gallery, categories(id, name), users!inner(full_name, email, avatar_url, status)")
            .eq("user_id", user.id)
            .eq("users.status", "active")

          const myMapped = (minhas as unknown as CompanyRow[] | null || []).map(row =>
            mapRow(row, new Map(), user.id)
          )
          setMyCompanies(myMapped)
        }
      } catch (err) {
        console.error("Error loading search initial data:", err)
      }
    }
    loadInitial()
  }, [])

  // Fetch da página atual (server-side: paginação + busca + filtro)
  const fetchPage = useCallback(async () => {
    setSearching(true)
    try {
      const supabase = createClient()

      // Sem filtros, na página 0, "minhas empresas" ocupam slots no topo —
      // descontamos esse espaço da quantidade de "outras" buscadas, pra
      // manter o total de cards constante (ITEMS_PER_PAGE) por página.
      const noFilters = !debouncedTerm.trim() && activeCategory === ALL_CATEGORIES
      const myCountInPage0 = noFilters ? myCompanies.length : 0
      const slotsForOthers = page === 0 ? ITEMS_PER_PAGE - myCountInPage0 : ITEMS_PER_PAGE
      const rangeStart = page === 0 ? 0 : (ITEMS_PER_PAGE - myCountInPage0) + (page - 1) * ITEMS_PER_PAGE
      const rangeEnd = rangeStart + slotsForOthers - 1

      let query = supabase
        .from("companies")
        .select(
          "id, name, user_id, location, description, gallery, categories!inner(id, name), users!inner(full_name, email, avatar_url, status)",
          { count: "exact" }
        )
        .eq("users.status", "active")

      // Excluir minhas empresas dessa lista (elas vêm em myCompanies)
      if (currentUserId) {
        query = query.neq("user_id", currentUserId)
      }

      // Filtro de categoria
      if (activeCategory !== ALL_CATEGORIES) {
        const cat = categories.find(c => c.name === activeCategory)
        if (cat) query = query.eq("category_id", cat.id)
      }

      // Busca textual em company.name (caso mais comum)
      const term = debouncedTerm.trim()
      if (term) {
        query = query.ilike("name", `%${term}%`)
      }

      // Ordenação + paginação
      query = query
        .order("created_at", { ascending: false })
        .range(rangeStart, rangeEnd)

      const { data, error, count } = await query
      if (error) throw error

      const rows = (data as unknown as CompanyRow[] | null) || []

      // Buscar scores apenas dos usuários na página atual
      const userIds = [...new Set(rows.map(r => r.user_id))]
      const scoreMap = new Map<string, number>()
      if (userIds.length > 0) {
        const { data: scores } = await supabase
          .from("v_user_stats")
          .select("user_id, score")
          .in("user_id", userIds)
        for (const s of scores || []) {
          scoreMap.set(s.user_id as string, (s.score as number) || 0)
        }
      }

      setPageCompanies(rows.map(r => mapRow(r, scoreMap, currentUserId)))
      setTotalCount(count || 0)
    } catch (err) {
      console.error("Error fetching companies page:", err)
      setPageCompanies([])
      setTotalCount(0)
    } finally {
      setSearching(false)
      setLoading(false)
    }
  }, [page, debouncedTerm, activeCategory, currentUserId, categories, myCompanies.length])

  // Espera carregar categories (e o user) antes de buscar
  useEffect(() => {
    if (categories.length === 0) return
    fetchPage()
  }, [fetchPage, categories.length])

  const showMyCompanies = page === 0 && !debouncedTerm && activeCategory === ALL_CATEGORIES
  const noFiltersActive = !debouncedTerm && activeCategory === ALL_CATEGORIES
  // Quando "minhas empresas" estão visíveis, contam junto pro total de páginas
  const effectiveTotal = noFiltersActive ? totalCount + myCompanies.length : totalCount
  const totalPages = Math.max(1, Math.ceil(effectiveTotal / ITEMS_PER_PAGE))
  const displayed = useMemo(() => {
    return showMyCompanies ? [...myCompanies, ...pageCompanies] : pageCompanies
  }, [showMyCompanies, myCompanies, pageCompanies])

  const handleRequestConnection = async (company: SearchCompany) => {
    if (myScore < 1) {
      toast({ title: "Pontos insuficientes", description: "Você precisa de pelo menos 1 ponto para solicitar uma conexão.", variant: "destructive" })
      return
    }
    setConfirmTarget(company)
  }

  const confirmConnection = async () => {
    if (!confirmTarget) return
    setConnecting(confirmTarget.userId)
    setConfirmTarget(null)
    try {
      const conn = await requestConnection(confirmTarget.userId)
      setConnectionsMap(prev => {
        const next = new Map(prev)
        next.set(confirmTarget.userId, { connectionId: conn.id, status: 'pending', iRequested: true })
        return next
      })
      toast({ title: "Solicitação enviada", description: `Solicitação de conexão enviada para ${confirmTarget.name}.`, className: "bg-blue-600 text-white" })
    } catch (err) {
      console.error(err)
      toast({ title: "Erro", description: "Não foi possível enviar a solicitação.", variant: "destructive" })
    } finally {
      setConnecting(null)
    }
  }

  const handleReconnect = async (company: SearchCompany) => {
    const info = connectionsMap.get(company.userId)
    if (!info) return
    if (myScore < 1) {
      toast({ title: "Pontos insuficientes", description: "Você precisa de pelo menos 1 ponto para solicitar uma conexão.", variant: "destructive" })
      return
    }
    setConnecting(company.userId)
    try {
      await deleteConnection(info.connectionId)
      const conn = await requestConnection(company.userId)
      setConnectionsMap(prev => {
        const next = new Map(prev)
        next.set(company.userId, { connectionId: conn.id, status: 'pending', iRequested: true })
        return next
      })
      toast({ title: "Solicitação reenviada", description: `Nova solicitação enviada para ${company.name}.`, className: "bg-blue-600 text-white" })
    } catch (err) {
      console.error(err)
      toast({ title: "Erro", description: "Não foi possível reenviar.", variant: "destructive" })
    } finally {
      setConnecting(null)
    }
  }

  const renderActionButtons = (company: SearchCompany) => {
    if (company.isOwn) {
      return (
        <Button
          variant="outline"
          className="flex-1 gap-2"
          onClick={() => router.push("/account")}
        >
          <Pencil className="h-4 w-4" />
          Editar empresa
        </Button>
      )
    }

    const info = connectionsMap.get(company.userId)
    const isProcessing = connecting === company.userId

    if (!info) {
      return (
        <Button
          className="flex-1 gap-2"
          onClick={() => handleRequestConnection(company)}
          disabled={isProcessing}
        >
          {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          Conectar
        </Button>
      )
    }

    if (info.status === 'pending' && info.iRequested) {
      return (
        <Badge variant="outline" className="flex-1 justify-center py-2 text-sm gap-2 cursor-default">
          <Clock className="h-4 w-4" />
          Pendente
        </Badge>
      )
    }

    if (info.status === 'pending' && !info.iRequested) {
      return (
        <Button
          variant="outline"
          className="flex-1 gap-2"
          onClick={() => router.push("/conexoes")}
        >
          <Users className="h-4 w-4" />
          Solicitação Recebida
        </Button>
      )
    }

    if (info.status === 'accepted') {
      return (
        <Badge variant="outline" className="flex-1 justify-center py-2 text-sm gap-2 cursor-default bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30">
          <Check className="h-4 w-4" />
          Conectado
        </Badge>
      )
    }

    if (info.status === 'rejected') {
      return (
        <Button
          className="flex-1 gap-2"
          onClick={() => handleReconnect(company)}
          disabled={isProcessing}
        >
          {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          Conectar
        </Button>
      )
    }

    return null
  }

  const categoryBadges = [ALL_CATEGORIES, ...categories.map(c => c.name)]

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto flex items-center justify-center py-32">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">Carregando empresas...</span>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Explorar Comunidade</h1>
          <p className="text-muted-foreground">Encontre parceiros, clientes e fornecedores.</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome da empresa..."
              className="pl-10 h-12 text-lg bg-card border-border shadow-sm rounded-xl"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {categoryBadges.map(cat => (
            <Badge
              key={cat}
              variant={activeCategory === cat ? "default" : "outline"}
              className={`cursor-pointer px-4 py-2 text-sm whitespace-nowrap rounded-lg transition-all ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-card hover:bg-muted"
              }`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </Badge>
          ))}
        </div>
      </div>

      {searching && (
        <div className="flex items-center justify-center py-2 text-sm text-muted-foreground gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Buscando...
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {displayed.length > 0 ? (
          displayed.map(company => (
            <div
              key={company.id}
              onClick={() => setDetailsCompany(company)}
              className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col h-full cursor-pointer"
            >
              <div className="relative h-32 bg-gradient-to-r from-blue-900/20 to-purple-900/20">
                {company.isOwn && (
                  <div className="absolute top-4 left-4 bg-primary/90 text-primary-foreground backdrop-blur-sm px-2 py-1 rounded-md text-xs font-semibold border border-primary/30 shadow-sm">
                    Sua empresa
                  </div>
                )}
                <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-semibold border border-border">
                  {company.categoryName}
                </div>
              </div>

              <div className="px-6 relative flex-1 flex flex-col">
                <div className="absolute -top-12 left-6">
                  <Avatar className="w-24 h-24 border-4 border-card shadow-lg">
                    <AvatarImage src={company.gallery[0] || company.ownerAvatar || undefined} className="object-cover" />
                    <AvatarFallback className="text-2xl font-bold bg-muted text-muted-foreground">
                      {company.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <div className="mt-14 mb-4">
                  <h3 className="text-xl font-bold truncate" title={company.name}>
                    {company.name}
                  </h3>
                  {company.ownerName && (
                    <p className="text-sm text-primary font-medium">{company.ownerName}</p>
                  )}
                  <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">{company.location}</span>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2 mb-6 flex-1">
                  {company.description || `Empresa de ${company.ownerName || "membro"}`}
                </p>

                <div className="flex flex-col gap-2 mb-6" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={() => setDetailsCompany(company)}
                  >
                    <Eye className="h-4 w-4" />
                    Ver detalhes
                  </Button>
                  {renderActionButtons(company)}
                </div>
              </div>
            </div>
          ))
        ) : (
          !searching && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                {debouncedTerm || activeCategory !== ALL_CATEGORIES ? (
                  <Search className="h-8 w-8 text-muted-foreground" />
                ) : (
                  <Building2 className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {debouncedTerm || activeCategory !== ALL_CATEGORIES
                  ? "Nenhum resultado encontrado"
                  : "Nenhuma empresa cadastrada"}
              </h3>
              <p className="text-muted-foreground max-w-md">
                {debouncedTerm || activeCategory !== ALL_CATEGORIES
                  ? "Tente outros termos ou limpe os filtros."
                  : "Ainda não há empresas cadastradas na comunidade."}
              </p>
              {(debouncedTerm || activeCategory !== ALL_CATEGORIES) && (
                <Button
                  variant="link"
                  onClick={() => { setSearchTerm(""); setActiveCategory(ALL_CATEGORIES) }}
                  className="mt-4"
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          )
        )}
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0 || searching}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground px-3">
            Página {page + 1} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1 || searching}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Company details dialog */}
      <Dialog open={!!detailsCompany} onOpenChange={(open) => { if (!open) setDetailsCompany(null) }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {detailsCompany && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-2xl">
                  {detailsCompany.name}
                  {detailsCompany.isOwn && (
                    <Badge className="bg-primary/90 text-primary-foreground">Sua empresa</Badge>
                  )}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 mt-2">
                {/* Gallery */}
                {detailsCompany.gallery.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {detailsCompany.gallery.map((url, idx) => (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                        <Image
                          src={url}
                          alt={`${detailsCompany.name} — imagem ${idx + 1}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 50vw, 33vw"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Owner + category */}
                <div className="flex flex-wrap items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={detailsCompany.ownerAvatar || undefined} className="object-cover" />
                    <AvatarFallback>{detailsCompany.ownerName.charAt(0) || "?"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    {detailsCompany.ownerName && (
                      <p className="font-semibold text-foreground">{detailsCompany.ownerName}</p>
                    )}
                    <Badge variant="outline" className="mt-1">{detailsCompany.categoryName}</Badge>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span>{detailsCompany.location}</span>
                </div>

                {/* Description */}
                {detailsCompany.description ? (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2">Sobre a empresa</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {detailsCompany.description}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm italic text-muted-foreground">Sem descrição cadastrada.</p>
                )}

                {/* Connection action */}
                <div className="pt-2 border-t border-border">
                  {renderActionButtons(detailsCompany)}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Connection confirmation dialog */}
      <AlertDialog open={!!confirmTarget} onOpenChange={(open) => { if (!open) setConfirmTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Solicitar Conexão</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja solicitar conexao com <strong>{confirmTarget?.name}</strong>?
              {myScore <= 1 && " Atencao: voce esta com poucos pontos!"}
              {" "}E necessario ter pelo menos 1 ponto de score.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmConnection}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
