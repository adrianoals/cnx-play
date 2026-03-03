"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useCurrentUser } from "@/hooks/use-current-user"
import { createReferral, fetchMyReferrals } from "@/services/referral.service"
import type { SupabaseReferral } from "@/types"
import {
  Gift, Send, Loader2, UserPlus, Trophy,
  Video, Handshake, Clock, CheckCircle2, XCircle,
} from "lucide-react"

function getReferralStatusBadge(status: string) {
  switch (status) {
    case "completed":
      return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/20"><CheckCircle2 className="w-3 h-3 mr-1" />Aprovado</Badge>
    case "rejected":
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/20"><XCircle className="w-3 h-3 mr-1" />Rejeitado</Badge>
    default:
      return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/20"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>
  }
}

export default function ReferralPage() {
  const { toast } = useToast()
  const { user } = useCurrentUser()

  const [form, setForm] = useState({ name: "", email: "", phone: "" })
  const [submitting, setSubmitting] = useState(false)
  const [referrals, setReferrals] = useState<SupabaseReferral[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMyReferrals()
      .then(setReferrals)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.phone) {
      toast({ title: "Preencha todos os campos", variant: "destructive" })
      return
    }

    setSubmitting(true)
    try {
      const newRef = await createReferral({
        referredName: form.name,
        referredEmail: form.email,
        referredPhone: form.phone,
      })
      setReferrals(prev => [newRef, ...prev])
      setForm({ name: "", email: "", phone: "" })
      toast({
        title: "Indicação enviada!",
        description: "Sua indicação foi registrada com sucesso.",
        className: "bg-green-600 text-white border-none",
      })
    } catch (err) {
      toast({
        title: "Erro ao enviar indicação",
        description: err instanceof Error ? err.message : "Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (user?.status === "pending") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-muted-foreground">Aguarde a aprovação do seu cadastro para usar indicações.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Gift className="h-8 w-8 text-purple-500" />
          Indique e Ganhe
        </h1>
        <p className="text-muted-foreground mt-1">
          Convide empresários para a plataforma e acumule pontos no ranking.
        </p>
      </div>

      {/* How it works */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-gradient-to-br from-purple-900/10 to-pink-900/10 border border-purple-500/20 rounded-2xl p-6"
      >
        <h2 className="text-lg font-bold mb-4">Como funciona a pontuação</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 bg-background/50 rounded-xl p-4 border border-border">
            <div className="p-2 bg-blue-500/10 rounded-lg shrink-0">
              <Video className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="font-semibold text-sm">+1 ponto</p>
              <p className="text-xs text-muted-foreground">Por reunião realizada</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-background/50 rounded-xl p-4 border border-border">
            <div className="p-2 bg-purple-500/10 rounded-lg shrink-0">
              <UserPlus className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="font-semibold text-sm">+1 ponto</p>
              <p className="text-xs text-muted-foreground">Por indicação aprovada</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-background/50 rounded-xl p-4 border border-border">
            <div className="p-2 bg-green-500/10 rounded-lg shrink-0">
              <Handshake className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="font-semibold text-sm">+5 pontos</p>
              <p className="text-xs text-muted-foreground">Por negócio fechado</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Form + List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Referral Form */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-2xl p-6 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-4">
            <Send className="h-5 w-5 text-purple-500" />
            <h2 className="text-lg font-bold">Nova Indicação</h2>
          </div>
          <p className="text-muted-foreground text-sm mb-6">
            Preencha os dados do empresário que deseja indicar.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground ml-1 mb-1 block">Nome Completo *</label>
              <Input
                placeholder="Ex: João Silva"
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground ml-1 mb-1 block">Email *</label>
              <Input
                type="email"
                placeholder="joao@empresa.com"
                required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground ml-1 mb-1 block">Telefone *</label>
              <Input
                placeholder="(00) 00000-0000"
                required
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-xl mt-2"
            >
              {submitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando...</>
              ) : (
                <><Gift className="mr-2 h-4 w-4" />Enviar Indicação</>
              )}
            </Button>
          </form>
        </motion.div>

        {/* My Referrals List */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-2xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <h2 className="text-lg font-bold">Minhas Indicações</h2>
            </div>
            <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded border border-border">
              {referrals.length} indicação(ões)
            </span>
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : referrals.length > 0 ? (
              referrals.map(ref => (
                <div
                  key={ref.id}
                  className="flex items-center justify-between bg-secondary/30 border border-border p-4 rounded-xl"
                >
                  <div>
                    <p className="font-medium text-sm">{ref.referredName}</p>
                    <p className="text-xs text-muted-foreground">{ref.referredEmail}</p>
                    {ref.referredPhone && (
                      <p className="text-xs text-muted-foreground">{ref.referredPhone}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {getReferralStatusBadge(ref.status)}
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(ref.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                <UserPlus className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhuma indicação ainda.</p>
                <p className="text-xs">Comece indicando empresários!</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
