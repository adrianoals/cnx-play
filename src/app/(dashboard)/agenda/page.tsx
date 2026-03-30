"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useCurrentUser } from "@/hooks/use-current-user"
import { fetchTodayConnection, markPresence } from "@/services/daily-match.service"
import type { TodayConnection } from "@/types"
import {
  Link2, Loader2, CheckCircle2, Building2, Tag, Phone,
  UserCircle, CalendarDays, AlertCircle,
} from "lucide-react"

function formatWhatsAppLink(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  const number = digits.startsWith("55") ? digits : `55${digits}`
  return `https://wa.me/${number}`
}

export default function AgendaPage() {
  const { toast } = useToast()
  const { user: currentUser } = useCurrentUser()

  const [connection, setConnection] = useState<TodayConnection | null>(null)
  const [loading, setLoading] = useState(true)
  const [marking, setMarking] = useState(false)

  const loadConnection = useCallback(async () => {
    try {
      setLoading(true)
      const data = await fetchTodayConnection()
      setConnection(data)
    } catch {
      toast({ title: "Erro ao carregar conexão do dia", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (currentUser) loadConnection()
  }, [currentUser, loadConnection])

  const handleMarkPresence = async () => {
    if (!connection) return
    try {
      setMarking(true)
      await markPresence(connection.matchId)
      setConnection(prev => prev ? { ...prev, status: "completed" } : null)
      toast({ title: "Presenca marcada com sucesso!" })
    } catch {
      toast({ title: "Erro ao marcar presenca", variant: "destructive" })
    } finally {
      setMarking(false)
    }
  }

  const alreadyMarked = connection?.status === "completed"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Link2 className="h-8 w-8 text-primary" />
          Conexao do Dia
        </h1>
        <p className="text-muted-foreground">
          Sua conexao de hoje para networking. Entre em contato via WhatsApp!
        </p>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !connection ? (
        /* Estado vazio */
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center py-16 bg-card border border-border rounded-2xl"
        >
          <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-semibold mb-1">Nenhuma conexao para hoje</p>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Voce ainda nao possui uma conexao agendada para hoje.
            O administrador realizara o sorteio em breve.
          </p>
        </motion.div>
      ) : (
        /* Card da Conexão do Dia */
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden"
        >
          {/* Card Header */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border px-6 py-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              <span>
                {new Date(connection.matchDate + "T00:00:00").toLocaleDateString("pt-BR", {
                  weekday: "long",
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </span>
              <span className="text-xs bg-secondary px-2 py-0.5 rounded-lg border border-border">
                {connection.timeSlot === "07:00" ? "Manha" : "Tarde"}
              </span>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-6 space-y-6">
            {/* Partner Info */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center bg-secondary shrink-0 border-2 border-primary/20">
                {connection.partnerAvatar ? (
                  <img
                    src={connection.partnerAvatar}
                    alt={connection.partnerName}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <UserCircle className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold">{connection.partnerName}</h2>
                {connection.partnerCompany && (
                  <p className="text-muted-foreground flex items-center gap-1.5 mt-0.5">
                    <Building2 className="h-4 w-4" />
                    {connection.partnerCompany}
                  </p>
                )}
                {connection.partnerCategory && (
                  <p className="text-muted-foreground text-sm flex items-center gap-1.5 mt-0.5">
                    <Tag className="h-3.5 w-3.5" />
                    {connection.partnerCategory}
                  </p>
                )}
              </div>
            </div>

            {/* WhatsApp Link */}
            {connection.partnerPhone ? (
              <a
                href={formatWhatsAppLink(connection.partnerPhone)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-xl hover:bg-green-500/20 transition-colors"
              >
                <Phone className="h-5 w-5 text-green-600 dark:text-green-400" />
                <div>
                  <p className="font-medium text-green-600 dark:text-green-400 text-sm">
                    Conversar pelo WhatsApp
                  </p>
                  <p className="text-xs text-muted-foreground">{connection.partnerPhone}</p>
                </div>
              </a>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <p className="text-sm text-muted-foreground">
                  Telefone nao disponivel. Entre em contato pelo administrador.
                </p>
              </div>
            )}

            {/* Marcar Presença */}
            <div className="border-t border-border pt-6">
              {alreadyMarked ? (
                <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="font-medium text-green-600 dark:text-green-400 text-sm">
                      Presenca marcada!
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Voce ganhou pontos por esta conexao. Se o parceiro tambem marcar, ambos ganham bonus!
                    </p>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={handleMarkPresence}
                  disabled={marking}
                  className="w-full h-12 rounded-xl text-base font-semibold"
                >
                  {marking ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 mr-2" />
                  )}
                  Marcar Presenca
                </Button>
              )}
              <p className="text-xs text-muted-foreground text-center mt-3">
                +1 ponto ao marcar presenca. Se ambos marcarem, +2 pontos para cada!
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
