"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { getMatches, getMessages, sendMessage } from "@/services/messages.service"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send, Search, ArrowLeft, Phone, Video, Info } from "lucide-react"
import type { Message } from "@/types"

interface MatchWithCompany {
  id: number
  user1Id: string
  user2Id: string
  timestamp: string
  source: string
  company: {
    id: number | string
    name: string
    image?: string | null
    segment?: string
  }
}

export default function MeetingsPage() {
  const router = useRouter()
  const [matches, setMatches] = useState<MatchWithCompany[]>([])
  const [selectedMatch, setSelectedMatch] = useState<MatchWithCompany | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const currentUser = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("current_user") || "{}") : {}

  const loadData = () => {
    const loadedMatches = getMatches()
    setMatches(loadedMatches)

    if (selectedMatch) {
      const msgs = getMessages(selectedMatch.id)
      setMessages(msgs)
    }
  }

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 2000)

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "social_messages" || e.key === "social_matches") loadData()
    }
    window.addEventListener("storage", handleStorageChange)

    return () => {
      clearInterval(interval)
      window.removeEventListener("storage", handleStorageChange)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMatch])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length, selectedMatch])

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || !selectedMatch) return

    const newMsg = sendMessage(selectedMatch.id, inputText)
    setMessages(prev => [...prev, newMsg])
    setInputText("")
  }

  return (
    <div className="flex h-[calc(100vh-5rem)] bg-background overflow-hidden -m-4 md:-m-6 lg:-m-8 rounded-none">
      {/* Sidebar / Match List */}
      <div className={`w-full md:w-80 border-r border-border bg-card flex flex-col ${selectedMatch ? "hidden md:flex" : "flex"}`}>
        <div className="p-4 border-b border-border flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")} className="md:hidden text-muted-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-bold text-foreground text-lg">Mensagens</h1>
        </div>

        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="bg-secondary border-border pl-9 placeholder:text-muted-foreground" placeholder="Buscar conversa..." />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {matches.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">
              <p className="mb-4">Você ainda não tem conexões.</p>
              <Button onClick={() => router.push("/search")} variant="outline" className="w-full">
                Explorar Comunidade
              </Button>
            </div>
          ) : (
            matches.map(match => (
              <div
                key={match.id}
                onClick={() => setSelectedMatch(match)}
                className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-secondary/50 transition-colors border-b border-border/50 ${selectedMatch?.id === match.id ? "bg-secondary border-l-4 border-l-blue-500" : ""}`}
              >
                <Avatar className="h-12 w-12 border border-border">
                  <AvatarImage src={match.company.image || undefined} />
                  <AvatarFallback>{match.company.name ? match.company.name.substring(0, 2).toUpperCase() : "??"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-foreground truncate text-sm">{match.company.name}</h3>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider whitespace-nowrap ml-2">
                      {new Date(match.timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-1">
                    {match.source === "daily" ? "Match Diário" : "Conexão Direta"}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col bg-background ${!selectedMatch ? "hidden md:flex" : "flex"}`}>
        {selectedMatch ? (
          <>
            <div className="h-16 border-b border-border flex items-center justify-between px-4 bg-card/50 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => setSelectedMatch(null)} className="md:hidden text-muted-foreground -ml-2">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <Avatar className="h-10 w-10 border border-border">
                  <AvatarImage src={selectedMatch.company.image || undefined} />
                  <AvatarFallback>{selectedMatch.company.name ? selectedMatch.company.name.substring(0, 2) : "CN"}</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-semibold text-foreground leading-none text-sm md:text-base">{selectedMatch.company.name}</h2>
                  <span className="text-xs text-green-400 flex items-center gap-1 mt-1">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" /> Online agora
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Button variant="ghost" size="icon" className="hidden sm:inline-flex"><Phone className="w-5 h-5" /></Button>
                <Button variant="ghost" size="icon" className="hidden sm:inline-flex"><Video className="w-5 h-5" /></Button>
                <Button variant="ghost" size="icon"><Info className="w-5 h-5" /></Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/50">
              <div className="text-center py-8">
                <p className="text-muted-foreground text-xs uppercase tracking-widest mb-2">Início da Conexão</p>
                <div className="bg-card inline-block px-4 py-2 rounded-full text-sm text-foreground border border-border">
                  Você conectou com {selectedMatch.company.name}. Digam oi! 👋
                </div>
              </div>

              {messages.map(msg => {
                const isMe = msg.senderId === currentUser.id
                return (
                  <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm shadow-md ${
                      isMe
                        ? "bg-blue-600 text-white rounded-br-sm"
                        : "bg-card text-foreground rounded-bl-sm border border-border"
                    }`}>
                      {msg.text}
                      <span className={`text-[10px] block text-right mt-1 ${isMe ? "text-blue-200" : "text-muted-foreground"}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="p-4 bg-card border-t border-border">
              <div className="flex items-center gap-2">
                <Input
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  className="bg-secondary border-border focus-visible:ring-blue-500 h-11"
                />
                <Button type="submit" size="icon" className="bg-blue-600 hover:bg-blue-700 text-white shrink-0 h-11 w-11">
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center bg-background">
            <div className="w-20 h-20 bg-card rounded-full flex items-center justify-center mb-4 border border-border">
              <Send className="w-8 h-8 opacity-50" />
            </div>
            <h3 className="text-xl font-medium text-foreground mb-2">Suas Conversas</h3>
            <p className="max-w-md text-sm mb-6">Selecione uma conexão ao lado para começar a negociar ou encontre novas empresas no diretório.</p>
            <Button onClick={() => router.push("/search")} className="bg-blue-600 hover:bg-blue-700">
              Encontrar Novas Pessoas
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
