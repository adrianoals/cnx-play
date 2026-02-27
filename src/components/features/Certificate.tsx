"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Download, Share2, Award, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CertificateProps {
  isOpen: boolean
  onClose: () => void
  userName: string
  level: string
  date: string
}

export default function Certificate({ isOpen, onClose, userName, level, date }: CertificateProps) {
  if (!isOpen) return null
  const getLevelStyles = (lvl: string) => {
    switch (lvl?.toLowerCase()) {
      case "diamante": return { bg: "from-cyan-900 to-blue-900", border: "border-cyan-400", accent: "text-cyan-400" }
      case "safira": return { bg: "from-blue-900 to-indigo-900", border: "border-blue-400", accent: "text-blue-400" }
      default: return { bg: "from-slate-800 to-gray-900", border: "border-slate-400", accent: "text-slate-300" }
    }
  }
  const styles = getLevelStyles(level)

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", duration: 0.8 }} className="relative max-w-4xl w-full">
          <button onClick={onClose} className="absolute -top-12 right-0 text-white/50 hover:text-white"><X className="h-8 w-8" /></button>
          <div className={`relative bg-gradient-to-br ${styles.bg} p-2 rounded-xl shadow-2xl overflow-hidden border-4 ${styles.border}`}>
            <div className={`border-2 border-dashed ${styles.border} border-opacity-30 rounded-lg p-8 md:p-12 text-center relative`}>
              <div className="absolute top-4 left-4 w-16 h-16 border-t-2 border-l-2 border-white/20 rounded-tl-3xl" />
              <div className="absolute bottom-4 right-4 w-16 h-16 border-b-2 border-r-2 border-white/20 rounded-br-3xl" />
              <div className="flex justify-center mb-8"><div className={`p-4 rounded-full border-2 ${styles.border} bg-black/20 backdrop-blur-sm`}><Award className={`h-12 w-12 ${styles.accent}`} /></div></div>
              <h2 className="text-xl md:text-2xl font-serif text-white/80 uppercase tracking-[0.2em] mb-4">Certificado de Reconhecimento</h2>
              <p className="text-slate-300 mb-6 font-light">Concedido orgulhosamente a</p>
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-8 font-serif italic drop-shadow-lg">{userName}</h1>
              <div className="w-24 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent mx-auto mb-8" />
              <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-8 leading-relaxed">
                Por demonstrar excelência em networking e atingir o nível <span className={`font-bold ${styles.accent} uppercase`}>{level}</span> na plataforma Conecta Empresários.
              </p>
              <div className="flex justify-between items-end mt-12 pt-8 border-t border-white/10">
                <div className="text-left"><p className="text-white/60 text-xs uppercase tracking-widest mb-1">Data de Emissão</p><p className="text-white font-mono">{date}</p></div>
                <div className="text-right"><p className="text-white/60 text-xs uppercase tracking-widest border-t border-white/20 pt-1 inline-block">CEO, Conecta Empresários</p></div>
              </div>
            </div>
          </div>
          <div className="flex justify-center gap-4 mt-8">
            <Button className="bg-white text-slate-900 hover:bg-slate-200"><Download className="mr-2 h-4 w-4" />Baixar PDF</Button>
            <Button variant="outline" className="text-white border-white/20 hover:bg-white/10"><Share2 className="mr-2 h-4 w-4" />Compartilhar</Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}