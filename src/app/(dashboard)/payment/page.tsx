"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Check, Shield, Lock, Crown, Tag } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PlanCardProps {
  type: string
  title: string
  price: string
  period?: string
  total?: string
  features: string[]
  recommended?: boolean
  highlight?: boolean
  subtitle?: string
  promoBadge?: string
  isSelected: boolean
  onSelect: () => void
}

function PlanCard({ type, title, price, period, total, features, recommended, highlight, subtitle, promoBadge, isSelected, onSelect }: PlanCardProps) {
  return (
    <div
      onClick={onSelect}
      className={`relative cursor-pointer transition-all duration-300 rounded-3xl p-6 border-2 flex flex-col h-full ${
        isSelected
          ? "bg-card/90 border-blue-500 shadow-2xl shadow-blue-500/20 scale-[1.03] z-10"
          : "bg-card/40 border-border hover:border-muted-foreground/30 hover:bg-card/60 opacity-80 hover:opacity-100 scale-100"
      } ${highlight ? "border-amber-500/50 bg-gradient-to-b from-card via-card to-amber-950/20" : ""}`}
    >
      {recommended && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg whitespace-nowrap">
          MAIS POPULAR
        </div>
      )}
      {highlight && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg whitespace-nowrap flex items-center gap-1 animate-pulse">
          <Crown className="w-3 h-3" /> CAMPANHA EXCLUSIVA
        </div>
      )}

      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className={`text-lg font-semibold ${isSelected || highlight ? "text-foreground" : "text-muted-foreground"}`}>
            {title}
          </h3>
          {subtitle && (
            <span className="text-xs text-amber-400 font-bold block mt-1 bg-amber-500/10 px-2 py-1 rounded w-fit border border-amber-500/20">
              {subtitle}
            </span>
          )}
          {type === "annual" && !subtitle && (
            <span className="text-xs text-green-400 font-medium">Economize 30%</span>
          )}
        </div>
        <div
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
            isSelected ? "border-blue-500 bg-blue-500" : "border-muted-foreground/30"
          }`}
        >
          {isSelected && <Check className="h-4 w-4 text-white" />}
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-end gap-1">
          <span className="text-sm text-muted-foreground mb-1">R$</span>
          <span className="text-4xl font-bold text-foreground">{price}</span>
          {period && <span className="text-sm text-muted-foreground mb-1">/{period}</span>}
        </div>
        {total && <p className="text-xs text-muted-foreground mt-1">{total}</p>}
      </div>

      <ul className="space-y-3 mb-6 flex-1">
        {features.map((feature, idx) => (
          <li key={idx} className="flex items-start gap-3 text-sm text-muted-foreground">
            <Check className={`h-4 w-4 mt-0.5 flex-shrink-0 ${highlight ? "text-amber-400" : "text-blue-400"}`} />
            <span dangerouslySetInnerHTML={{ __html: feature }} />
          </li>
        ))}
      </ul>

      {promoBadge && (
        <div className="mt-auto pt-4 border-t border-border">
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-green-400 bg-green-500/10 py-2 rounded-lg border border-green-500/20">
            <Tag className="w-3 h-3" />
            {promoBadge}
          </div>
        </div>
      )}
    </div>
  )
}

const PLAN_LABELS: Record<string, string> = {
  monthly: "Mensal",
  visionary: "Start 2026 (Promo)",
}

const PLAN_PRICES: Record<string, string> = {
  monthly: "R$ 59,99",
  visionary: "R$ 365,00",
}

export default function PaymentPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [selectedPlan, setSelectedPlan] = useState("visionary")
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("current_user") || "{}")

    // Active user: redirect to dashboard
    if (user.status === "active") {
      router.replace("/dashboard")
      return
    }

    setReady(true)
  }, [router])

  const handlePayment = () => {
    setLoading(true)
    let paymentLink = ""

    if (selectedPlan === "visionary") {
      paymentLink = "https://invoice.infinitepay.io/plans/lucas-da-silva-recchia/6ulzdCoO1L"
    } else {
      paymentLink = "https://invoice.infinitepay.io/plans/lucas-da-silva-recchia/rZ6TVJIR3"
    }

    setTimeout(() => {
      setLoading(false)
      window.open(paymentLink, "_blank")

      toast({
        title: "Link de pagamento aberto!",
        description: "Complete o pagamento na nova aba. Após a confirmação, nossa equipe vai liberar seu acesso.",
        duration: 8000,
      })
    }, 1500)
  }

  if (!ready) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Pagamento</h1>
        <p className="text-muted-foreground">Escolha seu plano e ative seu acesso à plataforma.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch max-w-4xl mx-auto">
        <PlanCard
          type="monthly"
          title="Plano Mensal"
          price="59,99"
          period="mês"
          features={[
            "Acesso ao perfil diário de empresários",
            "Suporte exclusivo prioritário",
            "Acesso à comunidade básica",
          ]}
          isSelected={selectedPlan === "monthly"}
          onSelect={() => setSelectedPlan("monthly")}
        />

        <PlanCard
          type="visionary"
          title="Start 2026"
          price="365,00"
          total="Pagamento único"
          subtitle="Nova Conexão por R$ 1,00"
          highlight
          promoBadge="Melhor Custo-Benefício"
          features={[
            "<strong>365 novas conexões</strong> (1/dia)",
            "Acesso liberado por 365 dias",
            "Mentoria gravada exclusiva",
            "Grupo de Networking VIP",
            "Apenas R$ 1,00 por conexão",
          ]}
          isSelected={selectedPlan === "visionary"}
          onSelect={() => setSelectedPlan("visionary")}
        />
      </div>

      <div className="max-w-md mx-auto space-y-6">
        <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-border">
            <span className="text-muted-foreground">Plano Selecionado</span>
            <span className="text-foreground font-medium">
              {PLAN_LABELS[selectedPlan]}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-foreground">Total a pagar</span>
            <span className={`text-2xl font-bold ${selectedPlan === "visionary" ? "text-amber-400" : "text-blue-400"}`}>
              {PLAN_PRICES[selectedPlan]}
            </span>
          </div>
        </div>

        <Button
          onClick={handlePayment}
          disabled={loading}
          className={`w-full h-14 text-lg font-bold rounded-xl shadow-lg transition-all duration-300 ${
            selectedPlan === "visionary"
              ? "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-orange-900/20 text-white"
              : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-blue-900/20 text-white"
          }`}
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processando...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Confirmar Assinatura
            </div>
          )}
        </Button>

        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Lock className="h-3 w-3" />
          Pagamento 100% seguro e criptografado
        </div>
      </div>
    </div>
  )
}
