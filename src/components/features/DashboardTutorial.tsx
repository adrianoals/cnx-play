"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { X, ChevronRight, ChevronLeft, LayoutDashboard, HeartHandshake as Handshake, Trophy, Gem, Menu } from "lucide-react"

const steps = [
  { title: "O Hub Principal", description: "Aqui no Dashboard você tem uma visão geral de suas métricas, reuniões e o valor total gerado pela comunidade.", icon: LayoutDashboard, color: "bg-blue-500" },
  { title: "Reunião Diária", description: "Todo dia selecionamos um parceiro ideal para você. Confirme a reunião no card 'Reunião do Dia' para ganhar pontos.", icon: Handshake, color: "bg-green-500" },
  { title: "Mural de Negócios", description: "Fechou contrato? Registre no Mural de Conquistas. Aumenta sua visibilidade.", icon: Trophy, color: "bg-yellow-500" },
  { title: "Níveis e Pontos", description: "Interaja e suba de nível (Platina, Safira, Diamante). Pontos desbloqueiam benefícios.", icon: Gem, color: "bg-purple-500" },
  { title: "Navegação Completa", description: "Use o menu lateral para buscar empresas, gerenciar conta ou acessar suporte.", icon: Menu, color: "bg-slate-500" },
]

export default function DashboardTutorial({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [step, setStep] = useState(0)
  if (!isOpen) return null
  const current = steps[step]

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <motion.div key={step} initial={{ scale: 0.95, opacity: 0, x: 20 }} animate={{ scale: 1, opacity: 1, x: 0 }} exit={{ scale: 0.95, opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
          <div className={`h-32 ${current.color} relative flex items-center justify-center`}>
            <div className="absolute inset-0 bg-black/20" />
            <div className="relative z-10 p-4 rounded-full bg-white/20 backdrop-blur-md shadow-lg"><current.icon className="h-10 w-10 text-white" /></div>
            <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white hover:bg-white/20 p-1 rounded-full transition-colors"><X className="h-5 w-5" /></button>
          </div>
          <div className="p-6 md:p-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">Passo {step + 1} de {steps.length}</span>
              <div className="flex gap-1">{steps.map((_, i) => <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? `w-6 ${current.color}` : "w-1.5 bg-slate-800"}`} />)}</div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">{current.title}</h3>
            <p className="text-slate-400 text-lg leading-relaxed mb-8 min-h-[80px]">{current.description}</p>
            <div className="flex items-center justify-between gap-4">
              <Button variant="ghost" onClick={() => setStep(s => s - 1)} disabled={step === 0} className={`text-slate-400 hover:text-white ${step === 0 ? "invisible" : ""}`}><ChevronLeft className="mr-2 h-4 w-4" />Anterior</Button>
              <Button onClick={() => step === steps.length - 1 ? onClose() : setStep(s => s + 1)} className="bg-white text-slate-950 hover:bg-slate-200 font-bold px-6">
                {step === steps.length - 1 ? "Concluir" : "Próximo"}{step !== steps.length - 1 && <ChevronRight className="ml-2 h-4 w-4" />}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
