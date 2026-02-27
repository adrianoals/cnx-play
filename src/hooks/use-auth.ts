"use client"

import { useAuthContext } from "@/providers/auth-provider"
import { login as loginService, register as registerService, logout as logoutService } from "@/services/auth.service"
import type { User } from "@/types"
import { useRouter } from "next/navigation"

export function useAuth() {
  const { user, setUser, loading } = useAuthContext()
  const router = useRouter()

  const login = async (email: string, password: string): Promise<User> => {
    const u = await loginService(email, password)
    setUser(u)
    return u
  }

  const register = async (data: { name: string; email: string; password: string; companyName: string; phone: string }): Promise<User> => {
    const u = await registerService(data)
    setUser(u)
    return u
  }

  const logout = () => {
    logoutService()
    setUser(null)
    router.push("/login")
  }

  return { user, loading, login, register, logout }
}
