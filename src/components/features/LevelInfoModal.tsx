"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Trophy, Shield, Gem, Star, Info } from "lucide-react"
import { Button } from "@/components/ui/button"

const levels = [
  { name: "Platina", range: "0 - 49 reuniões", icon: Shield, color: "text-slate-300", bg: "bg-slate-500/10", desc: "O início da jornada. Acesso básico a reuniões e networking." },
  { name: "Safira", range: "50 - 150 reuniões", icon: Star, color: "text-blue-400", bg: "bg-blue-500/10", desc: "Networker experiente. Prioridade em matches e suporte dedicado." },
  { name: "Diamante", range: "151+ reuniões", icon: Gem, color: "text-cyan-400", bg: "bg-cyan-500/10", desc: "Elite empresarial. Acesso a eventos exclusivos e mentoria premium." },
]

export default function LevelInfoModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-950 border-slate-800 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2"><Trophy className="h-6 w-6 text-yellow-500" />Sistema de Níveis e Pontuação</DialogTitle>
          <DialogDescription className="text-slate-400">Entenda como crescer na plataforma.</DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
            <h3 className="font-semibold text-white mb-2 flex items-center gap-2"><Info className="h-4 w-4 text-blue-400" />Como ganhar pontos?</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-green-500 rounded-full" />Confirmar reunião: <strong className="text-white">+10 pontos</strong></li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-green-500 rounded-full" />Indicar amigo que fechou negócio: <strong className="text-white">Bônus em R$</strong></li>
            </ul>
          </div>
          <div className="grid gap-4">
            {levels.map((level, idx) => (
              <div key={idx} className={`flex items-start gap-4 p-4 rounded-xl border border-slate-800 ${level.bg}`}>
                <div className={`p-3 rounded-lg bg-slate-950 border border-slate-800 ${level.color}`}><level.icon className="h-6 w-6" /></div>
                <div><h4 className={`text-lg font-bold ${level.color}`}>{level.name}</h4><p className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">{level.range}</p><p className="text-sm text-slate-300">{level.desc}</p></div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end"><Button onClick={onClose} className="bg-blue-600 hover:bg-blue-700 text-white">Entendi</Button></div>
      </DialogContent>
    </Dialog>
  )
}