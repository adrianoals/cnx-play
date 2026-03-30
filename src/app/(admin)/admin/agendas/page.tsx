"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import {
  fetchUsersGroupedByCompany,
  fetchDailyMatchesAdmin,
  createManualMatch,
  deleteDailyMatch,
  type UserForMatch,
  type AdminDailyMatch,
} from "@/services/admin.service"
import {
  Calendar, ChevronLeft, ChevronRight, Loader2, Search,
  Building2, AlertTriangle, Link2, X, Trash2, UserCircle, History,
} from "lucide-react"

function formatDate(d: Date): string {
  // Usar timezone local para evitar pular de dia com UTC
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function todayBR(): string {
  // Horário de Brasília (UTC-3)
  const now = new Date()
  const brTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }))
  return formatDate(brTime)
}

export default function AdminAgendasPage() {
  const { toast } = useToast()
  const [date, setDate] = useState(() => formatDate(new Date()))
  const [withCompany, setWithCompany] = useState<UserForMatch[]>([])
  const [withoutCompany, setWithoutCompany] = useState<Array<{ id: string; name: string }>>([])
  const [matches, setMatches] = useState<AdminDailyMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const isPastDate = date < todayBR()

  const load = useCallback(async (d: string) => {
    setLoading(true)
    setSelectedUserId(null)
    try {
      const [grouped, matchData] = await Promise.all([
        fetchUsersGroupedByCompany(d),
        fetchDailyMatchesAdmin(d),
      ])
      setWithCompany(grouped.withCompany)
      setWithoutCompany(grouped.withoutCompany)
      setMatches(matchData)
    } catch {
      toast({ title: "Erro", description: "Falha ao carregar dados.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { load(date) }, [date, load])

  function shiftDate(days: number) {
    const d = new Date(date + "T12:00:00")
    d.setDate(d.getDate() + days)
    setDate(formatDate(d))
  }

  const matchedUserIds = new Set<string>()
  for (const m of matches) {
    matchedUserIds.add(m.userId)
    matchedUserIds.add(m.suggestedUserId)
  }

  const availableUsers = withCompany.filter(u => !matchedUserIds.has(u.id))

  const filteredAvailable = search
    ? availableUsers.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.company.toLowerCase().includes(search.toLowerCase())
      )
    : availableUsers
  const filteredWithoutCompany = search
    ? withoutCompany.filter(u => u.name.toLowerCase().includes(search.toLowerCase()))
    : withoutCompany

  async function handleUserClick(userId: string) {
    if (creating || isPastDate) return

    if (!selectedUserId) {
      setSelectedUserId(userId)
      return
    }

    if (selectedUserId === userId) {
      setSelectedUserId(null)
      return
    }

    setCreating(true)
    try {
      await createManualMatch(selectedUserId, userId, date, "07:00")
      toast({ title: "Dupla formada com sucesso!", className: "bg-green-600 border-green-500 text-white" })
      setSelectedUserId(null)
      await load(date)
    } catch (err) {
      toast({
        title: "Erro ao formar dupla",
        description: err instanceof Error ? err.message : "",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  async function handleDeleteMatch(matchId: string) {
    try {
      await deleteDailyMatch(matchId)
      toast({ title: "Conexao removida" })
      await load(date)
    } catch (err) {
      toast({
        title: "Erro ao remover",
        description: err instanceof Error ? err.message : "",
        variant: "destructive",
      })
    }
  }

  const selectedUser = availableUsers.find(u => u.id === selectedUserId)

  const dateLabel = new Date(date + "T12:00:00").toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Link2 className="h-6 w-6 text-primary" />
          Formar Duplas
        </h1>
        <p className="text-muted-foreground text-sm">
          {isPastDate
            ? "Visualizando historico de conexoes."
            : "Clique em um usuario, depois em outro para formar a conexao do dia."
          }
        </p>
      </div>

      {/* Date selector */}
      <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-3 shadow-sm">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => shiftDate(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2 flex-1 justify-center">
          <Calendar className="h-4 w-4 text-primary" />
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="bg-transparent border-none text-sm font-bold text-foreground focus:outline-none"
          />
          <span className="text-xs text-muted-foreground capitalize hidden sm:inline">
            {dateLabel}
          </span>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => shiftDate(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Past date banner */}
      {isPastDate && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 flex items-center gap-2">
          <History className="h-4 w-4 text-amber-500 shrink-0" />
          <p className="text-sm text-amber-600 dark:text-amber-400">
            Voce esta visualizando um dia passado. As duplas nao podem ser alteradas.
          </p>
        </div>
      )}

      {/* ── DUPLAS FORMADAS ── */}
      {matches.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              <p className="text-sm font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                Duplas formadas — {matches.length}
              </p>
            </div>
            <span className="text-xs text-muted-foreground">
              {matchedUserIds.size} usuarios pareados
            </span>
          </div>

          <div className="space-y-3 max-w-2xl mx-auto">
            {matches.map(match => (
              <motion.div
                key={match.id}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-card border-2 border-amber-500/30 rounded-2xl p-5 shadow-sm"
              >
                {/* Pair display */}
                <div className="flex items-center gap-4">
                  {/* User A */}
                  <div className="flex-1 min-w-0 text-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 border ${
                      match.userAStatus === "completed"
                        ? "bg-green-500/15 border-green-500/30"
                        : "bg-blue-500/10 border-blue-500/20"
                    }`}>
                      <UserCircle className={`h-6 w-6 ${
                        match.userAStatus === "completed"
                          ? "text-green-500"
                          : "text-blue-500"
                      }`} />
                    </div>
                    <p className="text-sm font-bold truncate">{match.userAName}</p>
                    <p className="text-xs text-muted-foreground truncate">{match.userACompany}</p>
                    {match.userACategory && (
                      <p className="text-[10px] text-muted-foreground/60 truncate">{match.userACategory}</p>
                    )}
                  </div>

                  {/* Connector */}
                  <div className="flex flex-col items-center gap-1 shrink-0 px-2">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                      <Link2 className="h-5 w-5 text-blue-500" />
                    </div>
                  </div>

                  {/* User B */}
                  <div className="flex-1 min-w-0 text-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 border ${
                      match.userBStatus === "completed"
                        ? "bg-green-500/15 border-green-500/30"
                        : "bg-blue-500/10 border-blue-500/20"
                    }`}>
                      <UserCircle className={`h-6 w-6 ${
                        match.userBStatus === "completed"
                          ? "text-green-500"
                          : "text-blue-500"
                      }`} />
                    </div>
                    <p className="text-sm font-bold truncate">{match.userBName}</p>
                    <p className="text-xs text-muted-foreground truncate">{match.userBCompany}</p>
                    {match.userBCategory && (
                      <p className="text-[10px] text-muted-foreground/60 truncate">{match.userBCategory}</p>
                    )}
                  </div>
                </div>

                {/* Info footer */}
                <div className="mt-4 pt-3 border-t border-border space-y-3">
                  {/* Repeat count */}
                  <div className="text-center">
                    {match.repeatCount > 1 ? (
                      <span className="text-xs text-foreground bg-secondary px-3 py-1.5 rounded-lg border border-border inline-flex items-center gap-1.5">
                        <History className="h-3 w-3 text-blue-500" />
                        Esta e a <strong>{match.repeatCount}a</strong> conexao entre eles
                      </span>
                    ) : (
                      <span className="text-xs text-foreground bg-secondary px-3 py-1.5 rounded-lg border border-border inline-flex items-center gap-1.5">
                        <History className="h-3 w-3 text-blue-500" />
                        Primeira conexao entre eles
                      </span>
                    )}
                  </div>

                  {/* Individual status */}
                  <div className="space-y-1.5">
                    <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg border ${
                      match.userAStatus === "completed"
                        ? "text-green-600 dark:text-green-400 bg-green-500/10 border-green-500/20"
                        : "text-foreground bg-secondary border-border"
                    }`}>
                      <span className={`h-2 w-2 rounded-full shrink-0 ${
                        match.userAStatus === "completed" ? "bg-green-500" : "bg-muted-foreground/30"
                      }`} />
                      <span className="font-semibold">{match.userAName.split(" ")[0]}</span>
                      {match.userAStatus === "completed"
                        ? <span>confirmou a conexao do dia</span>
                        : <span className="text-muted-foreground">ainda nao confirmou a conexao do dia</span>
                      }
                    </div>
                    <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg border ${
                      match.userBStatus === "completed"
                        ? "text-green-600 dark:text-green-400 bg-green-500/10 border-green-500/20"
                        : "text-foreground bg-secondary border-border"
                    }`}>
                      <span className={`h-2 w-2 rounded-full shrink-0 ${
                        match.userBStatus === "completed" ? "bg-green-500" : "bg-muted-foreground/30"
                      }`} />
                      <span className="font-semibold">{match.userBName.split(" ")[0]}</span>
                      {match.userBStatus === "completed"
                        ? <span>confirmou a conexao do dia</span>
                        : <span className="text-muted-foreground">ainda nao confirmou a conexao do dia</span>
                      }
                    </div>
                  </div>

                  {/* Remove button */}
                  {!isPastDate && (
                    <div className="text-center pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-500 border-red-500/30 hover:bg-red-500/10 hover:text-red-600 text-xs gap-1.5"
                        onClick={() => handleDeleteMatch(match.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remover conexao
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ── SELEÇÃO ATIVA ── */}
      <AnimatePresence>
        {selectedUserId && !isPastDate && (
          <motion.div
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -8, opacity: 0 }}
            className="bg-blue-500/10 border border-blue-500/30 rounded-xl px-4 py-3 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <UserCircle className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                  {selectedUser?.name}
                  <span className="text-xs font-normal text-muted-foreground ml-2">
                    {selectedUser?.company}
                  </span>
                </p>
                <p className="text-xs text-blue-500/70">
                  Agora clique no parceiro para formar a dupla
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-blue-500 hover:text-blue-700"
              onClick={() => setSelectedUserId(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── BUSCA + RESUMO ── */}
      {!isPastDate && (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou empresa..."
              className="pl-9 bg-card shadow-sm"
            />
          </div>

          <div className="flex gap-4 text-sm bg-card border border-border rounded-xl px-4 py-2.5 shadow-sm flex-wrap">
            <span className="flex items-center gap-1.5">
              <Link2 className="h-3.5 w-3.5 text-amber-500" />
              <span className="font-bold text-foreground">{matches.length}</span>
              <span className="text-muted-foreground">duplas</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-green-500" />
              <span className="font-bold text-foreground">{availableUsers.length}</span>
              <span className="text-muted-foreground">disponiveis</span>
            </span>
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
              <span className="font-bold text-foreground">{withoutCompany.length}</span>
              <span className="text-muted-foreground">sem empresa</span>
            </span>
          </div>
        </>
      )}

      {/* ── LISTA DE DISPONÍVEIS ── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : isPastDate ? (
        // Past date: only show matches (already above), no available list
        matches.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <History className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>Nenhuma dupla formada neste dia.</p>
          </div>
        )
      ) : filteredAvailable.length === 0 && filteredWithoutCompany.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          {availableUsers.length === 0 && matches.length > 0 ? (
            <>
              <Link2 className="h-10 w-10 mx-auto mb-3 text-green-500 opacity-60" />
              <p className="font-medium text-green-600 dark:text-green-400">
                Todos os usuarios foram pareados!
              </p>
              <p className="text-xs mt-1">Todas as duplas estao formadas para este dia.</p>
            </>
          ) : (
            <>
              <Calendar className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>Nenhum usuario encontrado.</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {filteredAvailable.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <p className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wide">
                  Disponiveis para match ({filteredAvailable.length})
                </p>
              </div>
              <div className="border border-green-500/30 dark:border-green-500/20 rounded-xl overflow-hidden divide-y divide-border shadow-sm">
                {filteredAvailable.map(user => {
                  const isSelected = selectedUserId === user.id
                  const canBePartner = selectedUserId && selectedUserId !== user.id

                  return (
                    <button
                      key={user.id}
                      onClick={() => handleUserClick(user.id)}
                      disabled={creating}
                      className={`w-full flex items-center justify-between gap-3 px-4 py-3 transition-all text-left ${
                        isSelected
                          ? "bg-blue-500/10 border-l-4 border-l-blue-500"
                          : canBePartner
                            ? "bg-card hover:bg-green-500/5 cursor-pointer border-l-4 border-l-transparent hover:border-l-green-500"
                            : "bg-card hover:bg-accent cursor-pointer"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{user.name}</p>
                          {isSelected && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded-md shrink-0">
                              Selecionado
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {user.company}{user.category ? ` · ${user.category}` : ""}
                        </p>
                      </div>
                      {canBePartner && (
                        <span className="text-[10px] font-semibold text-green-600 dark:text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-md shrink-0">
                          Formar dupla
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {filteredWithoutCompany.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-2 w-2 rounded-full bg-red-500" />
                <p className="text-xs font-bold text-red-500 dark:text-red-400 uppercase tracking-wide">
                  Sem Empresa — Regularizar ({filteredWithoutCompany.length})
                </p>
              </div>
              <div className="border border-red-500/30 dark:border-red-500/20 rounded-xl overflow-hidden divide-y divide-border shadow-sm">
                {filteredWithoutCompany.map(u => (
                  <div key={u.id} className="flex items-center justify-between gap-3 px-4 py-3 bg-card">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{u.name}</p>
                      <p className="text-xs text-red-500/70">Sem empresa cadastrada</p>
                    </div>
                    <span className="text-[10px] font-semibold text-red-500 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-md">
                      Inapto
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
