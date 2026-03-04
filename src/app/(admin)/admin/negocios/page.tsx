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
import { fetchAllDeals, updateDealStatus } from "@/services/admin.service"
import { useAuth } from "@/hooks/use-auth"
import type { SupabaseDeal } from "@/types"
import {
  Search, Calendar, MoreHorizontal, Clock, CheckCircle, XCircle,
  Loader2, Handshake,
} from "lucide-react"

export default function AdminNegociosPage() {
  const { toast } = useToast()
  const { user: authUser } = useAuth()

  const [deals, setDeals] = useState<SupabaseDeal[]>([])
  const [loadingDeals, setLoadingDeals] = useState(true)
  const [dealSearch, setDealSearch] = useState("")

  useEffect(() => {
    fetchAllDeals()
      .then(d => setDeals(d))
      .catch(err => {
        toast({ title: "Erro ao carregar negócios", description: err.message, variant: "destructive" })
      })
      .finally(() => setLoadingDeals(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredDeals = deals.filter(d => {
    const term = dealSearch.toLowerCase()
    return (
      d.companyName.toLowerCase().includes(term) ||
      (d.authorName || "").toLowerCase().includes(term) ||
      (d.authorCompanyName || "").toLowerCase().includes(term)
    )
  })

  const { paginatedItems: paginatedDeals, currentPage, totalPages, setCurrentPage } = usePagination(filteredDeals)

  const handleDealStatusChange = async (id: string, newStatus: SupabaseDeal["status"]) => {
    if (!authUser) return
    try {
      await updateDealStatus(id, newStatus, authUser.id)
      setDeals(prev => prev.map(d => d.id === id ? { ...d, status: newStatus } : d))
      toast({
        title: "Negócio atualizado",
        description: `Status alterado para ${newStatus === "approved" ? "Aprovado" : newStatus === "rejected" ? "Rejeitado" : "Pendente"}.`,
        className: newStatus === "approved" ? "bg-green-600 border-green-500 text-white" : "",
      })
    } catch (error) {
      toast({ title: "Erro", description: error instanceof Error ? error.message : "Falha ao alterar status.", variant: "destructive" })
    }
  }

  function getDealStatusBadge(status: string) {
    switch (status) {
      case "approved":
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

  const formatValue = (value: number) => {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Handshake className="h-8 w-8 text-green-500" /> Negócios
        </h1>
        <p className="text-muted-foreground">Gerencie e valide os negócios registrados pelos usuários.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-end">
        <div className="bg-card border border-border p-2 rounded-xl flex items-center gap-2 shadow-sm w-full md:w-80">
          <Search className="ml-2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar autor ou empresa..."
            value={dealSearch}
            onChange={e => setDealSearch(e.target.value)}
            className="bg-transparent border-none focus-visible:ring-0 placeholder:text-muted-foreground h-8"
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        {loadingDeals ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-3 text-muted-foreground">Carregando negócios...</span>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Autor</TableHead>
                  <TableHead className="text-muted-foreground">Empresa do Autor</TableHead>
                  <TableHead className="text-muted-foreground">Empresa Parceira</TableHead>
                  <TableHead className="text-muted-foreground hidden md:table-cell">Valor (R$)</TableHead>
                  <TableHead className="text-muted-foreground text-center">Status</TableHead>
                  <TableHead className="text-muted-foreground hidden md:table-cell">Data</TableHead>
                  <TableHead className="text-right text-muted-foreground w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedDeals.length > 0 ? (
                  paginatedDeals.map(deal => (
                    <TableRow key={deal.id} className="border-border hover:bg-secondary/30 transition-colors">
                      <TableCell>
                        <span className="font-medium text-sm">{deal.authorName || "—"}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-sm">{deal.authorCompanyName || "—"}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-sm">{deal.companyName}</span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-sm font-medium text-green-500">{formatValue(deal.value)}</span>
                      </TableCell>
                      <TableCell className="text-center">{getDealStatusBadge(deal.status)}</TableCell>
                      <TableCell className="text-muted-foreground hidden md:table-cell">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-3 w-3" /> {formatDate(deal.dealDate || deal.createdAt)}
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
                            {deal.status !== "approved" && (
                              <DropdownMenuItem onClick={() => handleDealStatusChange(deal.id, "approved")} className="cursor-pointer text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/20">
                                <CheckCircle className="mr-2 h-4 w-4" /> Aprovar
                              </DropdownMenuItem>
                            )}
                            {deal.status !== "rejected" && (
                              <DropdownMenuItem onClick={() => handleDealStatusChange(deal.id, "rejected")} className="cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-950/20">
                                <XCircle className="mr-2 h-4 w-4" /> Rejeitar
                              </DropdownMenuItem>
                            )}
                            {deal.status !== "pending" && (
                              <DropdownMenuItem onClick={() => handleDealStatusChange(deal.id, "pending")} className="cursor-pointer text-amber-400">
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
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      {dealSearch ? "Nenhum negócio encontrado." : "Nenhum negócio cadastrado."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <div className="p-4 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-muted-foreground">
              <span>
                Mostrando {filteredDeals.length === 0 ? 0 : (currentPage - 1) * 10 + 1}–{Math.min(currentPage * 10, filteredDeals.length)} de {filteredDeals.length}
                {" · "}{deals.filter(d => d.status === "pending").length} pendente(s)
              </span>
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
