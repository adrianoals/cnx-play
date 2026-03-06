import React from "react"

const MagazineBackCover = React.forwardRef<HTMLDivElement>(function MagazineBackCover(_props, ref) {
  return (
    <div ref={ref} className="magazine-page bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center text-white p-8 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full" style={{
          backgroundImage: "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.08) 0%, transparent 60%)",
        }} />
      </div>

      <div className="relative z-10 text-center space-y-8">
        <div className="space-y-3">
          <div className="w-16 h-16 mx-auto rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
            <span className="text-2xl font-bold text-primary">C</span>
          </div>
          <h2 className="text-2xl font-bold">Conexao Play</h2>
          <div className="w-12 h-0.5 bg-primary mx-auto" />
        </div>

        <div className="space-y-2 text-sm text-slate-400">
          <p>Conectando empresarios,</p>
          <p>gerando negocios.</p>
        </div>

        <div className="space-y-1 text-xs text-slate-500">
          <p>www.conexaoplay.com.br</p>
          <p>contato@conexaoplay.com.br</p>
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-primary/80 to-primary" />
    </div>
  )
})

export default MagazineBackCover
