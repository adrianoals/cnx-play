"use client"

import { useState, useEffect } from "react"
import { Bell, Menu, Gift } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getNotifications, markNotificationsRead } from "@/services/messages.service"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Notification } from "@/types"

interface HeaderProps {
  onMenuToggle: () => void
  userInitials?: string
  onOpenReferral?: () => void
}

export default function Header({ onMenuToggle, userInitials = "US", onOpenReferral }: HeaderProps) {
  const [user, setUser] = useState<{ fullName?: string; companyName?: string; avatar?: string }>({})
  const [avatar, setAvatar] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("current_user") || "{}")
    setUser(u)
    setAvatar(localStorage.getItem("user_avatar"))

    const load = () => {
      const notifs = getNotifications()
      setNotifications(notifs)
      setUnreadCount(notifs.filter(n => !n.read).length)
    }
    load()
    const interval = setInterval(load, 3000)
    return () => clearInterval(interval)
  }, [])

  const handleNotificationsOpen = (open: boolean) => {
    if (open) {
      markNotificationsRead()
      setUnreadCount(0)
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4 md:px-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="lg:hidden -ml-2" onClick={onMenuToggle}>
            <Menu className="h-6 w-6" />
          </Button>
          <div className="hidden md:flex items-center gap-2 font-bold text-xl tracking-tight">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white">C</div>
            <span className="text-foreground">Conecta<span className="text-blue-600">Play</span></span>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2 md:gap-4">
          <Button onClick={onOpenReferral} className="hidden md:flex bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-none shadow-sm gap-2 h-9" size="sm">
            <Gift className="h-4 w-4" />
            <span className="hidden lg:inline">Indicar e Ganhar</span>
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden text-purple-600 hover:bg-purple-50" onClick={onOpenReferral}>
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
                {notifications.length > 0 ? notifications.map((notif) => (
                  <DropdownMenuItem key={notif.id} className="flex flex-col items-start gap-1 p-3 cursor-default focus:bg-muted/50">
                    <div className="flex justify-between w-full">
                      <span className={`text-xs font-semibold ${notif.read ? "text-muted-foreground" : "text-blue-600"}`}>
                        {notif.type === "system" ? "Sistema" : "Nova Interação"}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(notif.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className={`text-sm ${notif.read ? "text-muted-foreground" : "text-foreground"}`}>{notif.content}</p>
                  </DropdownMenuItem>
                )) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">Nenhuma notificação nova.</div>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center gap-2 pl-2 border-l border-border">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium leading-none text-foreground">{user.fullName || "Visitante"}</p>
              <p className="text-xs text-muted-foreground">{user.companyName || "Empresa"}</p>
            </div>
            <Avatar className="h-8 w-8 border border-border">
              <AvatarImage src={avatar || user.avatar || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-medium">{userInitials}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </header>
  )
}
