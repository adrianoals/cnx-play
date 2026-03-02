"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@/types"
import { fetchProfile } from "@/services/auth.service"
import { createClient } from "@/lib/supabase"

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
    const supabase = createClient()

    // Sync user profile from Supabase — safe, always finishes
    const syncUser = (userId?: string) => {
      if (!userId) {
        setUser(null)
        localStorage.removeItem("current_user")
        localStorage.removeItem("user_token")
        setLoading(false)
        return
      }

      fetchProfile(userId)
        .then((profile) => {
          setUser(profile)
          if (profile) {
            localStorage.setItem("current_user", JSON.stringify(profile))
          } else {
            localStorage.removeItem("current_user")
          }
        })
        .catch(() => {
          // If profile fetch fails, try localStorage fallback
          try {
            const raw = localStorage.getItem("current_user")
            if (raw) setUser(JSON.parse(raw))
          } catch { /* ignore */ }
        })
        .finally(() => {
          setLoading(false)
        })
    }

    // Initial load: check if there's an active Supabase session
    supabase.auth.getUser()
      .then(({ data: { user: authUser } }) => {
        if (authUser) {
          syncUser(authUser.id)
        } else {
          // No session — check localStorage fallback for backward compat
          try {
            const raw = localStorage.getItem("current_user")
            if (raw) setUser(JSON.parse(raw))
          } catch { /* ignore */ }
          setLoading(false)
        }
      })
      .catch(() => {
        setLoading(false)
      })

    // Listen for auth state changes — NO async callback
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_OUT") {
          setUser(null)
          localStorage.removeItem("current_user")
          localStorage.removeItem("user_token")
          return
        }

        if (session?.user) {
          // Fire and forget — syncUser handles its own errors
          void syncUser(session.user.id)
        }
      }
    )

    return () => subscription.unsubscribe()
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
