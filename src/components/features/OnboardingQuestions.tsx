"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight, ArrowLeft, Check, Loader2 } from "lucide-react"

const Q1_OPTIONS = [
  "Conquistar novos clientes",
  "Fechar parcerias estratégicas",
  "Aumentar minha visibilidade no mercado",
  "Expandir minha rede de relacionamentos",
  "Encontrar novas oportunidades de negócio",
]

const Q2_OPTIONS = ["Sim", "Não"]

const Q3_OPTIONS = [
  "1 reunião",
  "3 reuniões",
  "5 reuniões",
  "7 reuniões ou mais",
]

export interface OnboardingAnswers {
  impactGoals: string[]
  believesSingleConnection: boolean
  meetingsPerWeek: string
}

interface Props {
  onComplete: (answers: OnboardingAnswers) => void | Promise<void>
  submitting?: boolean
}

export default function OnboardingQuestions({ onComplete, submitting = false }: Props) {
  const [step, setStep] = useState(0)
  const [q1, setQ1] = useState<string[]>([])
  const [q2, setQ2] = useState<string | null>(null)
  const [q3, setQ3] = useState<string | null>(null)

  const toggleQ1 = (option: string) => {
    setQ1(prev => prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option])
  }

  const canAdvance =
    (step === 0 && q1.length > 0) ||
    (step === 1 && q2 !== null) ||
    (step === 2 && q3 !== null)

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1)
    } else if (q2 !== null && q3 !== null) {
      void onComplete({
        impactGoals: q1,
        believesSingleConnection: q2 === "Sim",
        meetingsPerWeek: q3,
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="font-medium">Pergunta {step + 1} de 3</span>
        <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
            initial={false}
            animate={{ width: `${((step + 1) / 3) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="q1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div>
              <h2 className="text-lg font-bold leading-snug">
                Qual seria o maior impacto para a sua empresa nos próximos 90 dias?
              </h2>
              <p className="text-xs text-muted-foreground mt-1">Você pode escolher mais de uma opção.</p>
            </div>
            <div className="space-y-2">
              {Q1_OPTIONS.map(opt => {
                const selected = q1.includes(opt)
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleQ1(opt)}
                    className={`w-full text-left p-3 rounded-xl border transition-all text-sm flex items-center gap-3 ${
                      selected
                        ? "border-primary bg-primary/10"
                        : "border-border bg-secondary/30 hover:bg-secondary/50"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                      selected ? "border-primary bg-primary" : "border-muted-foreground/30"
                    }`}>
                      {selected && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                    <span>{opt}</span>
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="q2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <h2 className="text-lg font-bold leading-snug">
              Você acredita que uma única conexão certa pode gerar uma grande oportunidade para sua empresa?
            </h2>
            <div className="space-y-2">
              {Q2_OPTIONS.map(opt => {
                const selected = q2 === opt
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setQ2(opt)}
                    className={`w-full text-left p-3 rounded-xl border transition-all text-sm flex items-center gap-3 ${
                      selected
                        ? "border-primary bg-primary/10"
                        : "border-border bg-secondary/30 hover:bg-secondary/50"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      selected ? "border-primary" : "border-muted-foreground/30"
                    }`}>
                      {selected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                    </div>
                    <span>{opt}</span>
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="q3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <h2 className="text-lg font-bold leading-snug">
              Quantas novas reuniões de negócio você gostaria de gerar por semana?
            </h2>
            <div className="space-y-2">
              {Q3_OPTIONS.map(opt => {
                const selected = q3 === opt
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setQ3(opt)}
                    className={`w-full text-left p-3 rounded-xl border transition-all text-sm flex items-center gap-3 ${
                      selected
                        ? "border-primary bg-primary/10"
                        : "border-border bg-secondary/30 hover:bg-secondary/50"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      selected ? "border-primary" : "border-muted-foreground/30"
                    }`}>
                      {selected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                    </div>
                    <span>{opt}</span>
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-2 pt-2">
        {step > 0 && (
          <Button
            variant="ghost"
            onClick={() => setStep(step - 1)}
            disabled={submitting}
            className="flex-1"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
        )}
        <Button
          onClick={handleNext}
          disabled={!canAdvance || submitting}
          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : step < 2 ? (
            <>Avançar <ArrowRight className="h-4 w-4 ml-1" /></>
          ) : (
            <>Concluir <Check className="h-4 w-4 ml-1" /></>
          )}
        </Button>
      </div>
    </div>
  )
}
