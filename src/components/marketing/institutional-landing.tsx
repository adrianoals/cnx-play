"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import {
  ArrowRight,
  Building2,
  Crown,
  Instagram,
  Network,
  ShieldCheck,
  Sparkles,
  Star,
  Users2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { CompanyLogo } from "@/components/marketing/company-logo"
import { WelcomeOverlay } from "@/components/marketing/welcome-overlay"

const entrepreneurs = [
  {
    name: "Lucrecchia",
    role: "Fundador & Visionário",
    handle: "@lucrecchia",
    image: "/landing/lucrecchia.jpg",
    quote: "Construindo pontes onde outros veem abismos. O futuro pertence a quem conecta.",
    isFounder: true,
  },
  {
    name: "Danni Sarturi",
    role: "Estrategista de Imagem",
    handle: "@dannisarturi",
    image: "/landing/danni-sarturi.jpg",
    quote: "Sua marca pessoal é a moeda mais valiosa do novo mercado.",
  },
  {
    name: "Dr. Lucas Luquetti",
    role: "Referência em Saúde",
    handle: "@dr.lucasluquettioficial",
    image: "/landing/lucas-luquetti.jpg",
    quote: "Alta performance começa de dentro para fora. Saúde é o pilar do sucesso.",
  },
  {
    name: "Greice Marin",
    role: "Liderança Feminina",
    handle: "@greicemarin",
    image: "/landing/greice-marin.jpg",
    quote: "Empoderamento através da ação. Transformando desafios em degraus.",
  },
  {
    name: "Sua Empresa Aqui!",
    role: "Seja um Parceiro",
    handle: "@companyconexaoplay",
    image: "",
    quote: "Expanda sua rede, conecte-se com líderes e multiplique suas oportunidades.",
    isPartnership: true,
  },
]

const features = [
  {
    icon: Users2,
    title: "Conexões Curadas",
    desc: "Perfis verificados e selecionados para gerar mais sinergia e menos ruído.",
  },
  {
    icon: Building2,
    title: "Oportunidades Reais",
    desc: "Um ambiente focado em negócios, parcerias e relacionamento comercial consistente.",
  },
  {
    icon: ShieldCheck,
    title: "Exclusividade",
    desc: "Uma experiência pensada para decisores, fundadores e lideranças de mercado.",
  },
]

const fallingParticles = Array.from({ length: 28 }, (_, index) => ({
  id: index,
  left: `${(index * 3.7) % 100}%`,
  size: 2 + (index % 4),
  duration: 8 + (index % 6),
  delay: (index % 7) * 0.6,
  opacity: 0.18 + (index % 5) * 0.07,
  color:
    index % 4 === 0
      ? "bg-blue-300"
      : index % 4 === 1
        ? "bg-purple-300"
        : index % 4 === 2
          ? "bg-pink-300"
          : "bg-white",
}))

