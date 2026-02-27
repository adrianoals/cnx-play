"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Sparkles, ArrowRight, Rocket } from "lucide-react"

export default function FirstLoginWelcome({ userName, onClose }: { userName: string; onClose?: () => void }) {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const hasSeen = localStorage.getItem("has_seen_onboarding")
    if (!hasSeen) { const t = setTimeout(() => setIsOpen(true), 1000); return () => clearTimeout(t) }
  }, [])

  const handleClose = () => {
    localStorage.setItem("has_seen_onboarding", "true")
    setIsOpen(false)
    onClose?.()
  }

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && handleClose()}>
      <DialogContent className="max-w-md bg-slate-950 border-slate-800 text-center p-0 overflow-hidden sm:rounded-3xl focus:outline-none">
        <div className="relative p-8">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-blue-900/40 to-transparent pointer-events-none" />
          <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", duration: 1 }}
            className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-xl relative z-10">
            <Rocket className="h-10 w-10 text-white" />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h2 className="text-2xl font-bold text-white mb-2">Bem-vindo, {userName}!</h2>
            <p className="text-slate-400 mb-8 leading-relaxed">Preparamos um tour rápido para você conhecer a plataforma.</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Button onClick={handleClose} className="w-full h-12 bg-white text-slate-950 hover:bg-slate-200 font-bold rounded-xl text-base group">
              Iniciar Tour Rápido<ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </div>
        <div className="bg-slate-900/50 p-4 border-t border-slate-800">
          <p className="text-xs text-slate-500 flex items-center justify-center gap-2"><Sparkles className="h-3 w-3 text-yellow-500" />Você começa como nível <strong>Platina</strong></p>
        </div>
      </DialogContent>
    </Dialog>
  )
}