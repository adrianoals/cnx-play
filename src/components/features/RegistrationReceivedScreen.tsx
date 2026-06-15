"use client"

import { motion } from "framer-motion"
import { CheckCircle2, MessageCircle } from "lucide-react"

export default function RegistrationReceivedScreen() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full bg-card p-8 rounded-3xl border border-border shadow-lg space-y-6"
      >
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold mb-2">Cadastro recebido!</h1>
            <p className="text-muted-foreground">Seu perfil está em análise.</p>
          </div>
        </div>

        <div className="bg-secondary/30 border border-border rounded-xl p-4 text-sm text-muted-foreground leading-relaxed">
          As ativações da <strong className="text-foreground">Company Conexão Play</strong> são limitadas para manter a qualidade das conexões e oportunidades geradas dentro da plataforma.
          <br /><br />
          Caso seja aprovado, nossa equipe entrará em contato para finalizar sua entrada.
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">Investimento</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-secondary/30 border border-border rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Mensal</p>
              <p className="text-xl font-bold">R$ 197<span className="text-sm text-muted-foreground font-normal">/mês</span></p>
            </div>
            <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl p-4 text-center">
              <p className="text-xs text-blue-400 font-semibold mb-1">Anual</p>
              <p className="text-xl font-bold">R$ 997<span className="text-sm text-muted-foreground font-normal">/ano</span></p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground bg-green-500/5 border border-green-500/20 rounded-xl p-3">
          <MessageCircle className="h-4 w-4 text-green-500 shrink-0" />
          <span>Fique atento ao seu WhatsApp.</span>
        </div>
      </motion.div>
    </div>
  )
}
