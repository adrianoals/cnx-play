"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/layout/Header"
import Sidebar from "@/components/layout/Sidebar"
import { SUPER_ADMINS } from "@/lib/constants"
import { useToast } from "@/hooks/use-toast"
import { useAuthContext } from "@/providers/auth-provider"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { toast } = useToast()
  const { user, loading } = useAuthContext()
  const [menuOpen, setMenuOpen] = useState(false)
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    const check = () => setMenuOpen(window.innerWidth >= 1024)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  useEffect(() => {
    if (loading) return

    if (!user) {
      router.push("/login")
      return
    }

    // Check admin access: role-based or super admin list
    const isAdmin = user.role === 'admin' || SUPER_ADMINS.includes(user.email?.toLowerCase() || '')

    if (!isAdmin) {
      toast({ title: "Acesso Negado", description: "Você não tem permissão para acessar o painel administrativo.", variant: "destructive" })
      router.push("/dashboard")
      return
    }
    setAuthorized(true)
  }, [loading, user, router, toast])

  if (loading || !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header onMenuToggle={() => setMenuOpen(!menuOpen)} />
      <Sidebar isOpen={menuOpen} onClose={() => setMenuOpen(false)} status="active" />
      <main className={`transition-all duration-300 p-4 md:p-8 lg:p-12 ${menuOpen ? "lg:ml-72" : ""}`}>
        {children}
      </main>
    </div>
  )
}
