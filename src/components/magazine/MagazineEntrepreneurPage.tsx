import React from "react"
import type { MagazineEntrepreneur } from "@/types"

interface Props {
  entrepreneur: MagazineEntrepreneur
  pageNumber: number
}

export const MagazinePhotoPage = React.forwardRef<HTMLDivElement, Props>(
  function MagazinePhotoPage({ entrepreneur }, ref) {
    return (
      <div ref={ref} className="magazine-page bg-slate-900 relative overflow-hidden">
        {/* Full photo — absolute para preencher 100% da pagina */}
        <img
          src={entrepreneur.photoUrl}
          alt={entrepreneur.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 text-white">
            <h2 className="text-2xl md:text-3xl font-bold leading-tight">{entrepreneur.name}</h2>
            <p className="text-sm md:text-base text-white/80 mt-1">{entrepreneur.roleTitle}</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-1 h-5 bg-blue-500 rounded-full" />
              <p className="text-sm text-blue-300 font-medium">{entrepreneur.companyName}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }
)

export const MagazineTextPage = React.forwardRef<HTMLDivElement, Props>(
  function MagazineTextPage({ entrepreneur, pageNumber }, ref) {
    return (
      <div ref={ref} className="magazine-page bg-[#0a1628] flex flex-col relative overflow-hidden">
        {/* Top accent */}
        <div className="h-1 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 shrink-0" />

        {/* Inner margin — simula pagina de revista */}
        <div className="flex-1 m-3 md:m-5 rounded-lg border border-slate-700/50 bg-[#0d1d33] p-5 md:p-6 flex flex-col overflow-hidden">
          <div className="space-y-4 flex-1">
            {/* Name */}
            <div>
              <h2 className="text-lg md:text-xl font-bold text-white leading-tight">{entrepreneur.name}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{entrepreneur.roleTitle}</p>
            </div>

            {/* Company */}
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-blue-500 rounded-full shrink-0" />
              <p className="text-sm font-semibold text-blue-400">{entrepreneur.companyName}</p>
            </div>

            {/* Bio */}
            <p className="text-sm leading-relaxed text-slate-300">
              {entrepreneur.bio}
            </p>

            {/* Institutional text */}
            {entrepreneur.institutionalText && (
              <div className="border-l-2 border-blue-500/40 pl-4">
                <p className="text-xs leading-relaxed text-slate-400 italic">
                  &ldquo;{entrepreneur.institutionalText}&rdquo;
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-700/50 mt-auto">
            <span className="text-xs text-slate-500">Conexao Play</span>
            <span className="text-xs text-slate-500">{pageNumber}</span>
          </div>
        </div>
      </div>
    )
  }
)
