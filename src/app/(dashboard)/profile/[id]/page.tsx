"use client"

import { useMemo, use } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, Building2, MapPin, Mail, Phone, Share2, MessageCircle, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { companies } from "@/data/mock-companies"
import { getAllCompanies } from "@/services/company.service"

interface ProfileUser {
  id: number | string
  fullName: string
  companyName: string
  segment?: string
  description?: string
  contact?: { email: string; phone: string; linkedin?: string }
  avatar?: string | null
  gallery?: string[]
  phone?: string
  email?: string
  address?: string
  isMock?: boolean
}

function resolveProfile(id: string): ProfileUser | null {
  // Try mock companies first
  const mockCompany = companies.find(c => c.id?.toString() === id)
  if (mockCompany) {
    return {
      id: mockCompany.id,
      fullName: mockCompany.name,
      companyName: mockCompany.name,
      segment: mockCompany.segment,
      description: mockCompany.description,
      contact: mockCompany.contact,
      avatar: mockCompany.image,
      gallery: [mockCompany.image],
      isMock: true,
    }
  }

  if (typeof window === "undefined") return null

  // Try real companies from localStorage (legacy)
  const realCompanies = getAllCompanies()
  const realCompany = realCompanies.find(c => c.id?.toString() === id)
  if (realCompany) {
    const allUsers = JSON.parse(localStorage.getItem("users") || "[]")
    const owner = allUsers.find((u: { id: string }) => String(u.id) === String(realCompany.userId))
    return {
      id: realCompany.id,
      fullName: realCompany.name,
      companyName: realCompany.name,
      segment: realCompany.category,
      description: realCompany.description,
      contact: {
        email: realCompany.contactEmail || "",
        phone: realCompany.contactPhone || "",
        linkedin: realCompany.linkedin,
      },
      avatar: owner?.avatar || null,
      gallery: realCompany.gallery,
      phone: realCompany.contactPhone,
      email: realCompany.contactEmail,
      address: realCompany.location,
    }
  }

  // Fallback: try registered users (legacy)
  const allUsers = JSON.parse(localStorage.getItem("users") || "[]")
  const registeredUser = allUsers.find((u: { id: string }) => String(u.id) === id) as ProfileUser | undefined
  return registeredUser ?? null
}

export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { toast } = useToast()

  const user = useMemo(() => resolveProfile(id), [id])
  const loading = false

  const handleShare = async () => {
    const url = window.location.href
    const title = `Confira o perfil de ${user?.fullName || "um parceiro"} no ConectaPlay`

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: `Veja este perfil profissional: ${user?.companyName}`,
          url,
        })
      } catch { /* user cancelled */ }
    } else {
      navigator.clipboard.writeText(url)
      toast({
        title: "Link copiado!",
        description: "A URL do perfil foi copiada para sua área de transferência.",
        className: "bg-green-600 text-white",
      })
    }
  }

  const handleWhatsAppShare = () => {
    const url = encodeURIComponent(window.location.href)
    const text = encodeURIComponent(`Olha esse perfil interessante que encontrei no ConectaPlay: ${user?.companyName || user?.fullName}`)
    window.open(`https://wa.me/?text=${text} ${url}`, "_blank")
  }

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center">Carregando...</div>
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">Perfil não encontrado</h1>
        <Button onClick={() => router.push("/dashboard")}>Voltar ao Início</Button>
      </div>
    )
  }

  const phone = user.phone || user.contact?.phone || ""
  const cleanPhone = phone.replace(/\D/g, "")
  const email = user.email || user.contact?.email || ""

  return (
    <div className="pb-12 -m-4 md:-m-6 lg:-m-8">
      {/* Hero Cover */}
      <div className="h-64 md:h-80 w-full bg-gradient-to-r from-blue-900 to-purple-900 relative">
        <div className="absolute inset-0 bg-black/20" />
        <Button
          variant="ghost"
          className="absolute top-4 left-4 text-white hover:bg-white/10 z-10"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative -mt-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-xl relative z-10"
        >
          <div className="flex flex-col md:flex-row items-start md:items-end gap-6 pb-6 border-b border-border">
            <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-background shadow-lg rounded-2xl">
              <AvatarImage src={user.avatar || undefined} className="object-cover" />
              <AvatarFallback className="text-4xl bg-primary/20 text-primary rounded-2xl">
                {user.fullName ? user.fullName[0] : "U"}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-bold">{user.fullName}</h1>
                <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-xs font-bold uppercase tracking-wider border border-blue-500/20">
                  {user.segment || "Empresário"}
                </span>
              </div>
              <p className="text-lg text-muted-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {user.companyName}
              </p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground pt-1">
                {user.address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {user.address}
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
              <Button variant="outline" size="icon" onClick={handleShare} title="Compartilhar">
                <Share2 className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                onClick={handleWhatsAppShare}
                title="WhatsApp"
              >
                <MessageCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-8">
            {/* Left: About & Contact */}
            <div className="space-y-8">
              <section>
                <h2 className="text-lg font-bold mb-4">Sobre</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {user.description || "Este usuário ainda não adicionou uma descrição detalhada sobre suas atividades e empresa."}
                </p>
              </section>

              <section className="bg-secondary/30 rounded-2xl p-6 border border-border">
                <h2 className="text-lg font-bold mb-4">Contato</h2>
                <div className="space-y-4">
                  {email && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center border border-border">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <span className="text-sm break-all">{email}</span>
                    </div>
                  )}
                  {cleanPhone && (
                    <a href={`https://wa.me/55${cleanPhone}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 hover:text-green-600 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center border border-border">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <span className="text-sm font-medium">WhatsApp Profissional</span>
                    </a>
                  )}
                  <div className="flex gap-2 mt-4">
                    <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => window.open(`https://wa.me/55${cleanPhone}`, "_blank")}>
                      <MessageCircle className="mr-2 h-4 w-4" /> Chamar
                    </Button>
                  </div>
                </div>
              </section>
            </div>

            {/* Right: Gallery */}
            <div className="lg:col-span-2">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Globe className="h-5 w-5 text-purple-500" /> Portfólio & Galeria
              </h2>

              {user.gallery && user.gallery.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {user.gallery.map((img, idx) => (
                    <div key={idx} className="group relative aspect-video bg-secondary rounded-xl overflow-hidden border border-border shadow-sm hover:shadow-md transition-all">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt={`Work ${idx}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                        <span className="text-white text-sm font-medium">Visualizar</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-muted/30 border border-dashed border-border rounded-xl p-12 text-center text-muted-foreground">
                  <p>Nenhuma imagem disponível na galeria.</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
