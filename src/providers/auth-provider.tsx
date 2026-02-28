"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@/types"
import { getCurrentUser, seedCriticalUsers } from "@/services/auth.service"
import { migrateLocalStorage } from "@/services/migration.service"

interface AuthContextValue {
  user: User | null
  setUser: (user: User | null) => void
  loading: boolean
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  setUser: () => {},
  loading: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    migrateLocalStorage()
    seedCriticalUsers().then(() => {
      const u = getCurrentUser()
      setUser(u)
      setLoading(false)
    })
  }, [])

  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  return useContext(AuthContext)
}
