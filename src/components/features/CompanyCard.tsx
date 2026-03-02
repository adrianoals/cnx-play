"use client"

import type { LocalCompany } from "@/types"
import { Building2, MapPin, Image as ImageIcon, Pencil, Trash2, Star } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CompanyCardProps {
  company: LocalCompany
  onEdit: (company: LocalCompany) => void
  onDelete: (companyId: string) => void
}

export default function CompanyCard({ company, onEdit, onDelete }: CompanyCardProps) {
  return (
    <div className="bg-secondary/30 border border-border rounded-2xl p-5 hover:bg-secondary/50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="p-2 bg-purple-500/10 rounded-xl shrink-0">
            <Building2 className="h-5 w-5 text-purple-500" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-foreground truncate">{company.name}</h3>
              {company.isPrimary && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center gap-1 shrink-0">
                  <Star className="h-2.5 w-2.5" /> Principal
                </span>
              )}
            </div>
            {company.cnpj && (
              <p className="text-xs text-muted-foreground mt-0.5">CNPJ: {company.cnpj}</p>
            )}
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {company.category && (
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md">{company.category}</span>
              )}
              {company.location && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {company.location}
                </span>
              )}
              {company.gallery.length > 0 && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <ImageIcon className="h-3 w-3" /> {company.gallery.length} foto{company.gallery.length > 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => onEdit(company)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => onDelete(company.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
