import React from "react"

const MagazineCover = React.forwardRef<HTMLDivElement>(function MagazineCover(_props, ref) {
  return (
    <div ref={ref} className="magazine-page relative overflow-hidden">
      {/* Background photo */}
      <img
        src="/revista/vagner-miramontes.jpeg"
        alt="Vagner Miramontes"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/80" />

      {/* Top accent line */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-between p-6 md:p-8">
        {/* Top: Logo + Title */}
        <div className="text-center space-y-3">
          <img src="/icon.svg" alt="Conexao Play" className="w-14 h-14 mx-auto drop-shadow-lg" />
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-blue-300 font-medium">Conexão Play apresenta</p>
          </div>
        </div>

        {/* Center: Main title */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none drop-shadow-lg">
            Os 55
          </h1>
          <h2 className="text-xl md:text-2xl font-bold text-white/90 tracking-wide">
            Empresários
          </h2>
          <div className="w-16 h-0.5 bg-blue-400 mx-auto mt-2" />
          <p className="text-xs text-slate-300 max-w-[220px] mx-auto leading-relaxed mt-2">
            Conheça os empresários que fazem parte da nossa rede de negócios
          </p>
        </div>

        {/* Bottom: Featured entrepreneur */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-1 h-8 bg-blue-400 rounded-full" />
            <div>
              <p className="text-sm font-bold text-white">Vagner Miramontes</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Capa desta edição</p>
            </div>
          </div>
          <a
            href="https://www.instagram.com/vagnermiramontes"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 ml-3 hover:opacity-80 transition-opacity relative z-10"
          >
            <svg className="h-3 w-3 text-pink-400 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            <span className="text-[10px] text-pink-400 underline underline-offset-2">@vagnermiramontes</span>
          </a>

          {/* Edition badge */}
          <div className="flex justify-end">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest">Edição Digital • 2025</span>
          </div>
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500" />
    </div>
  )
})

export default MagazineCover
