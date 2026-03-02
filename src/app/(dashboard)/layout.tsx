"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/layout/Header"
import Sidebar from "@/components/layout/Sidebar"
import SupportChat from "@/components/features/SupportChat"
import DailyContactManager from "@/components/features/DailyContactManager"
import { useAuthContext } from "@/providers/auth-provider"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, loading } = useAuthContext()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const check = () => setMenuOpen(window.innerWidth >= 1024)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  // Auth guard: redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login")
    }
  }, [loading, user, router])

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  const status = user.status === "pending" ? "pending" : "active"

  const userInitials = user.fullName
    ? user.fullName.substring(0, 2).toUpperCase()
    : "US"

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">
      <Sidebar isOpen={menuOpen} onClose={() => setMenuOpen(false)} status={status} />
      <div className={`flex flex-col min-h-screen transition-all duration-300 ${menuOpen ? "lg:ml-72" : ""}`}>
        <Header
          onMenuToggle={() => setMenuOpen(!menuOpen)}
          userInitials={userInitials}
          onOpenReferral={() => {}}
        />
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
      <SupportChat />
      <DailyContactManager />
    </div>
  )
}
