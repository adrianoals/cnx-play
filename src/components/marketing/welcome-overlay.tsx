"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Rocket, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

export function WelcomeOverlay() {
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window === "undefined") return false
    const hasSeenIntro = sessionStorage.getItem("has_seen_intro_v1")
    if (hasSeenIntro) return false
    sessionStorage.setItem("has_seen_intro_v1", "true")
    return true
  })

  const handleClose = () => {
    setIsVisible(false)
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-slate-950/90 p-4 backdrop-blur-sm sm:p-8"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ delay: 0.2, duration: 0.5, type: "spring", stiffness: 100 }}
            className="relative flex min-h-[500px] w-full max-w-5xl flex-col items-center justify-center overflow-hidden rounded-[2rem] border border-slate-800/50 bg-slate-950 p-6 text-center shadow-2xl md:p-10"
          >
            {/* Background */}
            <div className="absolute inset-0 z-0 overflow-hidden">
              <div className="absolute inset-0 z-10 bg-slate-950 opacity-40" />
              <div className="absolute left-0 top-0 z-20 h-full w-full bg-gradient-to-br from-blue-900/40 via-transparent to-purple-900/40 mix-blend-overlay" />
              <div className="absolute bottom-0 left-0 z-20 h-1/2 w-full bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent" />

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/landing/welcome-bg.jpg"
                alt=""
                className="h-full w-full scale-105 object-cover object-center opacity-60"
              />

              <div className="pointer-events-none absolute -right-24 -top-24 z-20 h-96 w-96 rounded-full bg-blue-500/20 blur-[100px]" />
              <div className="pointer-events-none absolute -bottom-24 -left-24 z-20 h-96 w-96 rounded-full bg-purple-500/20 blur-[100px]" />
            </div>

            {/* Content */}
            <div className="relative z-30 mx-auto flex max-w-3xl flex-col items-center space-y-8 py-10">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 backdrop-blur-md"
              >
                <Sparkles className="h-3 w-3 text-yellow-400" />
                <span className="text-xs font-medium uppercase tracking-wide text-blue-100">
                  Networking Premium
                </span>
              </motion.div>

              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                <h1 className="text-4xl font-black leading-[0.9] tracking-tighter text-white drop-shadow-2xl md:text-6xl lg:text-8xl">
                  Tenha 365
                  <br />
                  <span className="bg-gradient-to-r from-blue-200 via-white to-blue-200 bg-clip-text text-transparent">
                    conexões
                  </span>
                  <br />
                  por ano
                </h1>
              </motion.div>

              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="mx-auto max-w-xl text-lg font-light leading-relaxed text-slate-300 md:text-2xl"
              >
                O seu ano de transformação e negócios
                <br className="hidden md:block" /> começa com um aperto de mão estratégico.
              </motion.p>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.8 }}
                className="pt-4"
              >
                <Button
                  onClick={handleClose}
                  className="group relative h-16 overflow-hidden rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-12 text-lg font-bold text-white shadow-[0_0_50px_rgba(245,158,11,0.25)] transition-all duration-300 hover:from-amber-600 hover:to-orange-700 hover:shadow-[0_0_80px_rgba(245,158,11,0.4)]"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <Rocket className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                    Começar agora
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </Button>
              </motion.div>
            </div>

            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute right-6 top-6 z-40 rounded-full border border-white/5 bg-black/20 p-2 text-white/70 backdrop-blur-md transition-all hover:bg-black/40 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
