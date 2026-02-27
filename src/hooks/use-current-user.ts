"use client"

import { useAuthContext } from "@/providers/auth-provider"

export function useCurrentUser() {
  const { user, loading } = useAuthContext()
  return { user, loading }
}
