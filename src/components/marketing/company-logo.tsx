"use client"

import { motion } from "framer-motion"
import { Network } from "lucide-react"

interface CompanyLogoProps {
  textColor?: string
  showTagline?: boolean
}

export function CompanyLogo({ textColor = "text-white", showTagline = false }: CompanyLogoProps) {
  return (
    <div className="flex items-center gap-2">
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, type: "spring", stiffness: 200, damping: 20 }}
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 p-1"
      >
        <Network className="h-5 w-5 text-white" />
      </motion.div>
      <div className="flex items-center gap-2">
        <span className={`text-xl font-bold tracking-tight ${textColor}`}>
          Company Conexão Play
        </span>
        <span className="text-xl font-bold text-slate-500">|</span>
        <span className={`text-lg font-semibold tracking-tight ${textColor}`}>
          365conexões
        </span>
      </div>
      {showTagline && (
        <p className="hidden text-xs text-slate-400 sm:block">
          Networking profissional inteligente
        </p>
      )}
    </div>
  )
}
