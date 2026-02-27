"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/layout/Header"
import Sidebar from "@/components/layout/Sidebar"
import { SUPER_ADMINS } from "@/lib/constants"
import { useToast } from "@/hooks/use-toast"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { toast } = useToast()
  const [menuOpen, setMenuOpen] = useState(false)
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    const check = () => setMenuOpen(window.innerWidth >= 1024)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem("current_user") || "{}")

    if (currentUser.email && SUPER_ADMINS.includes(currentUser.email.toLowerCase())) {
      if (currentUser.role !== "admin" || currentUser.status !== "active") {
        currentUser.role = "admin"
        currentUser.status = "active"
        localStorage.setItem("current_user", JSON.stringify(currentUser))
      }
    }

    if (!currentUser.email || currentUser.role !== "admin") {
      toast({ title: "Acesso Negado", description: "Você não tem permissão para acessar o painel administrativo.", variant: "destructive" })
      router.push("/dashboard")
      return
    }
    setAuthorized(true)
  }, [router, toast])

  if (!authorized) return null

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
