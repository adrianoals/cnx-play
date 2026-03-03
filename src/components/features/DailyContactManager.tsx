"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { companies } from "@/data/mock-companies"
import { MapPin, Building2, Briefcase, Calendar, ArrowRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Company } from "@/types"

export default function DailyContactManager() {
  const [open, setOpen] = useState(false)
  const [dailyContact, setDailyContact] = useState<Company | null>(null)
  const { toast } = useToast()

  const checkDailyContact = () => {
    const userStr = localStorage.getItem("current_user")
    if (!userStr) return
    const user = JSON.parse(userStr)
    if (user.status !== "active") return
    const today = new Date().toLocaleDateString("pt-BR")
    const lastDate = localStorage.getItem("last_daily_match_date")
    if (lastDate === today) return
    if (!companies || companies.length === 0) return

    const selected = companies[Math.floor(Math.random() * companies.length)]
    localStorage.setItem("last_daily_match_date", today)
    localStorage.setItem("current_daily_match", JSON.stringify(selected))

    // Save to match history
    const history = JSON.parse(localStorage.getItem("match_history") || "[]")
    history.push({ date: today, companyId: selected.id })
    localStorage.setItem("match_history", JSON.stringify(history))

    setDailyContact(selected)
    setOpen(true)
    toast({ title: "Nova Conexão Disponível!", description: "Seu contato diário foi gerado.", className: "bg-gradient-to-r from-blue-600 to-purple-600 text-white border-none" })
  }

  useEffect(() => {
    const timer = setTimeout(checkDailyContact, 2000)
    const interval = setInterval(checkDailyContact, 60000)
    return () => {
      clearTimeout(timer)
      clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!dailyContact) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md bg-slate-900/95 backdrop-blur-xl border border-slate-800 text-white shadow-2xl p-0 overflow-hidden gap-0">
        <div className="relative h-32 w-full bg-slate-800">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 mix-blend-overlay z-10" />
          <img src={dailyContact.image} alt={dailyContact.name} className="w-full h-full object-cover opacity-60" />
          <div className="absolute top-4 left-4 z-20">
            <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/10 shadow-lg">
              <Calendar className="w-3 h-3 text-blue-400" /><span>CONEXÃO DIÁRIA</span>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-6 relative">
          <div className="absolute -top-12 right-6">
            <div className="h-20 w-20 rounded-2xl border-4 border-slate-900 bg-slate-800 overflow-hidden shadow-xl">
              <img src={dailyContact.image} alt="Logo" className="h-full w-full object-cover" />
            </div>
          </div>
          <div className="space-y-2 pr-20">
            <h2 className="text-2xl font-bold text-white leading-tight">{dailyContact.name}</h2>
            <div className="flex items-center gap-2 text-blue-400 text-sm font-medium"><Building2 className="w-4 h-4" />{dailyContact.segment}</div>
          </div>
          <div className="space-y-4 bg-slate-950/50 rounded-xl p-4 border border-slate-800/50">
            <div className="flex items-start gap-3">
              <div className="mt-1 bg-slate-800 p-1.5 rounded-lg"><Briefcase className="w-4 h-4 text-slate-400" /></div>
              <div><p className="text-xs text-slate-500 uppercase font-semibold mb-0.5">Sobre</p><p className="text-sm text-slate-300 leading-relaxed">{dailyContact.description}</p></div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 bg-slate-800 p-1.5 rounded-lg"><MapPin className="w-4 h-4 text-slate-400" /></div>
              <div><p className="text-xs text-slate-500 uppercase font-semibold mb-0.5">Localização</p><p className="text-sm text-slate-300">{dailyContact.location}</p></div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <Button onClick={() => setOpen(false)} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-900/20 border-0 h-12 text-md">
              Ver no Chat <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
