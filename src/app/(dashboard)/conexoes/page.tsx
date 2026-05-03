"use client"

import { useState, useEffect, useCallback } from "react"
import {
  fetchReceivedConnections,
  fetchSentConnections,
  respondConnection,
  deleteConnection,
} from "@/services/connection.service"
import { fetchMatchHistory } from "@/services/daily-match.service"
import { createClient } from "@/lib/supabase"
import useSWR from "swr"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { usePagination } from "@/hooks/use-pagination"
import {
  Loader2, Check, X as XIcon, Clock, Users,
  Phone, Building2, Tag, UserCircle, Inbox, Send,
  CalendarDays, CheckCircle2, MinusCircle, Trash2,
  ChevronLeft, ChevronRight,
} from "lucide-react"
import type { ConnectionListItem, MatchHistoryItem } from "@/types"

const ITEMS_PER_PAGE = 10

function formatWhatsAppLink(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  const number = digits.startsWith("55") ? digits : `55${digits}`
  return `https://wa.me/${number}`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function StatusBadge({ status }: { status: ConnectionListItem["status"] }) {
  if (status === "accepted") {
    return (
      <Badge variant="outline" className="gap-1 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
        <CheckCircle2 className="h-3 w-3" /> Aceita
      </Badge>
    )
  }
  if (status === "rejected") {
    return (
      <Badge variant="outline" className="gap-1 bg-muted text-muted-foreground border-border">
        <XIcon className="h-3 w-3" /> Recusada
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="gap-1 bg-amber-500/10 text-amber-400 border-amber-500/20">
      <Clock className="h-3 w-3" /> Pendente
    </Badge>
  )
}

function PaginationControls({ currentPage, totalPages, onPageChange }: {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-center gap-2 pt-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm text-muted-foreground px-3">
        {currentPage} / {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}

export default function ConexoesPage() {
  const { toast } = useToast()

  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [actingOn, setActingOn] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id)
    })
  }, [])

  const fetchAll = useCallback(async () => {
    const [received, sent, dailyHistory] = await Promise.all([
      fetchReceivedConnections(),
      fetchSentConnections(),
      fetchMatchHistory(),
    ])
    return { received, sent, dailyHistory }
  }, [])

  const { data, isLoading: loading, mutate } = useSWR(
    currentUserId ? "conexoes-data" : null,
    fetchAll,
    { refreshInterval: 15000 },
  )

  const received: ConnectionListItem[] = data?.received ?? []
  const sent: ConnectionListItem[] = data?.sent ?? []
  const dailyHistory: MatchHistoryItem[] = data?.dailyHistory ?? []

  const pendingReceivedCount = received.filter(c => c.status === "pending").length

  const receivedPagination = usePagination(received, ITEMS_PER_PAGE)
  const sentPagination = usePagination(sent, ITEMS_PER_PAGE)
  const dailyPagination = usePagination(dailyHistory, ITEMS_PER_PAGE)

  const handleAccept = async (conn: ConnectionListItem) => {
    setActingOn(conn.connectionId)
    try {
      await respondConnection(conn.connectionId, true)
      toast({ title: "Conexão aceita!", description: `Você e ${conn.partnerName} agora estão conectados.`, className: "bg-green-600 text-white" })
      await mutate()
    } catch (err) {
      console.error(err)
      toast({ title: "Erro", description: "Não foi possível aceitar.", variant: "destructive" })
    } finally {
      setActingOn(null)
    }
  }

  const handleReject = async (conn: ConnectionListItem) => {
    setActingOn(conn.connectionId)
    try {
      await respondConnection(conn.connectionId, false)
      await mutate()
      toast({ title: "Solicitação recusada" })
    } catch (err) {
      console.error(err)
      toast({ title: "Erro", description: "Não foi possível recusar.", variant: "destructive" })
    } finally {
      setActingOn(null)
    }
  }

  const handleDelete = async (conn: ConnectionListItem) => {
    setActingOn(conn.connectionId)
    try {
      await deleteConnection(conn.connectionId)
      await mutate()
      toast({ title: "Conexão removida" })
    } catch (err) {
      console.error(err)
      toast({ title: "Erro", description: "Não foi possível remover.", variant: "destructive" })
    } finally {
      setActingOn(null)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-5rem)] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">Carregando conexões...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          Conexões
        </h1>
        <p className="text-muted-foreground">Histórico de conexões diárias e solicitações.</p>
      </div>

      <Tabs defaultValue="diarias">
        <TabsList className="w-full max-w-md">
          <TabsTrigger value="diarias" className="flex-1 gap-2">
            <CalendarDays className="h-4 w-4" />
            Diárias
            {dailyHistory.length > 0 && (
              <span className="text-[10px] font-bold text-muted-foreground">
                ({dailyHistory.length})
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="recebidas" className="flex-1 gap-2">
            <Inbox className="h-4 w-4" />
            Recebidas
            {pendingReceivedCount > 0 && (
              <span className="bg-blue-600 text-white text-[10px] font-bold rounded-full h-5 min-w-[20px] flex items-center justify-center px-1">
                {pendingReceivedCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="enviadas" className="flex-1 gap-2">
            <Send className="h-4 w-4" />
            Enviadas
            {sent.length > 0 && (
              <span className="text-[10px] font-bold text-muted-foreground">
                ({sent.length})
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Tab: Conexões Diárias (histórico) */}
        <TabsContent value="diarias" className="mt-6">
          <div className="max-w-3xl space-y-3">
            {dailyHistory.length === 0 ? (
              <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground">
                <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Nenhuma conexão diária no histórico ainda.</p>
                <p className="text-xs mt-1">As conexões dos dias anteriores aparecerão aqui.</p>
              </div>
            ) : (
              <>
                {dailyPagination.paginatedItems.map(item => {
                  const dateLabel = new Date(item.matchDate + "T00:00:00").toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                  const slotLabel = item.timeSlot === "07:00" ? "Manhã" : "Tarde"

                  let presenceLabel: string
                  let presenceClass: string
                  let PresenceIcon = MinusCircle

                  if (item.bothConfirmed) {
                    presenceLabel = "Ambos marcaram presença"
                    presenceClass = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    PresenceIcon = CheckCircle2
                  } else if (item.status === "completed") {
                    presenceLabel = "Você marcou presença"
                    presenceClass = "bg-blue-500/10 text-blue-400 border-blue-500/20"
                    PresenceIcon = Check
                  } else {
                    presenceLabel = "Sem presença"
                    presenceClass = "bg-muted text-muted-foreground border-border"
                  }

                  return (
                    <div key={item.id} className="bg-card border border-border rounded-2xl p-4 shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center border border-border shrink-0">
                          {item.partnerAvatar ? (
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={item.partnerAvatar} />
                              <AvatarFallback>{(item.partnerName || "??").substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                          ) : (
                            <UserCircle className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{item.partnerName || "—"}</p>
                          {item.partnerCompany && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                              <Building2 className="h-3 w-3 shrink-0" />
                              {item.partnerCompany}
                            </p>
                          )}
                          {item.partnerCategory && (
                            <p className="text-xs text-muted-foreground/70 flex items-center gap-1 truncate">
                              <Tag className="h-3 w-3 shrink-0" />
                              {item.partnerCategory}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <span className="text-[10px] text-muted-foreground">{dateLabel} · {slotLabel}</span>
                          <Badge variant="outline" className={`gap-1 text-[10px] ${presenceClass}`}>
                            <PresenceIcon className="h-3 w-3" />
                            {presenceLabel}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )
                })}
                <PaginationControls
                  currentPage={dailyPagination.currentPage}
                  totalPages={dailyPagination.totalPages}
                  onPageChange={dailyPagination.setCurrentPage}
                />
              </>
            )}
          </div>
        </TabsContent>

        {/* Tab: Recebidas */}
        <TabsContent value="recebidas" className="mt-6">
          <div className="max-w-3xl space-y-3">
            {received.length === 0 ? (
              <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground">
                <Inbox className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Nenhuma solicitação recebida.</p>
                <p className="text-xs mt-1">Quando alguém solicitar conexão com você, aparecerá aqui.</p>
              </div>
            ) : (
              <>
                {receivedPagination.paginatedItems.map(conn => (
                  <ConnectionCard
                    key={conn.connectionId}
                    conn={conn}
                    side="received"
                    actingOn={actingOn}
                    onAccept={() => handleAccept(conn)}
                    onReject={() => handleReject(conn)}
                    onDelete={() => handleDelete(conn)}
                  />
                ))}
                <PaginationControls
                  currentPage={receivedPagination.currentPage}
                  totalPages={receivedPagination.totalPages}
                  onPageChange={receivedPagination.setCurrentPage}
                />
              </>
            )}
          </div>
        </TabsContent>

        {/* Tab: Enviadas */}
        <TabsContent value="enviadas" className="mt-6">
          <div className="max-w-3xl space-y-3">
            {sent.length === 0 ? (
              <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground">
                <Send className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Nenhuma solicitação enviada.</p>
                <p className="text-xs mt-1">As solicitações que você fizer aparecerão aqui.</p>
              </div>
            ) : (
              <>
                {sentPagination.paginatedItems.map(conn => (
                  <ConnectionCard
                    key={conn.connectionId}
                    conn={conn}
                    side="sent"
                    actingOn={actingOn}
                    onAccept={() => handleAccept(conn)}
                    onReject={() => handleReject(conn)}
                    onDelete={() => handleDelete(conn)}
                  />
                ))}
                <PaginationControls
                  currentPage={sentPagination.currentPage}
                  totalPages={sentPagination.totalPages}
                  onPageChange={sentPagination.setCurrentPage}
                />
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ConnectionCard({
  conn,
  side,
  actingOn,
  onAccept,
  onReject,
  onDelete,
}: {
  conn: ConnectionListItem
  side: "received" | "sent"
  actingOn: string | null
  onAccept: () => void
  onReject: () => void
  onDelete: () => void
}) {
  const isProcessing = actingOn === conn.connectionId
  const dateRef = conn.respondedAt || conn.createdAt

  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center border border-border shrink-0">
          {conn.partnerAvatar ? (
            <Avatar className="h-12 w-12">
              <AvatarImage src={conn.partnerAvatar} />
              <AvatarFallback>{(conn.partnerName || "??").substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
          ) : (
            <UserCircle className="h-6 w-6 text-muted-foreground" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{conn.partnerName || "—"}</p>
          {conn.partnerCompany && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
              <Building2 className="h-3 w-3 shrink-0" />
              {conn.partnerCompany}
            </p>
          )}
          {conn.partnerCategory && (
            <p className="text-xs text-muted-foreground/70 flex items-center gap-1 truncate">
              <Tag className="h-3 w-3 shrink-0" />
              {conn.partnerCategory}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className="text-[10px] text-muted-foreground">{formatDate(dateRef)}</span>
          <StatusBadge status={conn.status} />

          {/* Ações por status */}
          {conn.status === "pending" && side === "received" && (
            <div className="flex gap-2 mt-1">
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white gap-1 h-8"
                onClick={onAccept}
                disabled={isProcessing}
              >
                {isProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Aceitar
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1 h-8"
                onClick={onReject}
                disabled={isProcessing}
              >
                <XIcon className="h-3.5 w-3.5" />
                Recusar
              </Button>
            </div>
          )}

          {conn.status === "accepted" && (
            <div className="flex items-center gap-1 mt-1">
              {conn.partnerPhone ? (
                <a
                  href={formatWhatsAppLink(conn.partnerPhone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-md hover:bg-green-500/20 transition-colors"
                >
                  <Phone className="h-3.5 w-3.5" />
                  WhatsApp
                </a>
              ) : (
                <span className="text-[10px] text-muted-foreground">Sem telefone</span>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={onDelete}
                disabled={isProcessing}
                title="Remover conexão"
              >
                {isProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
