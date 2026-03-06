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
        <div className="flex-1 m-3 md:m-4 rounded-lg border border-slate-700/50 bg-[#0d1d33] p-4 md:p-5 flex flex-col overflow-hidden">
          <div className="space-y-3 flex-1">
            {/* Header compacto: nome · cargo · empresa */}
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-white leading-tight">{entrepreneur.name}</h2>
              <span className="text-xs text-slate-500">·</span>
              <span className="text-xs text-slate-400">{entrepreneur.roleTitle}</span>
              <span className="text-xs text-slate-500">·</span>
              <span className="text-xs font-semibold text-blue-400">{entrepreneur.companyName}</span>
            </div>

            {/* Bio */}
            <p className="text-xs leading-relaxed text-slate-300">
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
          <div className="flex items-center justify-between pt-2 border-t border-slate-700/50 mt-auto">
            {entrepreneur.instagram ? (() => {
              const ig = entrepreneur.instagram!
              const isUrl = ig.startsWith('http')
              const href = isUrl ? ig : `https://www.instagram.com/${ig.replace(/^@/, '')}`
              const label = isUrl ? `@${ig.split('/').filter(Boolean).pop()?.split('?')[0]}` : ig.startsWith('@') ? ig : `@${ig}`
              return (
                <a href={href} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} onTouchEnd={(e) => e.stopPropagation()} className="flex items-center gap-1.5 hover:opacity-80 transition-opacity relative z-10">
                  <svg className="h-3.5 w-3.5 text-pink-400 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                  <span className="text-[10px] text-pink-400 underline underline-offset-2">{label}</span>
                </a>
              )
            })() : <span />}
            <span className="text-xs text-slate-500">{pageNumber}</span>
          </div>
        </div>
      </div>
    )
  }
)
