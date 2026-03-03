import type { Metadata } from "next"
import { InstitutionalLanding } from "@/components/marketing/institutional-landing"

export const metadata: Metadata = {
  title: "Conecta Play | Landing",
  description: "Landing institucional para captação de novos cadastros na plataforma Conecta Play.",
}

export default function LandingPage() {
  return <InstitutionalLanding />
}
