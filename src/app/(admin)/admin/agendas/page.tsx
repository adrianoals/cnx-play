"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import {
  fetchUsersWithAvailabilityForDate,
  adminUpsertAvailability,
  adminEnableAllForDate,
  fetchUserWeekAvailability,
  adminEnableWeekForUser,
  type AdminUserWithAvailability,
} from "@/services/admin.service"
import {
  Calendar, ChevronLeft, ChevronRight, Loader2, Search, Users, User, CheckCheck, Sun, Moon,
} from "lucide-react"

function SlotToggle({ label, icon: Icon, checked, onChange, colorOff }: {
  label: string
  icon: React.ElementType
  checked: boolean
  onChange: () => void
  colorOff: string
}) {
  return (
    <button
      onClick={onChange}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border ${
        checked
          ? "bg-green-500/30 text-green-500 dark:text-green-400 font-bold border-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)] hover:bg-green-500/40"
          : colorOff
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  )
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function formatDateBR(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00")
  return d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" })
}

function getWeekStart(d: Date): Date {
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.getFullYear(), d.getMonth(), diff)
}

// ── Tab: Por Data ──────────────────────────────────────────────

function TabPorData() {
  const { toast } = useToast()
  const [date, setDate] = useState(() => formatDate(new Date()))
  const [users, setUsers] = useState<AdminUserWithAvailability[]>([])
  const [loading, setLoading] = useState(true)
  const [enabling, setEnabling] = useState(false)
  const [search, setSearch] = useState("")

  const load = useCallback(async (d: string) => {
    setLoading(true)
    try {
      const data = await fetchUsersWithAvailabilityForDate(d)
      setUsers(data)
    } catch {
      toast({ title: "Erro", description: "Falha ao carregar agendas.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { load(date) }, [date, load])

  function shiftDate(days: number) {
    const d = new Date(date + "T12:00:00")
    d.setDate(d.getDate() + days)
    setDate(formatDate(d))
  }

  async function toggleSlot(userId: string, slot: "07" | "19", current: boolean) {
    const user = users.find(u => u.id === userId)
    if (!user) return

    const newSlot07 = slot === "07" ? !current : user.slot07
    const newSlot19 = slot === "19" ? !current : user.slot19

    setUsers(prev => prev.map(u => u.id === userId ? { ...u, slot07: newSlot07, slot19: newSlot19 } : u))

    try {
      await adminUpsertAvailability(userId, date, newSlot07, newSlot19)
    } catch {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, slot07: user.slot07, slot19: user.slot19 } : u))
      toast({ title: "Erro", description: "Falha ao atualizar.", variant: "destructive" })
    }
  }

  async function handleEnableAll() {
    setEnabling(true)
    try {
      await adminEnableAllForDate(date)
      await load(date)
      toast({ title: "Todos habilitados", className: "bg-green-600 border-green-500 text-white" })
    } catch {
      toast({ title: "Erro", description: "Falha ao habilitar todos.", variant: "destructive" })
    } finally {
      setEnabling(false)
    }
  }

  const morningCount = users.filter(u => u.slot07).length
  const afternoonCount = users.filter(u => u.slot19).length

  const filtered = search
    ? users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.company.toLowerCase().includes(search.toLowerCase()))
    : users

  const available = filtered.filter(u => u.slot07 || u.slot19)
  const unavailable = filtered.filter(u => !u.slot07 && !u.slot19)

  function renderUser(user: AdminUserWithAvailability) {
    return (
      <div key={user.id} className="flex items-center justify-between gap-3 px-4 py-3 bg-card">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{user.name}</p>
          <p className="text-xs text-muted-foreground truncate">{user.company}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <SlotToggle
            label="Manha"
            icon={Sun}
            checked={user.slot07}
            onChange={() => toggleSlot(user.id, "07", user.slot07)}
            colorOff="bg-muted/50 text-muted-foreground border-border hover:border-muted-foreground/30"
          />
          <SlotToggle
            label="Tarde"
            icon={Moon}
            checked={user.slot19}
            onChange={() => toggleSlot(user.id, "19", user.slot19)}
            colorOff="bg-muted/50 text-muted-foreground border-border hover:border-muted-foreground/30"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Date selector */}
      <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-3 shadow-sm">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => shiftDate(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2 flex-1 justify-center">
          <Calendar className="h-4 w-4 text-primary" />
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="bg-transparent border-none text-sm font-bold text-foreground focus:outline-none"
          />
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => shiftDate(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Search + Enable All */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou empresa..."
            className="pl-9 bg-card shadow-sm"
          />
        </div>
        <Button onClick={handleEnableAll} disabled={enabling} size="sm" className="shrink-0 gap-1.5">
          {enabling ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
          <span className="hidden sm:inline">Habilitar Todos</span>
        </Button>
      </div>

      {/* Summary */}
      <div className="flex gap-4 text-sm bg-card border border-border rounded-xl px-4 py-2.5 shadow-sm">
        <span className="flex items-center gap-1.5">
          <Sun className="h-3.5 w-3.5 text-amber-500" />
          <span className="font-bold text-foreground">{morningCount}</span>
          <span className="text-muted-foreground">manha</span>
        </span>
        <span className="flex items-center gap-1.5">
          <Moon className="h-3.5 w-3.5 text-blue-500" />
          <span className="font-bold text-foreground">{afternoonCount}</span>
          <span className="text-muted-foreground">tarde</span>
        </span>
        <span className="text-muted-foreground">
          de <span className="font-bold text-foreground">{users.length}</span>
        </span>
      </div>

      {/* User list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Calendar className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>Nenhum usuario com empresa encontrado.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {available.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <p className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wide">
                  Disponiveis ({available.length})
                </p>
              </div>
              <div className="border border-green-500/30 dark:border-green-500/20 rounded-xl overflow-hidden divide-y divide-border shadow-sm">
                {available.map(renderUser)}
              </div>
            </div>
          )}
          {unavailable.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-2 w-2 rounded-full bg-red-500" />
                <p className="text-xs font-bold text-red-500 dark:text-red-400 uppercase tracking-wide">
                  Sem disponibilidade ({unavailable.length})
                </p>
              </div>
              <div className="border border-red-500/30 dark:border-red-500/20 rounded-xl overflow-hidden divide-y divide-border shadow-sm">
                {unavailable.map(renderUser)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Tab: Por Usuario ───────────────────────────────────────────

interface UserOption {
  id: string
  name: string
  company: string
}

function TabPorUsuario() {
  const { toast } = useToast()
  const [allUsers, setAllUsers] = useState<UserOption[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null)

  const [weekStart, setWeekStart] = useState(() => formatDate(getWeekStart(new Date())))
  const [weekData, setWeekData] = useState<Map<string, { slot07: boolean; slot19: boolean }>>(new Map())
  const [loadingWeek, setLoadingWeek] = useState(false)
  const [enablingWeek, setEnablingWeek] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const today = formatDate(new Date())
        const data = await fetchUsersWithAvailabilityForDate(today)
        setAllUsers(data.map(u => ({ id: u.id, name: u.name, company: u.company })))
      } catch {
        toast({ title: "Erro", description: "Falha ao carregar usuarios.", variant: "destructive" })
      } finally {
        setLoadingUsers(false)
      }
    }
    load()
  }, [toast])

  const loadWeek = useCallback(async (userId: string, ws: string) => {
    setLoadingWeek(true)
    try {
      const data = await fetchUserWeekAvailability(userId, ws)
      const map = new Map<string, { slot07: boolean; slot19: boolean }>()
      for (const d of data) map.set(d.date, { slot07: d.slot07, slot19: d.slot19 })
      setWeekData(map)
    } catch {
      toast({ title: "Erro", description: "Falha ao carregar semana.", variant: "destructive" })
    } finally {
      setLoadingWeek(false)
    }
  }, [toast])

  useEffect(() => {
    if (selectedUser) loadWeek(selectedUser.id, weekStart)
  }, [selectedUser, weekStart, loadWeek])

  function shiftWeek(weeks: number) {
    const d = new Date(weekStart + "T12:00:00")
    d.setDate(d.getDate() + weeks * 7)
    setWeekStart(formatDate(d))
  }

  async function toggleDaySlot(dateStr: string, slot: "07" | "19") {
    if (!selectedUser) return
    const current = weekData.get(dateStr) || { slot07: false, slot19: false }
    const newSlot07 = slot === "07" ? !current.slot07 : current.slot07
    const newSlot19 = slot === "19" ? !current.slot19 : current.slot19

    setWeekData(prev => {
      const next = new Map(prev)
      next.set(dateStr, { slot07: newSlot07, slot19: newSlot19 })
      return next
    })

    try {
      await adminUpsertAvailability(selectedUser.id, dateStr, newSlot07, newSlot19)
    } catch {
      setWeekData(prev => {
        const next = new Map(prev)
        next.set(dateStr, current)
        return next
      })
      toast({ title: "Erro", description: "Falha ao atualizar.", variant: "destructive" })
    }
  }

  async function handleEnableWeek() {
    if (!selectedUser) return
    setEnablingWeek(true)
    try {
      await adminEnableWeekForUser(selectedUser.id, weekStart)
      await loadWeek(selectedUser.id, weekStart)
      toast({ title: "Semana habilitada", className: "bg-green-600 border-green-500 text-white" })
    } catch {
      toast({ title: "Erro", description: "Falha ao habilitar semana.", variant: "destructive" })
    } finally {
      setEnablingWeek(false)
    }
  }

  const weekDays: string[] = []
  const ws = new Date(weekStart + "T12:00:00")
  for (let i = 0; i < 7; i++) {
    const d = new Date(ws)
    d.setDate(d.getDate() + i)
    weekDays.push(formatDate(d))
  }

  const weekEndDate = new Date(ws)
  weekEndDate.setDate(weekEndDate.getDate() + 6)

  const filteredUsers = search
    ? allUsers.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.company.toLowerCase().includes(search.toLowerCase()))
    : allUsers

  if (loadingUsers) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // User not selected — show list
  if (!selectedUser) {
    return (
      <div className="space-y-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            placeholder="Buscar usuario..."
            className="pl-9 bg-card shadow-sm"
          />
        </div>
        <div className="border border-border rounded-xl overflow-hidden divide-y divide-border shadow-sm">
          {filteredUsers.map(u => (
            <button
              key={u.id}
              onClick={() => setSelectedUser(u)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors text-left bg-card"
            >
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{u.name}</p>
                <p className="text-xs text-muted-foreground truncate">{u.company}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          ))}
        </div>
      </div>
    )
  }

  // User selected — week view
  return (
    <div className="space-y-5">
      {/* Back */}
      <button
        onClick={() => { setSelectedUser(null); setSearch("") }}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Voltar
      </button>

      {/* User card */}
      <div className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm">
        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <User className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold truncate">{selectedUser.name}</p>
          <p className="text-xs text-muted-foreground truncate">{selectedUser.company}</p>
        </div>
      </div>

      {/* Week navigation */}
      <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-3 shadow-sm">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => shiftWeek(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2 flex-1 justify-center">
          <Calendar className="h-4 w-4 text-primary" />
          <span className="text-sm font-bold text-foreground">
            {ws.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} - {weekEndDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
          </span>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => shiftWeek(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Enable week */}
      <Button onClick={handleEnableWeek} disabled={enablingWeek} size="sm" className="w-full gap-1.5">
        {enablingWeek ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
        Habilitar Semana Toda
      </Button>

      {/* Week grid */}
      {loadingWeek ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden divide-y divide-border shadow-sm">
          {weekDays.map(day => {
            const avail = weekData.get(day) || { slot07: false, slot19: false }
            return (
              <div key={day} className="flex items-center justify-between gap-3 px-4 py-3 bg-card">
                <p className="text-sm font-medium capitalize min-w-[80px]">{formatDateBR(day)}</p>
                <div className="flex items-center gap-2">
                  <SlotToggle
                    label="Manha"
                    icon={Sun}
                    checked={avail.slot07}
                    onChange={() => toggleDaySlot(day, "07")}
  
                    colorOff="bg-muted/50 text-muted-foreground border-border hover:border-muted-foreground/30"
                  />
                  <SlotToggle
                    label="Tarde"
                    icon={Moon}
                    checked={avail.slot19}
                    onChange={() => toggleDaySlot(day, "19")}
  
                    colorOff="bg-muted/50 text-muted-foreground border-border hover:border-muted-foreground/30"
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────

export default function AdminAgendasPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="h-6 w-6 text-primary" />
          Agendas
        </h1>
        <p className="text-muted-foreground text-sm">Configure a disponibilidade dos participantes.</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="data">
        <TabsList className="w-full">
          <TabsTrigger value="data" className="flex-1 gap-2">
            <Calendar className="h-4 w-4" />
            Por Data
          </TabsTrigger>
          <TabsTrigger value="usuario" className="flex-1 gap-2">
            <Users className="h-4 w-4" />
            Por Usuario
          </TabsTrigger>
        </TabsList>
        <TabsContent value="data" className="mt-4">
          <TabPorData />
        </TabsContent>
        <TabsContent value="usuario" className="mt-4">
          <TabPorUsuario />
        </TabsContent>
      </Tabs>
    </div>
  )
}
