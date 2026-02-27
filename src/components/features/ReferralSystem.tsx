"use client"

import { useState } from "react"
import { Copy, Check, Users, Trophy, Video } from "lucide-react"
import { Button } from "@/components/ui/button"
import { referralsData } from "@/data/mock-deals"

export default function ReferralSystem() {
  const [copied, setCopied] = useState(false)
  const referralCode = "LUCAS8829"
  const handleCopy = () => { navigator.clipboard.writeText(referralCode); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  const totalPoints = referralsData.reduce((a, c) => a + (c.points || 0), 0)
  const totalMeetings = referralsData.reduce((a, c) => a + (c.meetings || 0), 0)

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-900/40 to-slate-900 border border-blue-500/20 p-5 rounded-xl">
          <div className="flex items-center gap-3 mb-2"><div className="p-2 bg-blue-500/10 rounded-lg"><Users className="h-5 w-5 text-blue-400" /></div><p className="text-sm text-slate-400 font-medium">Indicados</p></div>
          <p className="text-2xl font-bold text-white">3 <span className="text-xs font-normal text-slate-500">amigos</span></p>
        </div>
        <div className="bg-gradient-to-br from-purple-900/40 to-slate-900 border border-purple-500/20 p-5 rounded-xl">
          <div className="flex items-center gap-3 mb-2"><div className="p-2 bg-purple-500/10 rounded-lg"><Trophy className="h-5 w-5 text-purple-400" /></div><p className="text-sm text-slate-400 font-medium">Pontos Ganhos</p></div>
          <p className="text-2xl font-bold text-white">{totalPoints} <span className="text-xs font-normal text-slate-500">pts</span></p>
        </div>
        <div className="bg-gradient-to-br from-green-900/40 to-slate-900 border border-green-500/20 p-5 rounded-xl">
          <div className="flex items-center gap-3 mb-2"><div className="p-2 bg-green-500/10 rounded-lg"><Video className="h-5 w-5 text-green-400" /></div><p className="text-sm text-slate-400 font-medium">Reuniões Extras</p></div>
          <p className="text-2xl font-bold text-white">+{totalMeetings}</p>
        </div>
      </div>
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 text-center">
        <h3 className="text-lg font-bold text-white mb-2">Compartilhe e Ganhe Pontos</h3>
        <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">Convide empresários. Ganhe <span className="text-blue-400 font-bold">50 pontos + 1 Reunião Extra</span> quando fecham negócio.</p>
        <div className="flex items-center max-w-sm mx-auto bg-slate-950 border border-slate-700 rounded-lg p-1.5 pl-4">
          <code className="flex-1 text-left text-lg font-mono text-white tracking-wider">{referralCode}</code>
          <Button size="sm" onClick={handleCopy} className={copied ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      <div>
        <h3 className="text-md font-bold text-white mb-4 pl-1">Histórico de Indicações</h3>
        <div className="space-y-3">
          {referralsData.map(ref => (
            <div key={ref.id} className="flex items-center justify-between bg-slate-950 border border-slate-800 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${ref.status === "completed" ? "bg-green-500" : ref.status === "active" ? "bg-blue-500" : "bg-yellow-500"}`} />
                <div><p className="text-sm font-medium text-white">{ref.name}</p><p className="text-xs text-slate-500 capitalize">{ref.status === "completed" ? "Negócio Fechado" : ref.status === "active" ? "Cadastro Ativo" : "Pendente"}</p></div>
              </div>
              <div className="text-right">
                {ref.points > 0 ? (
                  <div className="flex flex-col items-end"><span className="text-blue-400 font-bold text-sm">+{ref.points} pts</span><span className="text-green-400 font-bold text-xs flex items-center gap-1"><Video className="w-3 h-3" />+1 Reunião</span></div>
                ) : <span className="text-slate-600 text-xs">Aguardando</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}