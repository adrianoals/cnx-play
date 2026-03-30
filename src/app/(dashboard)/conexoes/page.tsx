"use client"

import { useState, useEffect, useCallback } from "react"
import { fetchPendingReceived, fetchPendingSent, respondConnection, fetchAcceptedConnections } from "@/services/connection.service"
import { createClient } from "@/lib/supabase"
import useSWR from "swr"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import {
  Loader2, Check, X as XIcon, Clock, Users,
  Phone, Building2, Tag, UserCircle, Handshake,
} from "lucide-react"
import type { Connection, AcceptedConnection } from "@/types"

function formatWhatsAppLink(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  const number = digits.startsWith("55") ? digits : `55${digits}`
  return `https://wa.me/${number}`
}

export default function ConexoesPage() {
  const { toast } = useToast()

  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [responding, setResponding] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id)
    })
  }, [])

  const fetchConexoesData = useCallback(async () => {
    const [received, sent, accepted] = await Promise.all([
      fetchPendingReceived(),
      fetchPendingSent(),
      fetchAcceptedConnections(),
    ])
    return { received, sent, accepted }
  }, [])

  const { data: conexoesData, isLoading: loading, mutate: mutateConexoes } = useSWR(
    currentUserId ? "conexoes-data" : null,
    fetchConexoesData,
    { refreshInterval: 15000 },
  )

  const pendingReceived = conexoesData?.received ?? []
  const pendingSent = conexoesData?.sent ?? []
  const acceptedConnections = conexoesData?.accepted ?? []

  const pendingTotal = pendingReceived.length + pendingSent.length

  const handleAccept = async (conn: Connection) => {
    setResponding(conn.id)
    try {
      await respondConnection(conn.id, true)
      toast({ title: "Conexao aceita!", description: `Voce e ${conn.requesterName} agora estao conectados.`, className: "bg-green-600 text-white" })
      await mutateConexoes()
    } catch (err) {
      console.error(err)
      toast({ title: "Erro", description: "Nao foi possivel aceitar.", variant: "destructive" })
    } finally {
      setResponding(null)
    }
  }

  const handleReject = async (conn: Connection) => {
    setResponding(conn.id)
    try {
      await respondConnection(conn.id, false)
      mutateConexoes()
      toast({ title: "Solicitacao recusada" })
    } catch (err) {
      console.error(err)
      toast({ title: "Erro", description: "Nao foi possivel recusar.", variant: "destructive" })
    } finally {
      setResponding(null)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-5rem)] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">Carregando conexoes...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          Conexoes
        </h1>
        <p className="text-muted-foreground">Suas solicitacoes e conexoes realizadas.</p>
      </div>

      <Tabs defaultValue={pendingTotal > 0 ? "solicitacoes" : "realizadas"}>
        <TabsList className="w-full max-w-md">
          <TabsTrigger value="solicitacoes" className="flex-1 gap-2">
            <Clock className="h-4 w-4" />
            Solicitacoes
            {pendingTotal > 0 && (
              <span className="bg-blue-600 text-white text-[10px] font-bold rounded-full h-5 min-w-[20px] flex items-center justify-center px-1">
                {pendingTotal}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="realizadas" className="flex-1 gap-2">
            <Handshake className="h-4 w-4" />
            Aceitas
            {acceptedConnections.length > 0 && (
              <span className="text-[10px] font-bold text-muted-foreground">
                ({acceptedConnections.length})
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Tab: Solicitações */}
        <TabsContent value="solicitacoes" className="mt-6">
          <div className="max-w-3xl space-y-8">
            {/* Recebidas */}
            <div>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                Recebidas
                {pendingReceived.length > 0 && (
                  <Badge className="bg-blue-600 text-white">{pendingReceived.length}</Badge>
                )}
              </h2>
              {pendingReceived.length === 0 ? (
                <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground">
                  Nenhuma solicitacao recebida pendente.
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingReceived.map(conn => (
                    <div key={conn.id} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
                      <Avatar className="h-12 w-12 border border-border">
                        <AvatarImage src={conn.requesterAvatar || undefined} />
                        <AvatarFallback>{(conn.requesterName || "??").substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{conn.requesterName}</p>
                        <p className="text-xs text-muted-foreground truncate">{conn.requesterCompany || "—"}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white gap-1"
                          onClick={() => handleAccept(conn)}
                          disabled={responding === conn.id}
                        >
                          {responding === conn.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                          Aceitar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          onClick={() => handleReject(conn)}
                          disabled={responding === conn.id}
                        >
                          <XIcon className="h-4 w-4" />
                          Recusar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Enviadas */}
            <div>
              <h2 className="text-lg font-bold mb-4">Enviadas</h2>
              {pendingSent.length === 0 ? (
                <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground">
                  Nenhuma solicitacao enviada pendente.
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingSent.map(conn => (
                    <div key={conn.id} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
                      <Avatar className="h-12 w-12 border border-border">
                        <AvatarImage src={conn.requestedAvatar || undefined} />
                        <AvatarFallback>{(conn.requestedName || "??").substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{conn.requestedName}</p>
                        <p className="text-xs text-muted-foreground truncate">{conn.requestedCompany || "—"}</p>
                      </div>
                      <Badge variant="outline" className="gap-1 shrink-0">
                        <Clock className="h-3 w-3" />
                        Pendente
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Tab: Conexões Aceitas */}
        <TabsContent value="realizadas" className="mt-6">
          <div className="max-w-3xl space-y-3">
            {acceptedConnections.length === 0 ? (
              <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground">
                <Handshake className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Nenhuma conexao realizada ainda.</p>
                <p className="text-xs mt-1">Quando suas solicitacoes forem aceitas, elas aparecerao aqui.</p>
              </div>
            ) : (
              acceptedConnections.map((conn: AcceptedConnection) => {
                const dateLabel = new Date(conn.connectedAt).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })

                return (
                  <div key={conn.connectionId} className="bg-card border border-border rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center border border-border shrink-0">
                        {conn.partnerAvatar ? (
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={conn.partnerAvatar} />
                            <AvatarFallback>{conn.partnerName.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                        ) : (
                          <UserCircle className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{conn.partnerName}</p>
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

                      {/* Actions */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className="text-[10px] text-muted-foreground">{dateLabel}</span>
                        {conn.partnerPhone ? (
                          <a
                            href={formatWhatsAppLink(conn.partnerPhone)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-lg hover:bg-green-500/20 transition-colors"
                          >
                            <Phone className="h-3.5 w-3.5" />
                            WhatsApp
                          </a>
                        ) : (
                          <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-1 rounded-md border border-border">
                            Sem telefone
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
