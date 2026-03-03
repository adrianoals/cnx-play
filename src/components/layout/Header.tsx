"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Bell, Menu, Gift, User, LogOut, Check, X as XIcon, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { fetchNotifications, markAllRead } from "@/services/notification.service"
import { respondConnection } from "@/services/connection.service"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Notification } from "@/types"
import { useAuth } from "@/hooks/use-auth"
import { createClient } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

interface HeaderProps {
  onMenuToggle: () => void
  userInitials?: string
}

export default function Header({ onMenuToggle, userInitials = "US" }: HeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { logout } = useAuth()
  const { toast } = useToast()
  const [user, setUser] = useState<{ fullName?: string; companyName?: string; avatar?: string; status?: string }>({})
  const [avatar, setAvatar] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [pendingConnectionIds, setPendingConnectionIds] = useState<Set<string>>(new Set())
  const [respondingTo, setRespondingTo] = useState<string | null>(null)

  const isActive = user.status === "active"
  const isAdminPanel = pathname.startsWith("/admin")

  const loadNotifications = useCallback(async () => {
    try {
      const notifs = await fetchNotifications()
      setNotifications(notifs)
      setUnreadCount(notifs.filter(n => !n.read).length)

      // Discover which connection notifications are still pending
      const supabase = createClient()
      const connRefIds = notifs
        .filter(n => n.referenceType === 'connection' && n.referenceId)
        .map(n => n.referenceId as string)

      if (connRefIds.length > 0) {
        const { data: conns } = await supabase
          .from('connections')
          .select('id, status')
          .in('id', connRefIds)
          .eq('status', 'pending')

        setPendingConnectionIds(new Set((conns || []).map(c => c.id)))
      }
    } catch (err) {
      console.error("Error loading notifications:", err)
    }
  }, [])

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("current_user") || "{}")
    setUser(u)
    setAvatar(u.avatar || null)

    if (u.status !== "active") return

    loadNotifications()
    const interval = setInterval(loadNotifications, 3000)
    return () => clearInterval(interval)
  }, [loadNotifications])

  const handleNotificationsOpen = async (open: boolean) => {
    if (open && unreadCount > 0) {
      try {
        await markAllRead()
        setUnreadCount(0)
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      } catch (err) {
        console.error(err)
      }
    }
  }

  const handleAcceptConnection = async (notif: Notification) => {
    if (!notif.referenceId) return
    setRespondingTo(notif.referenceId)
    try {
      await respondConnection(notif.referenceId, true)
      setPendingConnectionIds(prev => {
        const next = new Set(prev)
        next.delete(notif.referenceId!)
        return next
      })
      toast({ title: "Conexão aceita!", className: "bg-green-600 text-white" })
    } catch (err) {
      console.error(err)
      toast({ title: "Erro", description: "Não foi possível aceitar.", variant: "destructive" })
    } finally {
      setRespondingTo(null)
    }
  }

  const handleRejectConnection = async (notif: Notification) => {
    if (!notif.referenceId) return
    setRespondingTo(notif.referenceId)
    try {
      await respondConnection(notif.referenceId, false)
      setPendingConnectionIds(prev => {
        const next = new Set(prev)
        next.delete(notif.referenceId!)
        return next
      })
      toast({ title: "Solicitação recusada" })
    } catch (err) {
      console.error(err)
      toast({ title: "Erro", description: "Não foi possível recusar.", variant: "destructive" })
    } finally {
      setRespondingTo(null)
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4 md:px-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="lg:hidden -ml-2 text-foreground" onClick={onMenuToggle}>
            <Menu className="h-6 w-6" />
          </Button>
          <div className="hidden md:flex items-center gap-2 font-bold text-xl tracking-tight">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white">C</div>
            <span className="text-foreground">Conecta<span className="text-blue-600">Play</span></span>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2 md:gap-4">
          {isActive && !isAdminPanel && (
            <>
              <Button onClick={() => router.push('/referral')} className="hidden md:flex bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-none shadow-sm gap-2 h-9" size="sm">
                <Gift className="h-4 w-4" />
                <span className="hidden lg:inline">Indicar e Ganhar</span>
              </Button>
              <Button variant="ghost" size="icon" className="md:hidden text-purple-600 hover:bg-purple-50" onClick={() => router.push('/referral')}>
                <Gift className="h-5 w-5" />
              </Button>

              <DropdownMenu onOpenChange={handleNotificationsOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-600 border-2 border-background" />}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel>Notificações</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="max-h-[300px] overflow-y-auto">
                    {notifications.length > 0 ? notifications.map((notif) => {
                      const isPendingConnection = notif.referenceType === 'connection'
                        && notif.referenceId
                        && pendingConnectionIds.has(notif.referenceId)
                        && notif.title === 'Solicitação de Conexão'

                      return (
                        <DropdownMenuItem key={notif.id} className="flex flex-col items-start gap-1 p-3 cursor-default focus:bg-muted/50" onSelect={e => e.preventDefault()}>
                          <div className="flex justify-between w-full">
                            <span className={`text-xs font-semibold ${notif.read ? "text-muted-foreground" : "text-blue-600"}`}>
                              {notif.title}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(notif.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          <p className={`text-sm ${notif.read ? "text-muted-foreground" : "text-foreground"}`}>{notif.content}</p>
                          {isPendingConnection && (
                            <div className="flex gap-2 mt-1 w-full">
                              <Button
                                size="sm"
                                className="h-7 flex-1 bg-green-600 hover:bg-green-700 text-white text-xs gap-1"
                                onClick={() => handleAcceptConnection(notif)}
                                disabled={respondingTo === notif.referenceId}
                              >
                                {respondingTo === notif.referenceId ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                                Aceitar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 flex-1 text-xs gap-1"
                                onClick={() => handleRejectConnection(notif)}
                                disabled={respondingTo === notif.referenceId}
                              >
                                <XIcon className="h-3 w-3" />
                                Recusar
                              </Button>
                            </div>
                          )}
                        </DropdownMenuItem>
                      )
                    }) : (
                      <div className="p-4 text-center text-sm text-muted-foreground">Nenhuma notificação nova.</div>
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 pl-2 border-l border-border outline-none cursor-pointer hover:opacity-80 transition-opacity">
                {!isAdminPanel && (
                  <div className="hidden md:block text-right">
                    <p className="text-sm font-medium leading-none text-foreground">{user.fullName || "Visitante"}</p>
                    <p className="text-xs text-muted-foreground">{user.companyName || "Empresa"}</p>
                  </div>
                )}
                <Avatar className="h-8 w-8 border border-border">
                  <AvatarImage src={avatar || user.avatar || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white font-medium text-xs">{userInitials}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 shadow-lg dark:shadow-black/40 dark:border-white/10">
              {!isAdminPanel && (
                <>
                  <DropdownMenuItem onClick={() => router.push("/account")} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" /><span>Minha Conta</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={() => logout()} className="text-red-500 focus:text-red-500 cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" /><span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