function FloatingAccent({
  className,
  delay = 0,
  duration = 6,
  children,
}: {
  className: string
  delay?: number
  duration?: number
  children: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: [0, -12, 0] }}
      transition={{ duration, delay, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function InstitutionalLanding() {
  return (
    <div className="min-h-screen overflow-hidden bg-slate-950 font-sans text-white selection:bg-primary/20">
      <WelcomeOverlay />
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {fallingParticles.map((particle) => (
          <div
            key={particle.id}
            className={`absolute top-[-5%] rounded-full blur-[1px] ${particle.color} animate-fall`}
            style={{
              left: particle.left,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              opacity: particle.opacity,
              animationDuration: `${particle.duration}s`,
              animationDelay: `${particle.delay}s`,
            }}
          />
        ))}
      </div>

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] h-[50%] w-[50%] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute right-[-10%] bottom-[-20%] h-[50%] w-[50%] rounded-full bg-purple-600/10 blur-[120px]" />
        <div className="absolute top-[10%] left-[42%] h-40 w-40 rounded-full bg-pink-500/8 blur-[90px]" />
        <div className="absolute right-[18%] bottom-[18%] h-36 w-36 rounded-full bg-amber-500/8 blur-[90px]" />
      </div>

      <div className="pointer-events-none absolute inset-0 z-0 hidden lg:block">
        <FloatingAccent className="absolute top-28 left-[6%]" delay={0.2} duration={5.5}>
          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-3 shadow-lg shadow-blue-500/10 backdrop-blur-sm">
            <Network className="h-6 w-6 text-blue-400" />
          </div>
        </FloatingAccent>
        <FloatingAccent className="absolute top-40 right-[9%]" delay={0.5} duration={6.2}>
          <div className="rounded-2xl border border-purple-500/20 bg-purple-500/10 p-3 shadow-lg shadow-purple-500/10 backdrop-blur-sm">
            <Sparkles className="h-6 w-6 text-purple-400" />
          </div>
        </FloatingAccent>
        <FloatingAccent className="absolute top-[34rem] left-[12%]" delay={0.8} duration={6.8}>
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 shadow-lg shadow-amber-500/10 backdrop-blur-sm">
            <Star className="h-6 w-6 text-amber-400" />
          </div>
        </FloatingAccent>
      </div>

      <nav className="relative z-10 container mx-auto flex h-20 items-center justify-between px-6 py-4">
        <CompanyLogo />

        <div className="hidden gap-4 md:flex">
          <Button
            asChild
            className="h-10 border border-white/10 bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 font-semibold text-white shadow-lg hover:from-blue-700 hover:to-purple-700"
          >
            <Link href="#visionarios">Os 55 Empresários</Link>
          </Button>
          <Button asChild variant="ghost" className="text-slate-300 hover:bg-white/5 hover:text-white">
            <Link href="/register">Planos</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="border-slate-700 bg-transparent text-slate-300 hover:bg-white/5 hover:text-white"
          >
            <Link href="/login">Entrar</Link>
          </Button>
        </div>
      </nav>

      <main className="relative z-10 flex flex-col items-center px-6 pt-10 pb-20 text-center md:pt-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mx-auto max-w-4xl space-y-6"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-slate-900/70 px-4 py-2 shadow-[0_0_15px_rgba(168,85,247,0.15)] backdrop-blur-md"
          >
            <Sparkles className="h-4 w-4 animate-pulse text-blue-400" />
            <span className="text-sm font-medium tracking-wide text-blue-100">
              Plataforma de networking premium
            </span>
            <span className="ml-1 h-1.5 w-1.5 animate-pulse rounded-full bg-pink-500" />
          </motion.div>

          <h2 className="text-xl font-semibold text-white md:text-2xl">
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Conecte-se com mais intenção.
            </span>
            <br />
            <span className="mt-2 block text-3xl font-bold tracking-tight text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.15)] md:text-4xl">
              O melhor networking é aquele que gera próximo passo.
            </span>
          </h2>

          <h1 className="text-3xl font-bold leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
            <span className="bg-300% block animate-gradient bg-gradient-to-r from-blue-400 via-white to-pink-400 bg-clip-text text-transparent">
              80% dos resultados
            </span>
            <span className="mt-1 block">vêm de quem nos conecta</span>
          </h1>

          <p className="mx-auto max-w-2xl text-lg font-light leading-relaxed text-slate-400 md:text-xl">
            A Conecta Play eleva o padrão das conexões corporativas para empresários, líderes e
            visionários que querem acelerar relacionamento, prospecção e parcerias.
          </p>

          <div className="mt-6 mb-12 flex w-full flex-col items-center justify-center gap-4 sm:w-auto sm:flex-row">
            <Button
              asChild
              className="h-12 w-full rounded-full bg-white px-8 text-base font-semibold text-slate-950 shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all duration-300 hover:bg-slate-200 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] sm:w-auto"
            >
              <Link href="/login">
                Acessar plataforma
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="h-12 w-full rounded-full border-slate-700 bg-transparent px-8 text-base text-white transition-all duration-300 hover:bg-slate-800/50 hover:text-white sm:w-auto"
            >
              <Link href="/register">Solicitar convite</Link>
            </Button>

            <Button
              asChild
              className="h-12 w-full rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-8 text-base font-bold text-white shadow-lg shadow-purple-900/20 transition-all duration-300 hover:from-purple-700 hover:to-pink-700 sm:w-auto"
            >
              <Link href="/register">Quero entrar agora</Link>
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mx-auto mb-24 grid w-full max-w-5xl grid-cols-1 gap-6 md:grid-cols-3"
        >
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group relative overflow-hidden rounded-2xl border border-slate-800/50 bg-slate-900/30 p-5 text-left backdrop-blur-sm transition-colors hover:bg-slate-800/40 md:text-center"
            >
              <div className="absolute top-0 right-0 p-2 opacity-10 transition-opacity group-hover:opacity-20">
                <Sparkles className="h-12 w-12 text-white transition-transform duration-300 group-hover:scale-110" />
              </div>
              <feature.icon className="relative z-10 mx-0 mb-3 h-6 w-6 text-blue-400 md:mx-auto" />
              <h3 className="relative z-10 mb-1 text-base font-semibold text-white">{feature.title}</h3>
              <p className="relative z-10 text-sm leading-relaxed text-slate-400">{feature.desc}</p>
            </div>
          ))}
        </motion.div>

        <section
          id="visionarios"
          className="relative mx-auto w-full max-w-7xl border-t border-slate-800/50 px-4 py-16"
        >
          <div className="mb-12 text-center">
            <span className="mb-2 flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-wider text-amber-500">
              <Star className="h-4 w-4" />
              Top 55 Visionários
              <Star className="h-4 w-4" />
            </span>
            <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">Empresários para conhecer</h2>
            <p className="mx-auto max-w-2xl text-slate-400">
              Conheça líderes que já estão moldando novas oportunidades de negócio dentro da
              comunidade.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {entrepreneurs.map((person, idx) => (
              <motion.div
                key={person.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 transition-all hover:-translate-y-1 hover:border-slate-700"
              >
                <div className="relative aspect-[4/5] w-full overflow-hidden">
                  <div className="absolute inset-0 z-10 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80" />

                  {person.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={person.image}
                      alt={person.name}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600 text-white">
                      <Sparkles className="h-16 w-16 opacity-50" />
                    </div>
                  )}

                  {person.isFounder ? (
                    <div className="absolute top-3 right-3 z-20 flex items-center gap-1 rounded bg-amber-500/90 px-2 py-1 text-[10px] font-bold text-white shadow-lg backdrop-blur-sm">
                      <Crown className="h-3 w-3 fill-current" />
                      FOUNDER
                    </div>
                  ) : null}

                  <div className="absolute bottom-0 left-0 z-20 w-full p-4 text-left">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-400">
                      {person.role}
                    </p>
                    <h3 className="mb-2 text-xl font-bold leading-tight text-white">{person.name}</h3>
                    <p className="mb-4 border-l-2 border-amber-500 pl-2 text-xs leading-relaxed text-slate-300 opacity-90">
                      &quot;{person.quote}&quot;
                    </p>

                    <a
                      href={`https://instagram.com/${person.handle.replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs font-medium text-white backdrop-blur-md transition-colors hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-600"
                    >
                      <Instagram className="h-3 w-3" />
                      {person.handle}
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Button
              asChild
              className="rounded-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 px-8 py-6 text-base font-semibold text-white shadow-lg shadow-blue-900/20 transition-all duration-300 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 hover:shadow-xl"
            >
              <Link href="/revista">
                Quero ver todos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="relative z-10 mt-auto py-6 text-center text-xs text-slate-600">
        <p>&copy; {new Date().getFullYear()} Conecta Empresários. Todos os direitos reservados.</p>
        <p className="mt-1 text-slate-700">Networking profissional inteligente.</p>
      </footer>
    </div>
  )
}
