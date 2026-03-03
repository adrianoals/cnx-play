"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { usePagination } from "@/hooks/use-pagination"
import { Pagination } from "@/components/ui/pagination"
import { fetchAllReferrals, updateReferralStatus } from "@/services/admin.service"
import type { SupabaseReferral } from "@/types"
import {
  Search, Calendar, MoreHorizontal, Clock, CheckCircle, XCircle,
  Loader2, Gift,
} from "lucide-react"

export default function AdminIndicacoesPage() {
  const { toast } = useToast()

  const [referrals, setReferrals] = useState<SupabaseReferral[]>([])
  const [loadingReferrals, setLoadingReferrals] = useState(true)
  const [referralSearch, setReferralSearch] = useState("")

  useEffect(() => {
    fetchAllReferrals()
      .then(r => setReferrals(r))
      .catch(err => {
        toast({ title: "Erro ao carregar indicações", description: err.message, variant: "destructive" })
      })
      .finally(() => setLoadingReferrals(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredReferrals = referrals.filter(r => {
    const term = referralSearch.toLowerCase()
    return (
      r.referredName.toLowerCase().includes(term) ||
      (r.referredEmail || "").toLowerCase().includes(term) ||
      (r.referrerName || "").toLowerCase().includes(term)
    )
  })

  const { paginatedItems: paginatedReferrals, currentPage, totalPages, setCurrentPage } = usePagination(filteredReferrals)

  const handleReferralStatusChange = async (id: string, newStatus: SupabaseReferral["status"]) => {
    try {
      await updateReferralStatus(id, newStatus)
      setReferrals(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r))
      toast({
        title: "Indicação atualizada",
        description: `Status alterado para ${newStatus === "completed" ? "Aprovado" : newStatus === "rejected" ? "Rejeitado" : "Pendente"}.`,
        className: newStatus === "completed" ? "bg-green-600 border-green-500 text-white" : "",
      })
    } catch (error) {
      toast({ title: "Erro", description: error instanceof Error ? error.message : "Falha ao alterar status.", variant: "destructive" })
    }
  }

  function getReferralStatusBadge(status: string) {
    switch (status) {
      case "completed":
        return <Badge className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border-emerald-500/20">Aprovado</Badge>
      case "rejected":
        return <Badge className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border-red-500/20">Rejeitado</Badge>
      default:
        return <Badge className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border-amber-500/20">Pendente</Badge>
    }
  }

  const formatDate = (dateStr: string) => {
    try { return new Date(dateStr).toLocaleDateString("pt-BR") } catch { return "N/A" }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Gift className="h-8 w-8 text-amber-500" /> Indicações
        </h1>
        <p className="text-muted-foreground">Gerencie todas as indicações dos usuários da plataforma.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-end">
        <div className="bg-card border border-border p-2 rounded-xl flex items-center gap-2 shadow-sm w-full md:w-80">
          <Search className="ml-2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar indicante ou indicado..."
            value={referralSearch}
            onChange={e => setReferralSearch(e.target.value)}
            className="bg-transparent border-none focus-visible:ring-0 placeholder:text-muted-foreground h-8"
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        {loadingReferrals ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-3 text-muted-foreground">Carregando indicações...</span>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Indicante</TableHead>
                  <TableHead className="text-muted-foreground">Indicado</TableHead>
                  <TableHead className="text-muted-foreground hidden md:table-cell">Contato</TableHead>
                  <TableHead className="text-muted-foreground text-center">Status</TableHead>
                  <TableHead className="text-muted-foreground hidden md:table-cell">Data</TableHead>
                  <TableHead className="text-right text-muted-foreground w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedReferrals.length > 0 ? (
                  paginatedReferrals.map(ref => (
                    <TableRow key={ref.id} className="border-border hover:bg-secondary/30 transition-colors">
                      <TableCell>
                        <span className="font-medium text-sm">{ref.referrerName || "—"}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm">{ref.referredName}</span>
                          <span className="text-xs text-muted-foreground">{ref.referredEmail || "—"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-sm">{ref.referredPhone || "—"}</span>
                      </TableCell>
                      <TableCell className="text-center">{getReferralStatusBadge(ref.status)}</TableCell>
                      <TableCell className="text-muted-foreground hidden md:table-cell">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-3 w-3" /> {formatDate(ref.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                              <span className="sr-only">Abrir menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Alterar Status</DropdownMenuLabel>
                            {ref.status !== "completed" && (
                              <DropdownMenuItem onClick={() => handleReferralStatusChange(ref.id, "completed")} className="cursor-pointer text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/20">
                                <CheckCircle className="mr-2 h-4 w-4" /> Aprovar
                              </DropdownMenuItem>
                            )}
                            {ref.status !== "rejected" && (
                              <DropdownMenuItem onClick={() => handleReferralStatusChange(ref.id, "rejected")} className="cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-950/20">
                                <XCircle className="mr-2 h-4 w-4" /> Rejeitar
                              </DropdownMenuItem>
                            )}
                            {ref.status !== "pending" && (
                              <DropdownMenuItem onClick={() => handleReferralStatusChange(ref.id, "pending")} className="cursor-pointer text-amber-400">
                                <Clock className="mr-2 h-4 w-4" /> Voltar para Pendente
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      {referralSearch ? "Nenhuma indicação encontrada." : "Nenhuma indicação cadastrada."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <div className="p-4 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-muted-foreground">
              <span>
                Mostrando {filteredReferrals.length === 0 ? 0 : (currentPage - 1) * 10 + 1}–{Math.min(currentPage * 10, filteredReferrals.length)} de {filteredReferrals.length}
                {" · "}{referrals.filter(r => r.status === "pending").length} pendente(s)
              </span>
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
