"use client"

import { useState, useEffect, useCallback } from "react"
import { fetchPendingReceived, fetchPendingSent, respondConnection } from "@/services/connection.service"
import { createClient } from "@/lib/supabase"
import useSWR from "swr"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Check, X as XIcon, Clock, Users } from "lucide-react"
import type { Connection } from "@/types"

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
    const [received, sent] = await Promise.all([
      fetchPendingReceived(),
      fetchPendingSent(),
    ])
    return { received, sent }
  }, [])

  const { data: conexoesData, isLoading: loading, mutate: mutateConexoes } = useSWR(
    currentUserId ? "conexoes-data" : null,
    fetchConexoesData,
    { refreshInterval: 15000 },
  )

  const pendingReceived = conexoesData?.received ?? []
  const pendingSent = conexoesData?.sent ?? []

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
        <p className="text-muted-foreground">Gerencie suas solicitacoes de conexao.</p>
      </div>

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
    </div>
  )
}
