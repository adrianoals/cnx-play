"use client"

import React, { useMemo } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Bell, Menu, Gift, User, LogOut, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { fetchNotifications, markAllRead, clearReadNotifications } from "@/services/notification.service"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Notification } from "@/types"
import { useAuth } from "@/hooks/use-auth"
import useSWR from "swr"

interface HeaderProps {
  onMenuToggle: () => void
  userInitials?: string
}

const Header = React.memo(function Header({ onMenuToggle, userInitials = "US" }: HeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const isActive = user?.status === "active"
  const isAdminPanel = pathname.startsWith("/admin")

  const { data: notifications = [], mutate } = useSWR<Notification[]>(
    isActive ? "notifications" : null,
    fetchNotifications,
    { refreshInterval: 30000 },
  )

  const unreadCount = useMemo(
    () => notifications.filter(n => !n.read).length,
    [notifications],
  )

  const readCount = useMemo(
    () => notifications.filter(n => n.read).length,
    [notifications],
  )

  const handleNotificationsOpen = async (open: boolean) => {
    if (open && unreadCount > 0) {
      try {
        await markAllRead()
        mutate(
          notifications.map(n => ({ ...n, read: true })),
          false,
        )
      } catch (err) {
        console.error(err)
      }
    }
  }

  const handleClearRead = async () => {
    try {
      await clearReadNotifications()
      mutate(
        notifications.filter(n => !n.read),
        false,
      )
    } catch (err) {
      console.error(err)
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
            <img src="/icon.svg" alt="ConectaPlay" className="w-8 h-8" />
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
                      const isConnectionNotif = notif.referenceType === 'connection'
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
                          {isConnectionNotif && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 mt-1 text-xs w-full"
                              onClick={() => router.push("/conexoes")}
                            >
                              Ver solicitação
                            </Button>
                          )}
                        </DropdownMenuItem>
                      )
                    }) : (
                      <div className="p-4 text-center text-sm text-muted-foreground">Nenhuma notificação nova.</div>
                    )}
                  </div>
                  {readCount > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={handleClearRead}
                        className="text-xs text-muted-foreground hover:text-red-500 cursor-pointer justify-center gap-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Limpar lidas ({readCount})
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 pl-2 border-l border-border outline-none cursor-pointer hover:opacity-80 transition-opacity">
                {!isAdminPanel && (
                  <div className="hidden md:block text-right">
                    <p className="text-sm font-medium leading-none text-foreground">{user?.fullName || "Visitante"}</p>
                    <p className="text-xs text-muted-foreground">{user?.companyName || "Empresa"}</p>
                  </div>
                )}
                <Avatar className="h-8 w-8 border border-border">
                  <AvatarImage src={user?.avatar || undefined} />
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
})

export default Header
