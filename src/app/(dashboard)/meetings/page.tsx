"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { fetchConversations, fetchMessages, sendMessage, markMessagesRead, deleteConversation } from "@/services/messages.service"
import { fetchPendingReceived, respondConnection, deleteConnection } from "@/services/connection.service"
import { createClient } from "@/lib/supabase"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { Send, Search, ArrowLeft, Trash2, Loader2, Check, X as XIcon } from "lucide-react"
import type { Message, Connection } from "@/types"
import type { Conversation } from "@/services/messages.service"

export default function MeetingsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [pendingRequests, setPendingRequests] = useState<Connection[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string | null>(searchParams.get("chat"))
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState("")
  const [searchFilter, setSearchFilter] = useState("")
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<Conversation | null>(null)
  const [responding, setResponding] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const selectedConversation = conversations.find(c => c.otherUserId === selectedUserId)

  const loadData = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setCurrentUserId(user.id)

      const [convs, pending] = await Promise.all([
        fetchConversations(),
        fetchPendingReceived(),
      ])
      setConversations(convs)
      setPendingRequests(pending)

      // If there's a selected chat, load messages
      if (selectedUserId) {
        const msgs = await fetchMessages(selectedUserId)
        setMessages(msgs)
        await markMessagesRead(selectedUserId)
      }
    } catch (err) {
      console.error("Error loading chat data:", err)
    } finally {
      setLoading(false)
    }
  }, [selectedUserId])

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 3000)
    return () => clearInterval(interval)
  }, [loadData])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length, selectedUserId])

  const handleSelectChat = async (otherUserId: string) => {
    setSelectedUserId(otherUserId)
    try {
      const msgs = await fetchMessages(otherUserId)
      setMessages(msgs)
      await markMessagesRead(otherUserId)
      // Update unread count locally
      setConversations(prev => prev.map(c =>
        c.otherUserId === otherUserId ? { ...c, unreadCount: 0 } : c
      ))
    } catch (err) {
      console.error(err)
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || !selectedUserId) return

    const text = inputText.trim()
    setInputText("")
    try {
      const newMsg = await sendMessage(selectedUserId, text)
      setMessages(prev => [...prev, newMsg])
    } catch (err) {
      console.error(err)
      toast({ title: "Erro", description: "Não foi possível enviar a mensagem.", variant: "destructive" })
      setInputText(text)
    }
  }

  const handleDeleteChat = async () => {
    if (!deleteTarget) return
    try {
      await deleteConversation(deleteTarget.otherUserId)
      await deleteConnection(deleteTarget.connectionId)
      setConversations(prev => prev.filter(c => c.otherUserId !== deleteTarget.otherUserId))
      if (selectedUserId === deleteTarget.otherUserId) {
        setSelectedUserId(null)
        setMessages([])
      }
      toast({ title: "Chat excluído", description: "A conversa e a conexão foram removidas." })
    } catch (err) {
      console.error(err)
      toast({ title: "Erro", description: "Não foi possível excluir o chat.", variant: "destructive" })
    } finally {
      setDeleteTarget(null)
    }
  }

  const handleAcceptPending = async (conn: Connection) => {
    setResponding(conn.id)
    try {
      await respondConnection(conn.id, true)
      setPendingRequests(prev => prev.filter(p => p.id !== conn.id))
      toast({ title: "Conexão aceita!", description: `Você e ${conn.requesterName} agora estão conectados.`, className: "bg-green-600 text-white" })
      await loadData()
    } catch (err) {
      console.error(err)
      toast({ title: "Erro", description: "Não foi possível aceitar.", variant: "destructive" })
    } finally {
      setResponding(null)
    }
  }

  const handleRejectPending = async (conn: Connection) => {
    setResponding(conn.id)
    try {
      await respondConnection(conn.id, false)
      setPendingRequests(prev => prev.filter(p => p.id !== conn.id))
      toast({ title: "Solicitação recusada" })
    } catch (err) {
      console.error(err)
      toast({ title: "Erro", description: "Não foi possível recusar.", variant: "destructive" })
    } finally {
      setResponding(null)
    }
  }

  const filteredConversations = conversations.filter(c =>
    c.otherUserName.toLowerCase().includes(searchFilter.toLowerCase()) ||
    c.otherUserCompany.toLowerCase().includes(searchFilter.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-5rem)] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">Carregando conversas...</span>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-5rem)] bg-background overflow-hidden -m-4 md:-m-6 lg:-m-8 rounded-none">
      {/* Sidebar / Conversation List */}
      <div className={`w-full md:w-80 border-r border-border bg-card flex flex-col ${selectedUserId ? "hidden md:flex" : "flex"}`}>
        <div className="p-4 border-b border-border flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")} className="md:hidden text-muted-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-bold text-foreground text-lg">Mensagens</h1>
        </div>

        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="bg-secondary border-border pl-9 placeholder:text-muted-foreground"
              placeholder="Buscar conversa..."
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Pending connection requests */}
          {pendingRequests.length > 0 && (
            <div className="border-b border-border">
              <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Solicitações Pendentes
              </div>
              {pendingRequests.map(conn => (
                <div key={conn.id} className="p-4 flex items-center gap-3 border-b border-border/50 bg-blue-500/5">
                  <Avatar className="h-10 w-10 border border-border">
                    <AvatarImage src={conn.requesterAvatar || undefined} />
                    <AvatarFallback>{(conn.requesterName || "??").substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm truncate">{conn.requesterName}</span>
                      <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-blue-600">Novo</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{conn.requesterCompany}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      size="icon"
                      className="h-8 w-8 bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleAcceptPending(conn)}
                      disabled={responding === conn.id}
                    >
                      {responding === conn.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      onClick={() => handleRejectPending(conn)}
                      disabled={responding === conn.id}
                    >
                      <XIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Conversations */}
          {filteredConversations.length === 0 && pendingRequests.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">
              <p className="mb-4">Você ainda não tem conexões.</p>
              <Button onClick={() => router.push("/search")} variant="outline" className="w-full">
                Explorar Comunidade
              </Button>
            </div>
          ) : (
            filteredConversations.map(conv => (
              <div
                key={conv.otherUserId}
                onClick={() => handleSelectChat(conv.otherUserId)}
                className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-secondary/50 transition-colors border-b border-border/50 ${selectedUserId === conv.otherUserId ? "bg-secondary border-l-4 border-l-blue-500" : ""}`}
              >
                <Avatar className="h-12 w-12 border border-border">
                  <AvatarImage src={conv.otherUserAvatar || undefined} />
                  <AvatarFallback>{conv.otherUserName.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-foreground truncate text-sm">{conv.otherUserName}</h3>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider whitespace-nowrap ml-2">
                      {conv.lastMessageAt
                        ? new Date(conv.lastMessageAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                        : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-muted-foreground truncate flex-1">
                      {conv.lastMessage || conv.otherUserCompany || "Conexão direta"}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="bg-blue-600 text-white text-[10px] font-bold rounded-full h-5 min-w-[20px] flex items-center justify-center px-1">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col bg-background ${!selectedUserId ? "hidden md:flex" : "flex"}`}>
        {selectedConversation ? (
          <>
            <div className="h-16 border-b border-border flex items-center justify-between px-4 bg-card/50 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => setSelectedUserId(null)} className="md:hidden text-muted-foreground -ml-2">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <Avatar className="h-10 w-10 border border-border">
                  <AvatarImage src={selectedConversation.otherUserAvatar || undefined} />
                  <AvatarFallback>{selectedConversation.otherUserName.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-semibold text-foreground leading-none text-sm md:text-base">{selectedConversation.otherUserName}</h2>
                  {selectedConversation.otherUserCompany && (
                    <span className="text-xs text-muted-foreground mt-1 block">{selectedConversation.otherUserCompany}</span>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-red-500"
                onClick={() => setDeleteTarget(selectedConversation)}
                title="Excluir chat"
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/50">
              <div className="text-center py-8">
                <p className="text-muted-foreground text-xs uppercase tracking-widest mb-2">Início da Conexão</p>
                <div className="bg-card inline-block px-4 py-2 rounded-full text-sm text-foreground border border-border">
                  Você conectou com {selectedConversation.otherUserName}. Digam oi!
                </div>
              </div>

              {messages.map(msg => {
                const isMe = msg.senderId === currentUserId
                return (
                  <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm shadow-md ${
                      isMe
                        ? "bg-blue-600 text-white rounded-br-sm"
                        : "bg-card text-foreground rounded-bl-sm border border-border"
                    }`}>
                      {msg.text}
                      <span className={`text-[10px] block text-right mt-1 ${isMe ? "text-blue-200" : "text-muted-foreground"}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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

      {/* Delete chat confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Chat</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a conversa com <strong>{deleteTarget?.otherUserName}</strong>? Todas as mensagens serão removidas e a conexão será desfeita. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteChat} className="bg-red-600 hover:bg-red-700 text-white">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
