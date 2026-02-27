"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { companies } from "@/data/mock-companies"
import { startConversation, addLike } from "@/services/messages.service"
import { Search, MapPin, Mail, MessageCircle, UserPlus, X } from "lucide-react"

interface Profile {
  id: number
  name: string
  companyName: string
  email: string
  segment: string
  location: string
  image: string | null
  type: "company_mock" | "user_real"
  description: string
}

export default function SearchPage() {
  const router = useRouter()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "")
  const [allProfiles, setAllProfiles] = useState<Profile[]>([])
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([])
  const [activeSegment, setActiveSegment] = useState("Todos")

  useEffect(() => {
    const mocks: Profile[] = companies.map(c => ({
      id: c.id,
      name: c.name,
      companyName: c.name,
      email: c.contact.email,
      segment: c.segment,
      location: c.location,
      image: c.image,
      type: "company_mock",
      description: c.description,
    }))

    const realUsers: Profile[] = JSON.parse(localStorage.getItem("users") || "[]").map(
      (u: { id: number; fullName?: string; companyName?: string; email?: string; segment?: string; address?: string; avatar?: string }) => ({
        id: u.id,
        name: u.fullName || "",
        companyName: u.companyName || "",
        email: u.email || "",
        segment: u.segment || "Diversos",
        location: u.address || "Brasil",
        image: u.avatar || null,
        type: "user_real" as const,
        description: u.companyName ? `Empresário na ${u.companyName}` : "Novo membro na plataforma",
      })
    )

    const currentUser = JSON.parse(localStorage.getItem("current_user") || "{}")
    const merged = [...mocks, ...realUsers].filter(p => p.id !== currentUser.id && p.email !== currentUser.email)
    setAllProfiles(merged)
  }, [])

  useEffect(() => {
    const term = searchTerm.toLowerCase()
    const results = allProfiles.filter(profile => {
      const matchText =
        (profile.name || "").toLowerCase().includes(term) ||
        (profile.companyName || "").toLowerCase().includes(term) ||
        (profile.email || "").toLowerCase().includes(term) ||
        (profile.segment || "").toLowerCase().includes(term)

      const matchSegment = activeSegment === "Todos" || profile.segment === activeSegment
      return matchText && matchSegment
    })
    setFilteredProfiles(results)
  }, [searchTerm, allProfiles, activeSegment])

  const handleStartChat = (profile: Profile) => {
    startConversation(profile.id)
    setTimeout(() => {
      router.push("/meetings")
      toast({
        title: "Conexão iniciada",
        description: `Você iniciou uma conversa com ${profile.companyName || profile.name}.`,
        className: "bg-blue-600 text-white",
      })
    }, 100)
  }

  const handleConnect = (profile: Profile) => {
    const result = addLike(profile.id)
    if (result.status === "match") {
      toast({
        title: "It's a Match!",
        description: "Vocês estão conectados. O chat foi aberto.",
        className: "bg-green-600 text-white",
      })
      router.push("/meetings")
    } else if (result.status === "liked") {
      toast({
        title: "Interesse Enviado",
        description: "Notificaremos se houver interesse mútuo.",
      })
    } else {
      toast({ description: "Você já enviou interesse para este perfil." })
    }
  }

  const uniqueSegments = ["Todos", ...new Set(allProfiles.map(p => p.segment).filter(Boolean))]

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Explorar Comunidade</h1>
          <p className="text-muted-foreground">Encontre parceiros, clientes e fornecedores.</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, e-mail, empresa ou segmento..."
              className="pl-10 h-12 text-lg bg-card border-border shadow-sm rounded-xl"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {uniqueSegments.slice(0, 10).map(segment => (
            <Badge
              key={segment}
              variant={activeSegment === segment ? "default" : "outline"}
              className={`cursor-pointer px-4 py-2 text-sm whitespace-nowrap rounded-lg transition-all ${
                activeSegment === segment
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-card hover:bg-muted"
              }`}
              onClick={() => setActiveSegment(segment)}
            >
              {segment}
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredProfiles.length > 0 ? (
          filteredProfiles.map(profile => (
            <div key={`${profile.type}-${profile.id}`} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col h-full">
              <div className="relative h-32 bg-gradient-to-r from-blue-900/20 to-purple-900/20">
                <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-semibold border border-border">
                  {profile.segment}
                </div>
              </div>

              <div className="px-6 relative flex-1 flex flex-col">
                <div className="absolute -top-12 left-6">
                  <Avatar className="w-24 h-24 border-4 border-card shadow-lg">
                    <AvatarImage src={profile.image || undefined} className="object-cover" />
                    <AvatarFallback className="text-2xl font-bold bg-muted text-muted-foreground">
                      {profile.companyName ? profile.companyName.charAt(0) : profile.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <div className="mt-14 mb-4">
                  <h3 className="text-xl font-bold truncate" title={profile.companyName || profile.name}>
                    {profile.companyName || profile.name}
                  </h3>
                  {profile.type === "user_real" && profile.companyName && (
                    <p className="text-sm text-primary font-medium">{profile.name}</p>
                  )}
                  <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">{profile.location}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground text-xs mt-1" title={profile.email}>
                    <Mail className="h-3 w-3" />
                    <span className="truncate max-w-[200px]">{profile.email}</span>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2 mb-6 flex-1">{profile.description}</p>

                <div className="flex gap-3 mb-6">
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white gap-2" onClick={() => handleStartChat(profile)}>
                    <MessageCircle className="h-4 w-4" />
                    Mensagem
                  </Button>
                  <Button variant="outline" className="flex-1 gap-2" onClick={() => handleConnect(profile)}>
                    <UserPlus className="h-4 w-4" />
                    Conectar
                  </Button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Nenhum resultado encontrado</h3>
            <p className="text-muted-foreground max-w-md">
              Não encontramos perfis com &quot;{searchTerm}&quot; no segmento {activeSegment}. Tente outros termos.
            </p>
            <Button
              variant="link"
              onClick={() => { setSearchTerm(""); setActiveSegment("Todos") }}
              className="mt-4"
            >
              Limpar filtros
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
