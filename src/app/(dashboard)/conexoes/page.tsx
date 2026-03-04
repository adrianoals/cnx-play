"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { fetchConversations, fetchMessages, sendMessage, markMessagesRead, deleteConversation } from "@/services/messages.service"
import { fetchPendingReceived, fetchPendingSent, respondConnection, deleteConnection } from "@/services/connection.service"
import { createClient } from "@/lib/supabase"
import useSWR from "swr"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { Send, Search, ArrowLeft, Trash2, Loader2, Check, X as XIcon, Clock, Users } from "lucide-react"
import type { Message, Connection } from "@/types"
import type { Conversation } from "@/services/messages.service"

export default function ConexoesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const chatParam = searchParams.get("chat")
  const [activeTab, setActiveTab] = useState(chatParam ? "conversas" : "solicitacoes")

  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(chatParam)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState("")
  const [searchFilter, setSearchFilter] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<Conversation | null>(null)
  const [responding, setResponding] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch current user ID once
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id)
    })
  }, [])

  // SWR for conversations and connections
  const fetchConexoesData = useCallback(async () => {
    const [convs, received, sent] = await Promise.all([
      fetchConversations(),
      fetchPendingReceived(),
      fetchPendingSent(),
    ])
    return { convs, received, sent }
  }, [])

  const { data: conexoesData, isLoading: loading, mutate: mutateConexoes } = useSWR(
    currentUserId ? "conexoes-data" : null,
    fetchConexoesData,
    { refreshInterval: 15000 },
  )

  const conversations = conexoesData?.convs ?? []
  const pendingReceived = conexoesData?.received ?? []
  const pendingSent = conexoesData?.sent ?? []

  const selectedConversation = conversations.find(c => c.otherUserId === selectedUserId)

  // Fetch messages when selected user changes
  const loadMessages = useCallback(async (userId: string) => {
    try {
      const msgs = await fetchMessages(userId)
      setMessages(msgs)
      await markMessagesRead(userId)
    } catch (err) {
      console.error(err)
    }
  }, [])

  useEffect(() => {
    if (selectedUserId) loadMessages(selectedUserId)
  }, [selectedUserId, loadMessages])

  // Refresh messages on interval when chat is open
  useEffect(() => {
    if (!selectedUserId) return
    const interval = setInterval(() => loadMessages(selectedUserId), 15000)
    return () => clearInterval(interval)
  }, [selectedUserId, loadMessages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length, selectedUserId])

  const handleSelectChat = async (otherUserId: string) => {
    setSelectedUserId(otherUserId)
    setActiveTab("conversas")
    try {
      const msgs = await fetchMessages(otherUserId)
      setMessages(msgs)
      await markMessagesRead(otherUserId)
      // Optimistic: zero out unread count
      if (conexoesData) {
        mutateConexoes({
          ...conexoesData,
          convs: conexoesData.convs.map(c =>
            c.otherUserId === otherUserId ? { ...c, unreadCount: 0 } : c
          ),
        }, false)
      }
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
      if (selectedUserId === deleteTarget.otherUserId) {
        setSelectedUserId(null)
        setMessages([])
      }
      mutateConexoes()
      toast({ title: "Chat excluído", description: "A conversa e a conexão foram removidas." })
    } catch (err) {
      console.error(err)
      toast({ title: "Erro", description: "Não foi possível excluir o chat.", variant: "destructive" })
    } finally {
      setDeleteTarget(null)
    }
  }

  const handleAccept = async (conn: Connection) => {
    setResponding(conn.id)
    try {
      await respondConnection(conn.id, true)
      toast({ title: "Conexão aceita!", description: `Você e ${conn.requesterName} agora estão conectados.`, className: "bg-green-600 text-white" })
      await mutateConexoes()
    } catch (err) {
      console.error(err)
      toast({ title: "Erro", description: "Não foi possível aceitar.", variant: "destructive" })
    } finally {
      setResponding(null)
    }
  }

  const handleReject = async (conn: Connection) => {
    setResponding(conn.id)
    try {
      await respondConnection(conn.id, false)
      mutateConexoes()
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
        <span className="ml-3 text-muted-foreground">Carregando conexões...</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] -m-4 md:-m-6 lg:-m-8">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
        <div className="border-b border-border bg-card px-4 pt-3">
          <TabsList className="w-full md:w-auto">
            <TabsTrigger value="solicitacoes" className="flex-1 md:flex-none gap-2">
              <Users className="h-4 w-4" />
              Solicitações
              {pendingReceived.length > 0 && (
                <span className="bg-blue-600 text-white text-[10px] font-bold rounded-full h-5 min-w-[20px] flex items-center justify-center px-1">
                  {pendingReceived.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="conversas" className="flex-1 md:flex-none gap-2">
              <Send className="h-4 w-4" />
              Conversas
              {conversations.reduce((sum, c) => sum + c.unreadCount, 0) > 0 && (
                <span className="bg-blue-600 text-white text-[10px] font-bold rounded-full h-5 min-w-[20px] flex items-center justify-center px-1">
                  {conversations.reduce((sum, c) => sum + c.unreadCount, 0)}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab: Solicitações */}
        <TabsContent value="solicitacoes" className="flex-1 overflow-y-auto mt-0">
          <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-8">
            {/* Recebidas */}
            <div>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                Recebidas
                {pendingReceived.length > 0 && (
                  <Badge className="bg-blue-600 text-white">{pendingReceived.length}</Badge>
                )}
              </h2>
              {pendingReceived.length === 0 ? (
                <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground">
                  Nenhuma solicitação recebida pendente.
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingReceived.map(conn => (
                    <div key={conn.id} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
                      <Avatar className="h-12 w-12 border border-border">
                        <AvatarImage src={conn.requesterAvatar || undefined} />
                        <AvatarFallback>{(conn.requesterName || "??").substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{conn.requesterName}</p>
                        <p className="text-xs text-muted-foreground truncate">{conn.requesterCompany || "—"}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white gap-1"
                          onClick={() => handleAccept(conn)}
                          disabled={responding === conn.id}
                        >
                          {responding === conn.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                          Aceitar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          onClick={() => handleReject(conn)}
                          disabled={responding === conn.id}
                        >
                          <XIcon className="h-4 w-4" />
                          Recusar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Enviadas */}
            <div>
              <h2 className="text-lg font-bold mb-4">Enviadas</h2>
              {pendingSent.length === 0 ? (
                <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground">
                  Nenhuma solicitação enviada pendente.
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingSent.map(conn => (
                    <div key={conn.id} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
                      <Avatar className="h-12 w-12 border border-border">
                        <AvatarImage src={conn.requestedAvatar || undefined} />
                        <AvatarFallback>{(conn.requestedName || "??").substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{conn.requestedName}</p>
                        <p className="text-xs text-muted-foreground truncate">{conn.requestedCompany || "—"}</p>
                      </div>
                      <Badge variant="outline" className="gap-1 shrink-0">
                        <Clock className="h-3 w-3" />
                        Pendente
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Tab: Conversas */}
        <TabsContent value="conversas" className="flex-1 mt-0 overflow-hidden">
          <div className="flex h-full bg-background overflow-hidden">
            {/* Sidebar / Conversation List */}
            <div className={`w-full md:w-80 border-r border-border bg-card flex flex-col ${selectedUserId ? "hidden md:flex" : "flex"}`}>
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
                {filteredConversations.length === 0 ? (
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
          </div>
        </TabsContent>
      </Tabs>

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
