"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useCurrentUser } from "@/hooks/use-current-user"
import { getUserLevel } from "@/lib/constants"
import { companies } from "@/data/mock-companies"
import { initialDeals } from "@/data/mock-deals"
import type { Deal, DailyMatch } from "@/types"
import {
  Search, Calendar, Trophy, ArrowRight, Clock, CheckCircle2,
  DollarSign, Plus, Loader2, HeartHandshake as Handshake,
  TrendingUp, Gem, Info, Gift, X, Lock, Video,
} from "lucide-react"

import Certificate from "@/components/features/Certificate"
import LevelInfoModal from "@/components/features/LevelInfoModal"
import FirstLoginWelcome from "@/components/features/FirstLoginWelcome"
import DashboardTutorial from "@/components/features/DashboardTutorial"
import ReferralSystem from "@/components/features/ReferralSystem"

export default function DashboardPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user: currentUser } = useCurrentUser()

  const [dashboardSearch, setDashboardSearch] = useState("")
  const [showCertificate, setShowCertificate] = useState(false)
  const [certificateLevel, setCertificateLevel] = useState("")
  const [showLevelInfo, setShowLevelInfo] = useState(false)
  const [showReferralModal, setShowReferralModal] = useState(false)
  const [showTutorial, setShowTutorial] = useState(false)

  const [stats, setStats] = useState({ meetingsRealized: 0, score: 0 })
  const [dailyMatch, setDailyMatch] = useState<DailyMatch | null>(null)
  const [isConfirmingMatch, setIsConfirmingMatch] = useState(false)
  const [deals, setDeals] = useState<Deal[]>([])
  const [newDeal, setNewDeal] = useState({ companyName: "", value: "" })

  const currentLevel = getUserLevel(stats.meetingsRealized)

  useEffect(() => {
    if (!currentUser) return
    if (currentUser.status === "pending") return

    const savedScore = localStorage.getItem("user_score")
    const savedMeetings = localStorage.getItem("user_meetings")
    const meetingsCount = savedMeetings ? parseInt(savedMeetings) : 0

    setStats({
      meetingsRealized: meetingsCount,
      score: savedScore ? parseInt(savedScore) : 0,
    })

    const calculatedLevel = getUserLevel(meetingsCount).name
    const lastSeenLevel = localStorage.getItem("last_seen_certificate_level")
    const hasSeenOnboarding = localStorage.getItem("has_seen_onboarding")

    if (hasSeenOnboarding && calculatedLevel !== lastSeenLevel) {
      setCertificateLevel(calculatedLevel)
      setTimeout(() => setShowCertificate(true), 2000)
      localStorage.setItem("last_seen_certificate_level", calculatedLevel)
    } else if (!lastSeenLevel) {
      localStorage.setItem("last_seen_certificate_level", calculatedLevel)
    }

    // Daily match
    const today = new Date().toDateString()
    const storedMatch = JSON.parse(localStorage.getItem("daily_match_v2") || "null")

    if (storedMatch && storedMatch.date === today) {
      let matchData = storedMatch.match
      if (!matchData.phone) {
        const originalCompany = companies.find(c => c.id === matchData.id)
        if (originalCompany) {
          matchData.phone = originalCompany.contact.phone
          storedMatch.match = matchData
          localStorage.setItem("daily_match_v2", JSON.stringify(storedMatch))
        }
      }
      setDailyMatch(matchData)
    } else {
      const userSegment = currentUser.segment || "Tecnologia"
      const candidates = companies.filter(c => c.segment !== userSegment)
      const pool = candidates.length > 0 ? candidates : companies

      const randomCompany = pool[Math.floor(Math.random() * pool.length)]
      const newMatchObj: DailyMatch = {
        id: randomCompany.id,
        name: randomCompany.name,
        segment: randomCompany.segment,
        contact: randomCompany.contact.email.split("@")[0],
        phone: randomCompany.contact.phone,
        time: "15:00",
        status: "pending",
        image: randomCompany.image,
      }

      localStorage.setItem("daily_match_v2", JSON.stringify({ date: today, match: newMatchObj }))
      setDailyMatch(newMatchObj)
    }

    // Deals
    const storedDeals = JSON.parse(localStorage.getItem("closed_deals") || "null")
    if (storedDeals && storedDeals.length > 0) {
      setDeals(storedDeals)
    } else {
      setDeals(initialDeals)
    }
  }, [currentUser])

  const totalPlatformValue = deals.reduce((acc, curr) => acc + curr.value, 0)
  const userDeals = deals.filter(
    d => d.author === currentUser?.companyName || d.author === "Minha Empresa" || d.author === currentUser?.fullName
  )
  const userDealsCount = userDeals.length
  const userTotalValue = userDeals.reduce((acc, curr) => acc + curr.value, 0)

  const handleConfirmMeeting = () => {
    setIsConfirmingMatch(true)
    setTimeout(() => {
      if (!dailyMatch) return
      const updatedMatch = { ...dailyMatch, status: "completed" as const }
      setDailyMatch(updatedMatch)

      localStorage.setItem("daily_match_v2", JSON.stringify({ date: new Date().toDateString(), match: updatedMatch }))

      const newScore = stats.score + 10
      const newMeetings = stats.meetingsRealized + 1
      setStats({ score: newScore, meetingsRealized: newMeetings })
      localStorage.setItem("user_score", newScore.toString())
      localStorage.setItem("user_meetings", newMeetings.toString())

      const newLevel = getUserLevel(newMeetings).name
      const lastSeen = localStorage.getItem("last_seen_certificate_level")
      if (newLevel !== lastSeen) {
        setCertificateLevel(newLevel)
        setShowCertificate(true)
        localStorage.setItem("last_seen_certificate_level", newLevel)
      }

      setIsConfirmingMatch(false)
      toast({
        title: "Reunião Confirmada!",
        description: "Você e seu parceiro confirmaram a reunião. +10 pontos creditados!",
        className: "bg-green-600 text-white",
      })
    }, 2500)
  }

  const handleRegisterDeal = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDeal.companyName || !newDeal.value) return

    const deal: Deal = {
      id: Date.now(),
      companyName: newDeal.companyName,
      value: parseFloat(newDeal.value),
      date: new Date().toLocaleDateString(),
      author: currentUser?.companyName || "Minha Empresa",
    }

    const updatedDeals = [deal, ...deals]
    setDeals(updatedDeals)
    localStorage.setItem("closed_deals", JSON.stringify(updatedDeals))

    setNewDeal({ companyName: "", value: "" })
    toast({
      title: "Negócio Registrado!",
      description: "Parabéns pelo fechamento. O valor foi adicionado ao mural.",
      className: "bg-green-600 text-white",
    })
  }

  const handleDashboardSearch = () => {
    if (dashboardSearch.trim()) {
      router.push(`/search?q=${encodeURIComponent(dashboardSearch)}`)
    }
  }

  // Pending user view
  if (currentUser?.status === "pending") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="max-w-md w-full text-center space-y-6 bg-card p-8 rounded-3xl border border-border shadow-lg">
          <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto">
            <Lock className="h-10 w-10 text-amber-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold mb-2">Aprovação Pendente</h1>
            <p className="text-muted-foreground">
              Seu cadastro foi recebido com sucesso e está em análise pela nossa equipe administrativa.
            </p>
          </div>
          <div className="bg-secondary p-4 rounded-xl border border-border text-sm text-left">
            <p className="text-muted-foreground mb-2">Status atual:</p>
            <div className="flex items-center gap-2 text-amber-500 font-semibold">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              Aguardando Liberação
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Você receberá uma notificação assim que seu acesso for liberado.
          </p>
          <Button onClick={() => window.open("https://wa.me/5511950222063", "_blank")} variant="outline" className="w-full">
            Falar com Suporte
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
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-3xl font-bold">Olá, {currentUser?.fullName?.split(" ")[0] || "Empresário"}</h1>
            <div className="flex items-center gap-2">
              <div className={`px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${currentLevel.bg} ${currentLevel.color} ${currentLevel.border} shadow-sm backdrop-blur-md`}>
                <Gem className="w-3 h-3" />
                {currentLevel.name}
              </div>
              <button onClick={() => setShowLevelInfo(true)} className="text-muted-foreground hover:text-foreground transition-colors">
                <Info className="h-4 w-4" />
              </button>
            </div>
          </div>
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
                R$ {totalPlatformValue.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="w-full max-w-full mx-auto relative z-20">
        <div className="bg-card border border-border p-2 md:p-3 rounded-2xl flex gap-2 shadow-sm items-center focus-within:ring-2 focus-within:ring-primary/50 transition-all">
          <Search className="ml-3 h-5 w-5 text-muted-foreground shrink-0" />
          <Input
            type="text"
            placeholder="Busque por empresas, serviços ou conexões..."
            className="bg-transparent border-none placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 text-base h-10 w-full"
            value={dashboardSearch}
            onChange={e => setDashboardSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleDashboardSearch()}
          />
          <Button onClick={handleDashboardSearch} className="rounded-xl px-6">
            Buscar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="bg-card border border-border p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/10 rounded-lg"><Video className="h-5 w-5 text-blue-500" /></div>
            <p className="text-muted-foreground text-sm font-medium">Reuniões</p>
          </div>
          <p className="text-3xl font-bold">{stats.meetingsRealized}</p>
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="bg-card border border-border p-6 rounded-2xl shadow-sm cursor-pointer hover:border-purple-500/50 transition-colors" onClick={() => setShowLevelInfo(true)}>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/10 rounded-lg"><Trophy className="h-5 w-5 text-purple-500" /></div>
            <p className="text-muted-foreground text-sm font-medium">Pontuação</p>
          </div>
          <p className="text-3xl font-bold">{stats.score} <span className="text-sm font-normal text-muted-foreground">pts</span></p>
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group">
          <div className="flex items-center gap-3 mb-2 relative z-10">
            <div className="p-2 bg-green-500/10 rounded-lg"><Handshake className="h-5 w-5 text-green-500" /></div>
            <p className="text-muted-foreground text-sm font-medium">Meus Fechamentos</p>
          </div>
          <p className="text-3xl font-bold relative z-10">{userDealsCount}</p>
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-3 mb-2 relative z-10">
            <div className="p-2 bg-yellow-500/10 rounded-lg"><DollarSign className="h-5 w-5 text-yellow-500" /></div>
            <p className="text-muted-foreground text-sm font-medium">Valor Gerado</p>
          </div>
          <p className="text-2xl font-bold relative z-10 truncate">
            R$ {userTotalValue.toLocaleString("pt-BR", { notation: "compact", maximumFractionDigits: 1 } as Intl.NumberFormatOptions)}
          </p>
        </motion.div>
      </div>

      {/* Daily Match */}
      {dailyMatch && (
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="relative overflow-hidden bg-gradient-to-br from-blue-900/10 to-purple-900/10 border border-primary/20 rounded-3xl p-8 dark:from-blue-900/20 dark:to-purple-900/20">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold">Reunião do Dia</h2>
              </div>
              <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded border border-primary/20">
                Segmento: {dailyMatch.segment}
              </span>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-4 cursor-pointer" onClick={() => router.push(`/profile/${dailyMatch.id}`)}>
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Empresa Parceira</p>
                  <h3 className="text-2xl font-bold hover:text-primary transition-colors hover:underline decoration-primary underline-offset-4">
                    {dailyMatch.name}
                  </h3>
                </div>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 text-muted-foreground bg-background/50 px-3 py-1.5 rounded-lg border border-border">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>{dailyMatch.time}</span>
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
                    dailyMatch.status === "completed"
                      ? "bg-green-500/10 border-green-500/20 text-green-500"
                      : "bg-yellow-500/10 border-yellow-500/20 text-yellow-500"
                  }`}>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{dailyMatch.status === "completed" ? "Realizada" : "Pendente"}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 w-full md:w-auto min-w-[200px]">
                {dailyMatch.status !== "completed" ? (
                  <>
                    <Button className="bg-green-600 hover:bg-green-700 text-white font-semibold h-11 rounded-xl shadow-lg transition-all" onClick={() => router.push(`/profile/${dailyMatch.id}`)}>
                      Ver Perfil & Contato
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <Button onClick={handleConfirmMeeting} disabled={isConfirmingMatch} variant="outline" className="border-primary text-primary hover:bg-primary/10 font-semibold h-11 rounded-xl">
                      {isConfirmingMatch ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Validando...</>
                      ) : (
                        <>Confirmar Realização<CheckCircle2 className="ml-2 h-4 w-4" /></>
                      )}
                    </Button>
                  </>
                ) : (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
                    <p className="text-green-500 font-bold flex items-center justify-center gap-2">
                      <Handshake className="h-5 w-5" />
                      Reunião Confirmada
                    </p>
                    <p className="text-muted-foreground text-xs mt-1">+10 pontos creditados</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Deals Wall & Register */}
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="h-5 w-5 text-green-500" />
            <h2 className="text-lg font-bold">Registrar Negócio</h2>
          </div>
          <p className="text-muted-foreground text-sm mb-6">Fechou negócio através da plataforma? Registre aqui e inspire outros.</p>

          <form onSubmit={handleRegisterDeal} className="space-y-4">
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

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
            {deals.map(deal => (
              <div key={deal.id} className="flex items-center justify-between bg-secondary/30 border border-border p-4 rounded-xl hover:bg-secondary/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center">
                    <Handshake className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{deal.companyName}</p>
                    <p className="text-muted-foreground text-xs">Realizado por: <span className="text-foreground/80">{deal.author}</span></p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-green-500 font-bold text-sm">
                    R$ {deal.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-muted-foreground text-[10px]">{deal.date}</p>
                </div>
              </div>
            ))}

            {deals.length === 0 && (
              <div className="text-center py-10 text-muted-foreground">
                <p>Nenhum negócio registrado ainda. Seja o primeiro!</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Feature Modals */}
      <FirstLoginWelcome userName={currentUser?.fullName?.split(" ")[0] || "Empresário"} onClose={() => setShowTutorial(true)} />
      <DashboardTutorial isOpen={showTutorial} onClose={() => setShowTutorial(false)} />
      <Certificate isOpen={showCertificate} onClose={() => setShowCertificate(false)} userName={currentUser?.fullName || "Empresário"} level={certificateLevel} date={new Date().toLocaleDateString()} />
      <LevelInfoModal isOpen={showLevelInfo} onClose={() => setShowLevelInfo(false)} />

      <AnimatePresence>
        {showReferralModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-card border border-border rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative">
              <button onClick={() => setShowReferralModal(false)} className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors z-10">
                <X className="h-5 w-5" />
              </button>
              <div className="p-8">
                <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                  <Gift className="h-6 w-6 text-purple-400" />
                  Programa de Indicação
                </h2>
                <p className="text-muted-foreground mb-6">Convide amigos e turbine sua pontuação no ranking.</p>
                <ReferralSystem />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
