import { redirect } from "next/navigation"
import { createServerSupabase } from "@/lib/supabase-server"
import { InstitutionalLanding } from "@/components/marketing/institutional-landing"

export const metadata = {
  title: "Conecta Play | Networking Premium para Empresários",
  description: "Plataforma de networking premium para empresários, líderes e visionários que querem acelerar relacionamento, prospecção e parcerias.",
}

export default async function Home() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect("/dashboard")
  }

  return <InstitutionalLanding />
}
