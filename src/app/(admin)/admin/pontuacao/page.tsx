"use client"

import { useState, useEffect, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase"
import { getUserLevel } from "@/lib/constants"
import {
  Trophy, Search, Loader2, ArrowUpDown, Video, Gift, Handshake,
  Users, Minus, ChevronDown, ChevronUp,
} from "lucide-react"

interface UserScore {
  userId: string
  fullName: string
  companyName: string | null
  meetingsCompleted: number
  referralsCompleted: number
  dealCount: number
  dealValue: number
  connectionsSent: number
  score: number
  level: string
}

type SortField = "score" | "meetingsCompleted" | "referralsCompleted" | "dealCount" | "connectionsSent" | "fullName"
type SortDir = "asc" | "desc"

export default function AdminPontuacaoPage() {
  const { toast } = useToast()
  const [users, setUsers] = useState<UserScore[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [sortField, setSortField] = useState<SortField>("score")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [expandedUser, setExpandedUser] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()

      const { data: stats, error: statsErr } = await supabase
        .from("v_user_stats")
        .select("user_id, full_name, company_name, meetings_completed, referrals_completed, total_deal_value, deal_count, score, level")

      if (statsErr) throw statsErr

      // Fetch connections_sent per user for breakdown
      const { data: connData } = await supabase
        .from("connections")
        .select("requester_id")

      const connCounts = new Map<string, number>()
      for (const c of connData || []) {
        connCounts.set(c.requester_id, (connCounts.get(c.requester_id) || 0) + 1)
      }

      const mapped: UserScore[] = (stats || []).map((row: Record<string, unknown>) => ({
        userId: row.user_id as string,
        fullName: (row.full_name as string) || "",
        companyName: (row.company_name as string) || null,
        meetingsCompleted: Number(row.meetings_completed) || 0,
        referralsCompleted: Number(row.referrals_completed) || 0,
        dealCount: Number(row.deal_count) || 0,
        dealValue: Number(row.total_deal_value) || 0,
        connectionsSent: connCounts.get(row.user_id as string) || 0,
        score: Number(row.score) || 0,
        level: (row.level as string) || "Platina",
      }))

      setUsers(mapped)
    } catch {
      toast({ title: "Erro", description: "Falha ao carregar pontuacoes.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { load() }, [load])

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(d => d === "desc" ? "asc" : "desc")
    } else {
      setSortField(field)
      setSortDir("desc")
    }
  }

  const filtered = search
    ? users.filter(u =>
        u.fullName.toLowerCase().includes(search.toLowerCase()) ||
        (u.companyName || "").toLowerCase().includes(search.toLowerCase())
      )
    : users

  const sorted = [...filtered].sort((a, b) => {
    const aVal = a[sortField] ?? ""
    const bVal = b[sortField] ?? ""
    if (typeof aVal === "string") {
      return sortDir === "asc"
        ? aVal.localeCompare(bVal as string)
        : (bVal as string).localeCompare(aVal)
    }
    return sortDir === "asc"
      ? (aVal as number) - (bVal as number)
      : (bVal as number) - (aVal as number)
  })

  // Totals
  const totalMeetings = users.reduce((s, u) => s + u.meetingsCompleted, 0)
  const totalReferrals = users.reduce((s, u) => s + u.referralsCompleted, 0)
  const totalDeals = users.reduce((s, u) => s + u.dealCount, 0)
  const totalDealValue = users.reduce((s, u) => s + u.dealValue, 0)

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 text-muted-foreground/40" />
    return sortDir === "desc"
      ? <ChevronDown className="h-3 w-3 text-primary" />
      : <ChevronUp className="h-3 w-3 text-primary" />
  }

  function getLevelStyle(level: string) {
    const info = getUserLevel(
      level === "Diamante" ? 151 : level === "Safira" ? 50 : 0
    )
    switch (info.name) {
      case "Diamante":
        return "text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/20"
      case "Safira":
        return "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20"
      default:
        return "text-muted-foreground bg-secondary border-border"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Trophy className="h-6 w-6 text-primary" />
          Pontuacao
        </h1>
        <p className="text-muted-foreground text-sm">Visualize a pontuacao de todos os usuarios e o detalhamento por categoria.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Video className="h-4 w-4 text-blue-500" />
            <p className="text-xs text-muted-foreground font-medium">Reunioes</p>
          </div>
          <p className="text-2xl font-bold">{totalMeetings}</p>
          <p className="text-[10px] text-muted-foreground">+1 ponto cada</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Gift className="h-4 w-4 text-purple-500" />
            <p className="text-xs text-muted-foreground font-medium">Indicacoes</p>
          </div>
          <p className="text-2xl font-bold">{totalReferrals}</p>
          <p className="text-[10px] text-muted-foreground">+1 ponto cada</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Handshake className="h-4 w-4 text-green-500" />
            <p className="text-xs text-muted-foreground font-medium">Negocios</p>
          </div>
          <p className="text-2xl font-bold">{totalDeals}</p>
          <p className="text-[10px] text-muted-foreground">+5 pontos cada</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Handshake className="h-4 w-4 text-yellow-500" />
            <p className="text-xs text-muted-foreground font-medium">Valor Gerado</p>
          </div>
          <p className="text-xl font-bold">
            R$ {totalDealValue.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          placeholder="Buscar por nome ou empresa..."
          className="pl-9 bg-card shadow-sm"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>Nenhum usuario encontrado.</p>
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden shadow-sm">
          {/* Table header */}
          <div className="bg-secondary/50 border-b border-border px-4 py-2.5 hidden md:grid md:grid-cols-[1fr_80px_80px_80px_80px_80px_70px] gap-3 items-center">
            <button onClick={() => handleSort("fullName")} className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide text-left">
              Usuario <SortIcon field="fullName" />
            </button>
            <button onClick={() => handleSort("score")} className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide justify-end">
              Score <SortIcon field="score" />
            </button>
            <button onClick={() => handleSort("meetingsCompleted")} className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide justify-end">
              Reunioes <SortIcon field="meetingsCompleted" />
            </button>
            <button onClick={() => handleSort("referralsCompleted")} className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide justify-end">
              Indicacoes <SortIcon field="referralsCompleted" />
            </button>
            <button onClick={() => handleSort("dealCount")} className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide justify-end">
              Negocios <SortIcon field="dealCount" />
            </button>
            <button onClick={() => handleSort("connectionsSent")} className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide justify-end">
              Conexoes <SortIcon field="connectionsSent" />
            </button>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-center">
              Nivel
            </span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-border">
            {sorted.map((user, i) => {
              const isExpanded = expandedUser === user.userId
              const rank = i + 1

              return (
                <div key={user.userId}>
                  {/* Desktop row */}
                  <div
                    className="hidden md:grid md:grid-cols-[1fr_80px_80px_80px_80px_80px_70px] gap-3 items-center px-4 py-3 bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => setExpandedUser(isExpanded ? null : user.userId)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        rank === 1 ? "bg-yellow-500/20 text-yellow-600" :
                        rank === 2 ? "bg-gray-400/20 text-gray-500" :
                        rank === 3 ? "bg-amber-700/20 text-amber-600" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {rank}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{user.fullName}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.companyName || "—"}</p>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-right">{user.score}</p>
                    <p className="text-sm text-right text-muted-foreground">{user.meetingsCompleted}</p>
                    <p className="text-sm text-right text-muted-foreground">{user.referralsCompleted}</p>
                    <p className="text-sm text-right text-muted-foreground">{user.dealCount}</p>
                    <p className="text-sm text-right text-muted-foreground">-{user.connectionsSent}</p>
                    <div className="text-center">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${getLevelStyle(user.level)}`}>
                        {user.level}
                      </span>
                    </div>
                  </div>

                  {/* Mobile row */}
                  <button
                    className="md:hidden w-full flex items-center justify-between gap-3 px-4 py-3 bg-card hover:bg-accent/50 text-left"
                    onClick={() => setExpandedUser(isExpanded ? null : user.userId)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        rank === 1 ? "bg-yellow-500/20 text-yellow-600" :
                        rank === 2 ? "bg-gray-400/20 text-gray-500" :
                        rank === 3 ? "bg-amber-700/20 text-amber-600" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {rank}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{user.fullName}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.companyName || "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-bold">{user.score} pts</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${getLevelStyle(user.level)}`}>
                        {user.level}
                      </span>
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="bg-secondary/30 border-t border-border px-4 py-4">
                      <div className="max-w-md mx-auto space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                          Detalhamento — {user.fullName.split(" ")[0]}
                        </p>

                        <div className="flex items-center justify-between text-sm py-1.5">
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <Video className="h-3.5 w-3.5 text-blue-500" />
                            Reunioes (presenca)
                          </span>
                          <span className="font-medium">
                            {user.meetingsCompleted} <span className="text-xs text-muted-foreground">× 1 = <strong className="text-foreground">+{user.meetingsCompleted}</strong></span>
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-sm py-1.5">
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <Gift className="h-3.5 w-3.5 text-purple-500" />
                            Indicacoes completadas
                          </span>
                          <span className="font-medium">
                            {user.referralsCompleted} <span className="text-xs text-muted-foreground">× 1 = <strong className="text-foreground">+{user.referralsCompleted}</strong></span>
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-sm py-1.5">
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <Handshake className="h-3.5 w-3.5 text-green-500" />
                            Negocios aprovados
                          </span>
                          <span className="font-medium">
                            {user.dealCount} <span className="text-xs text-muted-foreground">× 5 = <strong className="text-foreground">+{user.dealCount * 5}</strong></span>
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-sm py-1.5">
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <Minus className="h-3.5 w-3.5 text-red-500" />
                            Conexoes solicitadas
                          </span>
                          <span className="font-medium text-red-500">
                            -{user.connectionsSent}
                          </span>
                        </div>

                        {user.dealValue > 0 && (
                          <div className="flex items-center justify-between text-sm py-1.5 border-t border-border mt-1 pt-2">
                            <span className="flex items-center gap-2 text-muted-foreground">
                              <Handshake className="h-3.5 w-3.5 text-yellow-500" />
                              Valor total em negocios
                            </span>
                            <span className="font-medium">
                              R$ {user.dealValue.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-sm py-2 border-t border-border mt-2 pt-3">
                          <span className="font-bold">Score total</span>
                          <span className="text-lg font-bold text-primary">{user.score} pts</span>
                        </div>

                        <p className="text-[10px] text-muted-foreground text-center pt-1">
                          Score = reunioes + indicacoes + (negocios × 5) - conexoes solicitadas
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="text-xs text-muted-foreground bg-card border border-border rounded-xl px-4 py-3 space-y-1">
        <p className="font-semibold text-foreground mb-1.5">Regras de pontuacao</p>
        <p className="flex items-center gap-2"><Video className="h-3 w-3 text-blue-500" /> Marcar presenca na conexao do dia: <strong>+1 ponto</strong> (ambos marcam: +2 cada)</p>
        <p className="flex items-center gap-2"><Gift className="h-3 w-3 text-purple-500" /> Indicacao completada: <strong>+1 ponto</strong></p>
        <p className="flex items-center gap-2"><Handshake className="h-3 w-3 text-green-500" /> Negocio aprovado: <strong>+5 pontos</strong></p>
        <p className="flex items-center gap-2"><Minus className="h-3 w-3 text-red-500" /> Solicitar conexao: <strong>-1 ponto</strong></p>
      </div>
    </div>
  )
}
