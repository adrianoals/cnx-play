"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import Header from "@/components/layout/Header"
import Sidebar from "@/components/layout/Sidebar"
import { useAuthContext } from "@/providers/auth-provider"

const SupportChat = dynamic(() => import("@/components/features/SupportChat"), { ssr: false })

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

  const handleClose = () => setMenuOpen(false)
  const handleToggle = () => setMenuOpen(prev => !prev)

  const status = user?.status === "pending" ? "pending" : "active"

  const userInitials = !user?.fullName
    ? "US"
    : user.fullName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">
      <Sidebar isOpen={menuOpen} onClose={handleClose} status={status} />
      <div className={`flex flex-col min-h-screen transition-all duration-300 ${menuOpen ? "lg:ml-72" : ""}`}>
        <Header
          onMenuToggle={handleToggle}
          userInitials={userInitials}
        />
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
      <SupportChat />
    </div>
  )
}
