"use client"

import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Home, User, CreditCard, Search, MessageCircle, LogOut, ShieldCheck, Sun, Moon, Gift, Users, Building2, Handshake, Calendar, Link2, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter, usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { useAuth } from "@/hooks/use-auth"

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  status?: string
}

const Sidebar = React.memo(function Sidebar({ isOpen, onClose, status = "active" }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const { user: authUser, logout } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (authUser) {
      setIsAdmin(authUser.role === "admin")
    }
  }, [authUser, isOpen])

  const isAdminPanel = pathname.startsWith("/admin")

  const baseItems = [
    { icon: Home, label: "Home", path: "/dashboard" },
    { icon: Calendar, label: "Agenda", path: "/agenda" },
    { icon: Search, label: "Pesquisar Empresas", path: "/search" },
    { icon: User, label: "Minha Conta", path: "/account" },
    { icon: Users, label: "Conexões", path: "/conexoes" },
    { icon: Gift, label: "Indique e Ganhe", path: "/referral" },
  ]
  const adminItems = [{ icon: ShieldCheck, label: "Administração", path: "/admin/users" }]
  const footerItems = [{ icon: MessageCircle, label: "Suporte WhatsApp", path: "https://wa.me/5511950222063", external: true }]

  let currentMenu: typeof baseItems & { external?: boolean }[]
  if (isAdminPanel) {
    currentMenu = [
      { icon: Home, label: "Dashboard", path: "/dashboard" },
      { icon: Users, label: "Usuários", path: "/admin/users" },
      { icon: Building2, label: "Empresas", path: "/admin/empresas" },
      { icon: Link2, label: "Conexões do Dia", path: "/admin/conexoes" },
      { icon: Calendar, label: "Agendas", path: "/admin/agendas" },
      { icon: Gift, label: "Indicações", path: "/admin/indicacoes" },
      { icon: Handshake, label: "Negócios", path: "/admin/negocios" },
      { icon: BookOpen, label: "Revista", path: "/admin/revista" },
    ] as typeof baseItems
  } else if (status === "pending") {
    currentMenu = [
      { icon: Home, label: "Status da Aprovação", path: "/dashboard" },
      { icon: User, label: "Minha Conta", path: "/account" },
      { icon: CreditCard, label: "Pagamento", path: "/payment" },
      ...footerItems,
    ] as typeof baseItems
  } else {
    currentMenu = [...baseItems] as typeof baseItems
    if (isAdmin) currentMenu = [...currentMenu, ...adminItems]
    currentMenu = [...currentMenu, ...footerItems] as typeof baseItems
  }

  const handleNavigation = (item: { path: string; external?: boolean }) => {
    if (item.external) { window.open(item.path, "_blank"); return }
    router.push(item.path)
    if (window.innerWidth < 1024) onClose()
  }

  const handleLogout = () => {
    logout()
  }

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark")

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden" />
        )}
      </AnimatePresence>

      <motion.aside
        initial={{ x: -320 }} animate={{ x: isOpen ? 0 : -320 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className={`fixed top-0 left-0 h-screen w-72 bg-card border-r border-border z-[60] flex flex-col ${isOpen ? "shadow-2xl" : ""}`}
      >
        <div className="p-6 flex justify-between items-center border-b border-border">
          <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Menu</span>
          <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
          {currentMenu.map((item, index) => {
            const isActive = pathname === item.path
            const isAdminItem = item.label === "Administração"
            return (
              <button key={index} onClick={() => handleNavigation(item)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : isAdminItem ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                <item.icon className={`h-5 w-5 transition-colors ${isActive ? "text-primary-foreground" : isAdminItem ? "text-amber-500" : "text-muted-foreground group-hover:text-primary"}`} />
                <span className="font-medium text-left">{item.label}</span>
              </button>
            )
          })}
        </div>

        <div className="p-4 border-t border-border flex flex-col gap-3">
          <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-accent group border border-transparent hover:border-border">
            {theme === "light" ? <Moon className="h-5 w-5 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" /> : <Sun className="h-5 w-5 text-amber-500 group-hover:scale-110 transition-transform" />}
            <span className="font-medium text-left">{theme === "light" ? "Modo Escuro" : "Modo Claro"}</span>
          </button>

          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-red-400 hover:text-red-300 hover:bg-red-500/10 group border border-transparent hover:border-red-500/20">
            <LogOut className="h-5 w-5 group-hover:scale-110 transition-transform" />
            <span className="font-medium text-left">Sair</span>
          </button>
        </div>
      </motion.aside>
    </>
  )
})

export default Sidebar
