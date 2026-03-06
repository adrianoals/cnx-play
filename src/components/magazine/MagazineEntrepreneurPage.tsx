import React from "react"
import type { MagazineEntrepreneur } from "@/types"

interface Props {
  entrepreneur: MagazineEntrepreneur
  pageNumber: number
}

const MagazineEntrepreneurPage = React.forwardRef<HTMLDivElement, Props>(
  function MagazineEntrepreneurPage({ entrepreneur, pageNumber }, ref) {
    return (
      <div ref={ref} className="magazine-page bg-white flex flex-col relative overflow-hidden">
        {/* Top accent */}
        <div className="h-1 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 shrink-0" />

        {/* Photo section */}
        <div className="relative h-[40%] shrink-0 overflow-hidden bg-slate-100">
          <img
            src={entrepreneur.photoUrl}
            alt={entrepreneur.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-6 right-6 text-white">
            <h2 className="text-xl md:text-2xl font-bold leading-tight truncate">{entrepreneur.name}</h2>
            <p className="text-sm text-white/80 truncate">{entrepreneur.roleTitle}</p>
          </div>
        </div>

        {/* Content section */}
        <div className="flex-1 p-6 flex flex-col justify-between overflow-hidden">
          <div className="space-y-4">
            {/* Company */}
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-blue-600 rounded-full shrink-0" />
              <p className="text-sm font-semibold text-blue-600 truncate">{entrepreneur.companyName}</p>
            </div>

            {/* Bio */}
            <p className="text-sm leading-relaxed text-slate-700 line-clamp-6">
              {entrepreneur.bio}
            </p>

            {/* Institutional text */}
            {entrepreneur.institutionalText && (
              <div className="border-l-2 border-blue-300 pl-4">
                <p className="text-xs leading-relaxed text-slate-500 italic line-clamp-5">
                  &ldquo;{entrepreneur.institutionalText}&rdquo;
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 mt-auto">
            <span className="text-xs text-slate-400">Conexao Play</span>
            <span className="text-xs text-slate-400">{pageNumber}</span>
          </div>
        </div>
      </div>
    )
  }
)

export default MagazineEntrepreneurPage
