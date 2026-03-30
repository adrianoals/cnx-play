"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useCurrentUser } from "@/hooks/use-current-user"
import type { UserStats, PlatformTotals, LeaderboardRow, SupabaseDeal, TodayConnection } from "@/types"
import {
  registerDeal,
  fetchDashboardBundle,
} from "@/services/dashboard.service"
import {
  Search, Trophy, ArrowRight, Clock,
  DollarSign, Plus, Loader2, HeartHandshake as Handshake,
  TrendingUp, Video, AlertTriangle,
  UserCircle, Crown, CheckCircle2, Link2, Phone, Building2 as Building2Icon, Tag,
} from "lucide-react"

import dynamic from "next/dynamic"
import useSWR from "swr"

const FirstLoginWelcome = dynamic(() => import("@/components/features/FirstLoginWelcome"), { ssr: false })
const DashboardTutorial = dynamic(() => import("@/components/features/DashboardTutorial"), { ssr: false })
import { fetchMyCompanies } from "@/services/company.service"
import { fetchTodayConnection, markPresence } from "@/services/daily-match.service"
import type { AdminCompany } from "@/types"

export default function DashboardPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user: currentUser } = useCurrentUser()

  const [showTutorial, setShowTutorial] = useState(false)

  const [paymentStatus] = useState("active")
  const [newDeal, setNewDeal] = useState({ companyName: "", value: "", authorCompanyId: "" })

  const isActive = currentUser && currentUser.status !== "pending"

  const { data: myCompanies = [] } = useSWR<AdminCompany[]>(
    isActive ? "my-companies" : null,
    fetchMyCompanies,
  )

  const { data: dashData, isLoading: loadingData, mutate } = useSWR(
    isActive ? "dashboard-data" : null,
    fetchDashboardBundle,
  )

  const stats: UserStats | null = dashData?.myStats ?? null
  const platformTotals: PlatformTotals | null = dashData?.totals ?? null
  const leaderboard: LeaderboardRow[] = dashData?.board ?? []
  const deals: SupabaseDeal[] = dashData?.recentDeals ?? []
  const currentScore = stats?.score ?? 0

  // Conexão do dia (v2)
  const [todayConn, setTodayConn] = useState<TodayConnection | null>(null)
  const [connLoading, setConnLoading] = useState(true)
  const [marking, setMarking] = useState(false)

  const loadTodayConn = useCallback(async () => {
    try {
      setConnLoading(true)
      const data = await fetchTodayConnection()
      setTodayConn(data)
    } catch {
      // silent
    } finally {
      setConnLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isActive) loadTodayConn()
  }, [isActive, loadTodayConn])

  const handleMarkPresence = async () => {
    if (!todayConn) return
    try {
      setMarking(true)
      await markPresence(todayConn.matchId)
      setTodayConn(prev => prev ? { ...prev, status: "completed" } : null)
      toast({ title: "Presenca marcada!", className: "bg-green-600 text-white" })
      mutate()
    } catch {
      toast({ title: "Erro ao marcar presenca", variant: "destructive" })
    } finally {
      setMarking(false)
    }
  }

  const handleRegisterDeal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDeal.companyName || !newDeal.value) return

    try {
      await registerDeal({
        companyName: newDeal.companyName,
        value: parseFloat(newDeal.value),
        authorCompanyId: newDeal.authorCompanyId || undefined,
      })
      setNewDeal({ companyName: "", value: "", authorCompanyId: "" })
      toast({
        title: "Negócio enviado para validação",
        description: "Seu negócio foi enviado e está pendente de validação pelo administrador.",
        className: "bg-blue-600 text-white",
      })
      // Reload stats
      mutate()
    } catch (err) {
      toast({
        title: "Erro ao registrar negócio",
        description: err instanceof Error ? err.message : "Tente novamente.",
        variant: "destructive",
      })
    }
  }


  // Pending user view
  if (currentUser?.status === "pending") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="max-w-md w-full text-center space-y-6 bg-card p-8 rounded-3xl border border-border shadow-lg">
          <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto">
            <Clock className="h-10 w-10 text-amber-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold mb-2">Aprovação Pendente</h1>
            <p className="text-muted-foreground">
              Seu cadastro foi recebido. Para liberar o acesso, escolha um plano e efetue o pagamento. Após a confirmação, nossa equipe ativará sua conta.
            </p>
          </div>
          <div className="bg-secondary p-4 rounded-xl border border-border text-sm text-left">
            <p className="text-muted-foreground mb-2">Status atual:</p>
            <div className="flex items-center gap-2 text-amber-500 font-semibold">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              Aguardando Pagamento e Ativação
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <Button onClick={() => router.push("/payment")} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              Escolher Plano e Pagar
            </Button>
            <Button onClick={() => window.open("https://wa.me/5511950222063", "_blank")} variant="outline" className="w-full">
              Falar com Suporte
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Já pagou? Fale com o suporte para agilizar a ativação.
          </p>
        </div>
      </div>
    )
  }

  // Payment inactive view
  if (paymentStatus !== "active") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="max-w-md w-full text-center space-y-6 bg-card p-8 rounded-3xl border border-border shadow-lg">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="h-10 w-10 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold mb-2">Pagamento Pendente</h1>
            <p className="text-muted-foreground">
              Sua assinatura não está ativa. Para continuar acessando a plataforma, regularize seu pagamento.
            </p>
          </div>
          <Button onClick={() => router.push("/payment")} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            Regularizar Agora
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Olá, {currentUser?.fullName?.split(" ")[0] || "Empresário"}</h1>
          <p className="text-muted-foreground">Bem-vindo ao seu hub de conexões estratégicas.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-card border border-border p-4 rounded-2xl hidden md:flex items-center gap-4 shadow-sm w-full md:w-auto">
            <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Total na Plataforma</p>
              <p className="text-2xl font-bold">
                R$ {(platformTotals?.totalDealValue ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Complete Profile Banner — só para quem não tem empresa */}
      {currentUser && myCompanies.length === 0 && (
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-xl shrink-0">
              <UserCircle className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="font-semibold text-sm">Complete seu perfil</p>
              <p className="text-muted-foreground text-xs">
                Preencha os dados da sua empresa para aparecer nas buscas e receber conexões.
              </p>
            </div>
          </div>
          <Button
            onClick={() => router.push("/account")}
            size="sm"
            className="bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl shrink-0"
          >
            Completar Perfil
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </motion.div>
      )}

      {/* Search Banner */}
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/30 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-xl shrink-0">
            <Search className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <p className="font-semibold text-sm">Encontre novos parceiros</p>
            <p className="text-muted-foreground text-xs">
              Explore empresas de diferentes segmentos e envie solicitações de conexão.
            </p>
          </div>
        </div>
        <Button
          onClick={() => router.push("/search")}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shrink-0"
        >
          Pesquisar Empresas
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </motion.div>

      {/* Conexão do Dia (v2) */}
      {!connLoading && (
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.05 }}>
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Link2 className="h-5 w-5 text-blue-500" />
                <h2 className="text-lg font-bold">Conexao do Dia</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/agenda")}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Ver detalhes
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>

            {todayConn ? (
              <div className={`p-4 rounded-xl border transition-colors ${
                todayConn.status === "completed"
                  ? "bg-green-500/5 border-green-500/20"
                  : "bg-secondary/30 border-border"
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-secondary border border-border shrink-0">
                      {todayConn.partnerAvatar ? (
                        <img src={todayConn.partnerAvatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <UserCircle className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{todayConn.partnerName}</p>
                      {todayConn.partnerCompany && (
                        <p className="text-muted-foreground text-xs flex items-center gap-1">
                          <Building2Icon className="h-3 w-3" />
                          {todayConn.partnerCompany}
                        </p>
                      )}
                      {todayConn.partnerCategory && (
                        <p className="text-muted-foreground text-xs flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          {todayConn.partnerCategory}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {todayConn.partnerPhone && (
                      <a
                        href={`https://wa.me/${todayConn.partnerPhone.replace(/\D/g, "").replace(/^(?!55)/, "55")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-lg hover:bg-green-500/20 transition-colors"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        WhatsApp
                      </a>
                    )}

                    {todayConn.status === "completed" ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-lg">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Presenca marcada
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        onClick={handleMarkPresence}
                        disabled={marking}
                        className="text-xs h-8 rounded-lg bg-green-600 hover:bg-green-700 text-white"
                      >
                        {marking ? (
                          <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        )}
                        Marcar Presenca
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground text-sm">
                  Nenhuma conexao para hoje. O administrador realizara o sorteio em breve.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="bg-card border border-border p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/10 rounded-lg"><Video className="h-5 w-5 text-blue-500" /></div>
            <p className="text-muted-foreground text-sm font-medium">Reuniões</p>
          </div>
          <p className="text-3xl font-bold">{stats?.meetingsCompleted ?? 0}</p>
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="bg-card border border-border p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/10 rounded-lg"><Trophy className="h-5 w-5 text-purple-500" /></div>
            <p className="text-muted-foreground text-sm font-medium">Pontuação</p>
          </div>
          <p className="text-3xl font-bold">{currentScore} <span className="text-sm font-normal text-muted-foreground">pts</span></p>
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group">
          <div className="flex items-center gap-3 mb-2 relative z-10">
            <div className="p-2 bg-green-500/10 rounded-lg"><Handshake className="h-5 w-5 text-green-500" /></div>
            <p className="text-muted-foreground text-sm font-medium">Meus Fechamentos</p>
          </div>
          <p className="text-3xl font-bold relative z-10">{stats?.dealCount ?? 0}</p>
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-3 mb-2 relative z-10">
            <div className="p-2 bg-yellow-500/10 rounded-lg"><DollarSign className="h-5 w-5 text-yellow-500" /></div>
            <p className="text-muted-foreground text-sm font-medium">Valor Gerado</p>
          </div>
          <p className="text-2xl font-bold relative z-10 truncate">
            R$ {(stats?.totalDealValue ?? 0).toLocaleString("pt-BR", { notation: "compact", maximumFractionDigits: 1 } as Intl.NumberFormatOptions)}
          </p>
        </motion.div>
      </div>

      {/* Deals Wall & Register */}
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="h-5 w-5 text-green-500" />
            <h2 className="text-lg font-bold">Registrar Negócio</h2>
          </div>
          <p className="text-muted-foreground text-sm mb-6">Fechou negócio através da plataforma? Registre aqui e inspire outros.</p>

          <form onSubmit={handleRegisterDeal} className="space-y-4">
            {myCompanies.length > 0 && (
              <div>
                <label className="text-xs text-muted-foreground ml-1 mb-1 block">Sua Empresa</label>
                <select
                  required
                  value={newDeal.authorCompanyId}
                  onChange={e => setNewDeal({ ...newDeal, authorCompanyId: e.target.value })}
                  className="w-full bg-secondary/50 border border-input rounded-xl px-4 py-2.5 text-foreground text-sm focus:border-primary focus:outline-none"
                >
                  <option value="">Selecione sua empresa</option>
                  {myCompanies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="text-xs text-muted-foreground ml-1 mb-1 block">Nome da Empresa Parceira</label>
              <input
                type="text"
                placeholder="Ex: Tech Solutions"
                required
                value={newDeal.companyName}
                onChange={e => setNewDeal({ ...newDeal, companyName: e.target.value })}
                className="w-full bg-secondary/50 border border-input rounded-xl px-4 py-2.5 text-foreground text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground ml-1 mb-1 block">Valor do Contrato (R$)</label>
              <input
                type="number"
                placeholder="0,00"
                required
                value={newDeal.value}
                onChange={e => setNewDeal({ ...newDeal, value: e.target.value })}
                className="w-full bg-secondary/50 border border-input rounded-xl px-4 py-2.5 text-foreground text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl mt-2">
              <Plus className="h-4 w-4 mr-2" />
              Registrar Conquista
            </Button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <h2 className="text-lg font-bold">Mural de Conquistas</h2>
            </div>
            <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded border border-border">
              Últimos Fechamentos
            </span>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {deals.map(deal => (
              <div key={deal.id} className="flex items-center justify-between bg-secondary/30 border border-border p-4 rounded-xl hover:bg-secondary/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center">
                    <Handshake className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{deal.companyName}</p>
                    <p className="text-muted-foreground text-xs">Por: <span className="text-foreground/80">{deal.authorCompanyName || deal.authorName || "—"}</span></p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-green-500 font-bold text-sm">
                    R$ {deal.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-muted-foreground text-[10px]">{deal.dealDate ? new Date(deal.dealDate).toLocaleDateString("pt-BR") : ""}</p>
                </div>
              </div>
            ))}

            {deals.length === 0 && !loadingData && (
              <div className="text-center py-10 text-muted-foreground">
                <p>Nenhum negócio registrado ainda. Seja o primeiro!</p>
              </div>
            )}

            {loadingData && (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Leaderboard */}
      {leaderboard.length > 0 && (
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7 }} className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Crown className="h-5 w-5 text-yellow-500" />
            <h2 className="text-lg font-bold">Ranking</h2>
          </div>
          <div className="space-y-2">
            {leaderboard.map((entry, i) => (
              <div key={entry.userId} className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                entry.userId === currentUser?.id
                  ? "bg-primary/5 border-primary/30"
                  : "bg-secondary/20 border-border hover:bg-secondary/40"
              }`}>
                <div className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    i === 0 ? "bg-yellow-500/20 text-yellow-500" :
                    i === 1 ? "bg-gray-400/20 text-gray-400" :
                    i === 2 ? "bg-amber-700/20 text-amber-600" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {entry.rankPosition}
                  </span>
                  <div>
                    <p className="font-medium text-sm">
                      {entry.fullName}
                      {entry.userId === currentUser?.id && <span className="text-primary text-xs ml-1">(você)</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">{entry.companyName || "—"}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm">{entry.score} pts</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Feature Modals */}
      <FirstLoginWelcome userName={currentUser?.fullName?.split(" ")[0] || "Empresário"} onClose={() => setShowTutorial(true)} />
      <DashboardTutorial isOpen={showTutorial} onClose={() => setShowTutorial(false)} />
    </div>
  )
}
