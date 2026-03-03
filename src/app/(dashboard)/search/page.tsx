"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase"
import { fetchCategories } from "@/services/category.service"
import { fetchConnectionsMap, requestConnection, respondConnection, deleteConnection } from "@/services/connection.service"
import type { Category, Connection } from "@/types"
import { Search, MapPin, Mail, MessageCircle, UserPlus, X, Loader2, Building2, Clock, Check, XIcon } from "lucide-react"

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
  contactEmail: string
  gallery: string[]
  score: number
}

export default function SearchPage() {
  const router = useRouter()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "")
  const [companies, setCompanies] = useState<SearchCompany[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [activeCategory, setActiveCategory] = useState("Todos")
  const [loading, setLoading] = useState(true)
  const [connectionsMap, setConnectionsMap] = useState<Map<string, { connectionId: string; status: Connection['status']; iRequested: boolean }>>(new Map())
  const [myScore, setMyScore] = useState(0)
  const [connecting, setConnecting] = useState<string | null>(null)
  const [confirmTarget, setConfirmTarget] = useState<SearchCompany | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        // Fetch companies with joins
        const { data: companiesData, error: companiesError } = await supabase
          .from("companies")
          .select("*, categories(name), users(full_name, email, avatar_url)")
          .order("created_at", { ascending: false })

        if (companiesError) throw companiesError

        // Fetch scores from v_user_stats
        const { data: statsData } = await supabase
          .from("v_user_stats")
          .select("user_id, score")

        const scoreMap = new Map<string, number>()
        for (const row of statsData || []) {
          scoreMap.set(row.user_id as string, (row.score as number) || 0)
        }

        // Set my score
        if (user) {
          setMyScore(scoreMap.get(user.id) || 0)
        }

        // Map and filter out current user's companies
        const mapped: SearchCompany[] = (companiesData || [])
          .filter((row: Record<string, unknown>) => row.user_id !== user?.id)
          .map((row: Record<string, unknown>) => {
            const userRel = row.users as Record<string, unknown> | null
            const catRel = row.categories as Record<string, unknown> | null
            const userId = row.user_id as string
            return {
              id: row.id as string,
              name: (row.name as string) || "",
              ownerName: userRel ? ((userRel.full_name as string) || "") : "",
              ownerEmail: userRel ? ((userRel.email as string) || "") : "",
              ownerAvatar: userRel ? (userRel.avatar_url as string | null) : null,
              userId,
              categoryName: catRel ? ((catRel.name as string) || "Diversos") : "Diversos",
              location: (row.location as string) || "Brasil",
              description: (row.description as string) || "",
              contactEmail: (row.contact_email as string) || "",
              gallery: (row.gallery as string[]) || [],
              score: scoreMap.get(userId) || 0,
            }
          })

        mapped.sort((a, b) => b.score - a.score)
        setCompanies(mapped)

        // Fetch categories for filter badges
        const cats = await fetchCategories()
        setCategories(cats)

        // Fetch connections map
        const cMap = await fetchConnectionsMap()
        setConnectionsMap(cMap)
      } catch (err) {
        console.error("Error loading search data:", err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const filteredCompanies = companies.filter(company => {
    const term = searchTerm.toLowerCase()
    const matchText =
      company.name.toLowerCase().includes(term) ||
      company.ownerName.toLowerCase().includes(term) ||
      company.ownerEmail.toLowerCase().includes(term) ||
      company.categoryName.toLowerCase().includes(term)

    const matchCategory = activeCategory === "Todos" || company.categoryName === activeCategory
    return matchText && matchCategory
  })

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

  const handleAccept = async (company: SearchCompany) => {
    const info = connectionsMap.get(company.userId)
    if (!info) return
    setConnecting(company.userId)
    try {
      await respondConnection(info.connectionId, true)
      setConnectionsMap(prev => {
        const next = new Map(prev)
        next.set(company.userId, { ...info, status: 'accepted' })
        return next
      })
      toast({ title: "Conexão aceita!", description: `Você e ${company.name} agora estão conectados.`, className: "bg-green-600 text-white" })
    } catch (err) {
      console.error(err)
      toast({ title: "Erro", description: "Não foi possível aceitar.", variant: "destructive" })
    } finally {
      setConnecting(null)
    }
  }

  const handleReject = async (company: SearchCompany) => {
    const info = connectionsMap.get(company.userId)
    if (!info) return
    setConnecting(company.userId)
    try {
      await respondConnection(info.connectionId, false)
      setConnectionsMap(prev => {
        const next = new Map(prev)
        next.set(company.userId, { ...info, status: 'rejected' })
        return next
      })
      toast({ title: "Solicitação recusada", description: `Você recusou a conexão com ${company.name}.` })
    } catch (err) {
      console.error(err)
      toast({ title: "Erro", description: "Não foi possível recusar.", variant: "destructive" })
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
        <>
          <Button
            className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-2"
            onClick={() => handleAccept(company)}
            disabled={isProcessing}
          >
            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Aceitar
          </Button>
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={() => handleReject(company)}
            disabled={isProcessing}
          >
            <XIcon className="h-4 w-4" />
            Recusar
          </Button>
        </>
      )
    }

    if (info.status === 'accepted') {
      return (
        <Button
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white gap-2"
          onClick={() => router.push(`/meetings?chat=${company.userId}`)}
        >
          <MessageCircle className="h-4 w-4" />
          Mensagem
        </Button>
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

  const categoryBadges = ["Todos", ...categories.map(c => c.name)]

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
              placeholder="Buscar por nome, empresa, e-mail ou categoria..."
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCompanies.length > 0 ? (
          filteredCompanies.map(company => (
            <div key={company.id} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col h-full">
              <div className="relative h-32 bg-gradient-to-r from-blue-900/20 to-purple-900/20">
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
                  {company.contactEmail && (
                    <div className="flex items-center gap-1 text-muted-foreground text-xs mt-1" title={company.contactEmail}>
                      <Mail className="h-3 w-3" />
                      <span className="truncate max-w-[200px]">{company.contactEmail}</span>
                    </div>
                  )}
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2 mb-6 flex-1">
                  {company.description || `Empresa de ${company.ownerName || "membro"}`}
                </p>

                <div className="flex gap-3 mb-6">
                  {renderActionButtons(company)}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              {searchTerm || activeCategory !== "Todos" ? (
                <Search className="h-8 w-8 text-muted-foreground" />
              ) : (
                <Building2 className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {searchTerm || activeCategory !== "Todos"
                ? "Nenhum resultado encontrado"
                : "Nenhuma empresa cadastrada"}
            </h3>
            <p className="text-muted-foreground max-w-md">
              {searchTerm || activeCategory !== "Todos"
                ? "Tente outros termos ou limpe os filtros."
                : "Ainda não há empresas cadastradas na comunidade."}
            </p>
            {(searchTerm || activeCategory !== "Todos") && (
              <Button
                variant="link"
                onClick={() => { setSearchTerm(""); setActiveCategory("Todos") }}
                className="mt-4"
              >
                Limpar filtros
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Connection confirmation dialog */}
      <AlertDialog open={!!confirmTarget} onOpenChange={(open) => { if (!open) setConfirmTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Solicitar Conexão</AlertDialogTitle>
            <AlertDialogDescription>
              Para solicitar conexão com <strong>{confirmTarget?.name}</strong>, será consumido <strong>1 ponto</strong> do seu score.
              {myScore <= 1 && " Atenção: você está com poucos pontos!"}
              {" "}Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmConnection}>
              Confirmar (-1 ponto)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
