import React from "react"

const MagazineCover = React.forwardRef<HTMLDivElement>(function MagazineCover(_props, ref) {
  return (
    <div ref={ref} className="magazine-page bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center text-white p-8 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full" style={{
          backgroundImage: "radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(255,255,255,0.05) 0%, transparent 50%)",
        }} />
      </div>

      {/* Top accent line */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-primary/80 to-primary" />

      <div className="relative z-10 text-center space-y-6">
        <img src="/icon.svg" alt="Conexao Play" className="w-20 h-20 mx-auto" />

        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Revista Digital</h1>
          <div className="w-16 h-0.5 bg-primary mx-auto" />
        </div>

        <p className="text-sm text-slate-400 max-w-[200px] mx-auto leading-relaxed">
          Conheca os empresarios que fazem parte da nossa rede de negocios
        </p>
      </div>

      {/* Bottom accent */}
      <div className="absolute bottom-6 left-0 w-full text-center">
        <p className="text-xs text-slate-500 uppercase tracking-widest">Edicao Digital</p>
      </div>
    </div>
  )
})

export default MagazineCover
