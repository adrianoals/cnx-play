"use client"

import { useState, useEffect, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  fetchDailyMatchesAdmin,
  deleteDailyMatch,
  createManualMatch,
  swapMatch,
  fetchAvailableUsersForDate,
} from "@/services/admin.service"
import type { AdminDailyMatch } from "@/services/admin.service"
import {
  Search, Calendar, MoreHorizontal, Trash2, RefreshCw, Plus,
  Loader2, Link2, ArrowLeftRight, ChevronLeft, ChevronRight, AlertTriangle,
} from "lucide-react"

function formatDateInput(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export default function AdminConexoesPage() {
  const { toast } = useToast()

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)

  const [selectedDate, setSelectedDate] = useState(formatDateInput(tomorrow))
  const [matches, setMatches] = useState<AdminDailyMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  // Manual match dialog
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [availableUsers, setAvailableUsers] = useState<Array<{ id: string; name: string; company: string }>>([])
  const [manualSlot, setManualSlot] = useState<"07:00" | "19:00">("07:00")
  const [selectedUserA, setSelectedUserA] = useState("")
  const [selectedUserB, setSelectedUserB] = useState("")
  const [creatingMatch, setCreatingMatch] = useState(false)

  // Swap dialog
  const [showSwapDialog, setShowSwapDialog] = useState(false)
  const [swapMatchId, setSwapMatchId] = useState("")
  const [swapSlot, setSwapSlot] = useState<"07:00" | "19:00">("07:00")
  const [swapNewPartner, setSwapNewPartner] = useState("")
  const [swapping, setSwapping] = useState(false)

  const loadMatches = useCallback(async () => {
    try {
      setLoading(true)
      const data = await fetchDailyMatchesAdmin(selectedDate)
      setMatches(data)
    } catch (err) {
      toast({
        title: "Erro ao carregar conexões",
        description: err instanceof Error ? err.message : "Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [selectedDate, toast])

  useEffect(() => {
    loadMatches()
  }, [loadMatches])

  const filteredMatches = matches.filter(m => {
    const term = search.toLowerCase()
    return (
      m.userAName.toLowerCase().includes(term) ||
      m.userBName.toLowerCase().includes(term) ||
      m.userACompany.toLowerCase().includes(term) ||
      m.userBCompany.toLowerCase().includes(term)
    )
  })

  const handleDelete = async (matchId: string) => {
    try {
      await deleteDailyMatch(matchId)
      toast({ title: "Match removido" })
      loadMatches()
    } catch (err) {
      toast({
        title: "Erro ao remover",
        description: err instanceof Error ? err.message : "",
        variant: "destructive",
      })
    }
  }

  const handleOpenCreate = async () => {
    try {
      const users = await fetchAvailableUsersForDate(selectedDate, manualSlot)
      setAvailableUsers(users)
      setShowCreateDialog(true)
    } catch (err) {
      toast({
        title: "Erro ao carregar disponíveis",
        description: err instanceof Error ? err.message : "",
        variant: "destructive",
      })
    }
  }

  const handleCreateMatch = async () => {
    if (!selectedUserA || !selectedUserB || selectedUserA === selectedUserB) {
      toast({ title: "Selecione dois usuários diferentes", variant: "destructive" })
      return
    }
    setCreatingMatch(true)
    try {
      await createManualMatch(selectedUserA, selectedUserB, selectedDate, manualSlot)
      toast({ title: "Match criado com sucesso" })
      setShowCreateDialog(false)
      setSelectedUserA("")
      setSelectedUserB("")
      loadMatches()
    } catch (err) {
      toast({
        title: "Erro ao criar match",
        description: err instanceof Error ? err.message : "",
        variant: "destructive",
      })
    } finally {
      setCreatingMatch(false)
    }
  }

  const handleOpenSwap = async (matchId: string, slot: "07:00" | "19:00") => {
    setSwapMatchId(matchId)
    setSwapSlot(slot)
    try {
      const users = await fetchAvailableUsersForDate(selectedDate, slot)
      setAvailableUsers(users)
      setShowSwapDialog(true)
    } catch (err) {
      toast({
        title: "Erro ao carregar disponíveis",
        description: err instanceof Error ? err.message : "",
        variant: "destructive",
      })
    }
  }

  const handleSwap = async () => {
    if (!swapNewPartner) {
      toast({ title: "Selecione o novo parceiro", variant: "destructive" })
      return
    }
    setSwapping(true)
    try {
      await swapMatch(swapMatchId, swapNewPartner)
      toast({ title: "Parceiro trocado com sucesso" })
      setShowSwapDialog(false)
      setSwapNewPartner("")
      loadMatches()
    } catch (err) {
      toast({
        title: "Erro ao trocar parceiro",
        description: err instanceof Error ? err.message : "",
        variant: "destructive",
      })
    } finally {
      setSwapping(false)
    }
  }

  const changeDate = (offset: number) => {
    const d = new Date(selectedDate + "T00:00:00")
    d.setDate(d.getDate() + offset)
    setSelectedDate(formatDateInput(d))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Link2 className="h-6 w-6 text-primary" />
            Conexões do Dia
          </h1>
          <p className="text-muted-foreground text-sm">Gerencie os matches diários dos usuários.</p>
        </div>

        <Button onClick={handleOpenCreate} size="sm" className="shrink-0">
          <Plus className="h-4 w-4 mr-1" />
          Match Manual
        </Button>
      </div>

      {/* Date Selector + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => changeDate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="bg-transparent border-none text-sm font-medium focus:outline-none"
            />
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => changeDate(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou empresa..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Button variant="outline" size="icon" onClick={loadMatches} className="shrink-0">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Summary */}
      <div className="flex gap-4 text-sm">
        <span className="text-muted-foreground">
          <span className="font-semibold text-foreground">{filteredMatches.length}</span> conexões
        </span>
        <span className="text-muted-foreground">
          <span className="font-semibold text-foreground">{filteredMatches.filter(m => m.timeSlot === "07:00").length}</span> manhã
        </span>
        <span className="text-muted-foreground">
          <span className="font-semibold text-foreground">{filteredMatches.filter(m => m.timeSlot === "19:00").length}</span> noite
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Link2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>Nenhuma conexão para esta data.</p>
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Horário</TableHead>
                <TableHead>Usuário A</TableHead>
                <TableHead className="hidden md:table-cell">Categoria A</TableHead>
                <TableHead className="text-center">
                  <ArrowLeftRight className="h-4 w-4 mx-auto" />
                </TableHead>
                <TableHead>Usuário B</TableHead>
                <TableHead className="hidden md:table-cell">Categoria B</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMatches.map(match => (
                <TableRow key={match.id}>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">
                      {match.timeSlot}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{match.userAName}</p>
                      <p className="text-xs text-muted-foreground">{match.userACompany}</p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                    {match.userACategory}
                  </TableCell>
                  <TableCell className="text-center">
                    <ArrowLeftRight className="h-3.5 w-3.5 text-muted-foreground mx-auto" />
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{match.userBName}</p>
                      <p className="text-xs text-muted-foreground">{match.userBCompany}</p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                    {match.userBCategory}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {match.repeatCount > 1 && (
                        <Badge variant="secondary" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20">
                          <AlertTriangle className="h-3 w-3 mr-0.5" />
                          {match.repeatCount}x
                        </Badge>
                      )}
                      <Badge
                        variant={match.status === "completed" ? "default" : "secondary"}
                        className={match.status === "completed" ? "bg-green-500/10 text-green-600 border-green-500/20" : ""}
                      >
                        {match.status === "completed" ? "Realizado" : "Pendente"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleOpenSwap(match.id, match.timeSlot)}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Trocar Parceiro
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(match.id)}
                          className="text-red-500 focus:text-red-500"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remover Match
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create Manual Match Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Match Manual</DialogTitle>
            <DialogDescription>
              Selecione dois usuários disponíveis para conectar em {selectedDate}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Horário</label>
              <div className="flex gap-2">
                <Button
                  variant={manualSlot === "07:00" ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setManualSlot("07:00"); setAvailableUsers([]) }}
                >
                  07:00
                </Button>
                <Button
                  variant={manualSlot === "19:00" ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setManualSlot("19:00"); setAvailableUsers([]) }}
                >
                  19:00
                </Button>
                <Button variant="ghost" size="sm" onClick={handleOpenCreate}>
                  <RefreshCw className="h-3.5 w-3.5 mr-1" />
                  Carregar
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Usuário A</label>
              <select
                value={selectedUserA}
                onChange={e => setSelectedUserA(e.target.value)}
                className="w-full bg-secondary/50 border border-input rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Selecione...</option>
                {availableUsers.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} — {u.company}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Usuário B</label>
              <select
                value={selectedUserB}
                onChange={e => setSelectedUserB(e.target.value)}
                className="w-full bg-secondary/50 border border-input rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Selecione...</option>
                {availableUsers
                  .filter(u => u.id !== selectedUserA)
                  .map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} — {u.company}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateMatch} disabled={creatingMatch}>
              {creatingMatch && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Criar Match
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Swap Partner Dialog */}
      <Dialog open={showSwapDialog} onOpenChange={setShowSwapDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Trocar Parceiro</DialogTitle>
            <DialogDescription>
              Selecione o novo parceiro para o horário {swapSlot}.
            </DialogDescription>
          </DialogHeader>

          <div>
            <label className="text-sm font-medium mb-1 block">Novo Parceiro</label>
            <select
              value={swapNewPartner}
              onChange={e => setSwapNewPartner(e.target.value)}
              className="w-full bg-secondary/50 border border-input rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Selecione...</option>
              {availableUsers.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} — {u.company}
                </option>
              ))}
            </select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSwapDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSwap} disabled={swapping}>
              {swapping && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Confirmar Troca
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
