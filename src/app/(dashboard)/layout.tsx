"use client"

import { useState, useEffect } from "react"
import Header from "@/components/layout/Header"
import Sidebar from "@/components/layout/Sidebar"
import SupportChat from "@/components/features/SupportChat"
import DailyContactManager from "@/components/features/DailyContactManager"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [status, setStatus] = useState("active")
  const [showReferralModal, setShowReferralModal] = useState(false)

  useEffect(() => {
    const check = () => setMenuOpen(window.innerWidth >= 1024)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("current_user") || "{}")
    if (user.status === "pending") setStatus("pending")
  }, [])

  const userInitials = (() => {
    const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("current_user") || "{}") : {}
    return user.fullName ? user.fullName.substring(0, 2).toUpperCase() : "US"
  })()

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">
      <Sidebar isOpen={menuOpen} onClose={() => setMenuOpen(false)} status={status} />
      <div className={`flex flex-col min-h-screen transition-all duration-300 ${menuOpen ? "lg:ml-72" : ""}`}>
        <Header
          onMenuToggle={() => setMenuOpen(!menuOpen)}
          userInitials={userInitials}
          onOpenReferral={() => setShowReferralModal(true)}
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
