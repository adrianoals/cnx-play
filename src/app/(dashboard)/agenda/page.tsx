"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useCurrentUser } from "@/hooks/use-current-user"
import { fetchWeekAvailability, upsertDayAvailability } from "@/services/availability.service"
import type { UserAvailability } from "@/types"
import { ChevronLeft, ChevronRight, Calendar, Info, Loader2 } from "lucide-react"

function getMonday(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  date.setHours(0, 0, 0, 0)
  return date
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]

export default function AgendaPage() {
  const { toast } = useToast()
  const { user: currentUser } = useCurrentUser()

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const thisMonday = getMonday(today)
  const nextMonday = addDays(thisMonday, 7)
  const maxMonday = nextMonday // limit: 2 weeks (this + next)

  const [weekStart, setWeekStart] = useState<Date>(thisMonday)
  const [availability, setAvailability] = useState<Map<string, UserAvailability>>(new Map())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  const loadAvailability = useCallback(async () => {
    try {
      setLoading(true)
      const data = await fetchWeekAvailability(formatDate(weekStart))
      const map = new Map<string, UserAvailability>()
      for (const item of data) {
        map.set(item.availableDate, item)
      }
      setAvailability(map)
    } catch {
      toast({ title: "Erro ao carregar agenda", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [weekStart, toast])

  useEffect(() => {
    if (currentUser) loadAvailability()
  }, [currentUser, loadAvailability])

  const canGoBack = weekStart.getTime() > thisMonday.getTime()
  const canGoForward = weekStart.getTime() < maxMonday.getTime()

  const goBack = () => {
    if (canGoBack) setWeekStart(addDays(weekStart, -7))
  }
  const goForward = () => {
    if (canGoForward) setWeekStart(addDays(weekStart, 7))
  }

  const handleToggle = async (date: string, slot: "07" | "19") => {
    const current = availability.get(date)
    const slot07 = current?.slot07 ?? false
    const slot19 = current?.slot19 ?? false

    const new07 = slot === "07" ? !slot07 : slot07
    const new19 = slot === "19" ? !slot19 : slot19

    // Optimistic update
    const optimistic: UserAvailability = {
      id: current?.id || "",
      userId: current?.userId || "",
      availableDate: date,
      slot07: new07,
      slot19: new19,
    }
    setAvailability(prev => new Map(prev).set(date, optimistic))
    setSaving(date + slot)

    try {
      const saved = await upsertDayAvailability(date, new07, new19)
      setAvailability(prev => new Map(prev).set(date, saved))
    } catch {
      // Revert on error
      if (current) {
        setAvailability(prev => new Map(prev).set(date, current))
      } else {
        setAvailability(prev => {
          const m = new Map(prev)
          m.delete(date)
          return m
        })
      }
      toast({ title: "Erro ao salvar disponibilidade", variant: "destructive" })
    } finally {
      setSaving(null)
    }
  }

  const isDisabled = (date: string): boolean => {
    const d = new Date(date + "T00:00:00")
    return d.getTime() <= today.getTime()
  }

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(weekStart, i)
    return formatDate(d)
  })

  const weekRangeLabel = (() => {
    const start = weekStart
    const end = addDays(weekStart, 6)
    const fmt = (d: Date) =>
      d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
    return `${fmt(start)} — ${fmt(end)}`
  })()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Calendar className="h-8 w-8 text-primary" />
          Minha Agenda
        </h1>
        <p className="text-muted-foreground">Configure sua disponibilidade para receber conexões.</p>
      </div>

      {/* Info Banner */}
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-5 flex items-start gap-3"
      >
        <Info className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
        <p className="text-sm text-muted-foreground">
          Marque os dias e horários em que você está disponível para receber conexões.
          Nos horários marcados, você receberá um contato para conversar pelo chat e combinar
          uma reunião por fora da plataforma (WhatsApp, Meet, presencial, etc.).
          <br />
          <span className="font-medium text-foreground">Configure até as 20h do dia anterior.</span>
        </p>
      </motion.div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between bg-card border border-border rounded-2xl p-4 shadow-sm">
        <Button
          variant="ghost"
          size="icon"
          onClick={goBack}
          disabled={!canGoBack}
          className="rounded-xl"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <span className="font-semibold text-sm">{weekRangeLabel}</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={goForward}
          disabled={!canGoForward}
          className="rounded-xl"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Week Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-2 md:gap-3">
          {weekDates.map((date, i) => {
            const disabled = isDisabled(date)
            const avail = availability.get(date)
            const slot07 = avail?.slot07 ?? false
            const slot19 = avail?.slot19 ?? false
            const dateObj = new Date(date + "T00:00:00")
            const dayNum = dateObj.getDate()
            const isToday = date === formatDate(today)

            return (
              <motion.div
                key={date}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className={`bg-card border rounded-2xl p-3 md:p-4 flex flex-col items-center gap-3 transition-colors ${
                  disabled
                    ? "opacity-50 border-border"
                    : isToday
                      ? "border-primary/50 bg-primary/5"
                      : "border-border hover:border-primary/30"
                }`}
              >
                <div className="text-center">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">
                    {WEEKDAYS[i]}
                  </p>
                  <p className={`text-lg font-bold ${isToday ? "text-primary" : ""}`}>
                    {dayNum}
                  </p>
                </div>

                {/* Slot 07:00 */}
                <button
                  disabled={disabled}
                  onClick={() => handleToggle(date, "07")}
                  className={`w-full py-2 px-1 rounded-xl text-xs font-medium transition-all ${
                    disabled
                      ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : slot07
                        ? "bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/30 hover:bg-green-500/30"
                        : "bg-secondary/50 text-muted-foreground border border-transparent hover:bg-secondary hover:border-border"
                  }`}
                >
                  {saving === date + "07" ? (
                    <Loader2 className="h-3 w-3 animate-spin mx-auto" />
                  ) : (
                    "07:00"
                  )}
                </button>

                {/* Slot 19:00 */}
                <button
                  disabled={disabled}
                  onClick={() => handleToggle(date, "19")}
                  className={`w-full py-2 px-1 rounded-xl text-xs font-medium transition-all ${
                    disabled
                      ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : slot19
                        ? "bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/30 hover:bg-green-500/30"
                        : "bg-secondary/50 text-muted-foreground border border-transparent hover:bg-secondary hover:border-border"
                  }`}
                >
                  {saving === date + "19" ? (
                    <Loader2 className="h-3 w-3 animate-spin mx-auto" />
                  ) : (
                    "19:00"
                  )}
                </button>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
