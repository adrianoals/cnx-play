"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function MeetingsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const chat = searchParams.get("chat")
    const target = chat ? `/conexoes?chat=${chat}` : "/conexoes"
    router.replace(target)
  }, [router, searchParams])

  return (
    <div className="flex h-[calc(100vh-5rem)] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      <span className="ml-3 text-muted-foreground">Redirecionando...</span>
    </div>
  )
}
