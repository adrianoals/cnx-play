import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/providers/theme-provider"
import { AuthProvider } from "@/providers/auth-provider"
import { SWRProvider } from "@/providers/swr-provider"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Conexão Play | 365 Conexões por Ano",
  description:
    "Plataforma de networking premium para empresários, líderes e visionários. Acelere relacionamentos, prospecção e parcerias com conexões diárias estratégicas.",
  openGraph: {
    title: "Conexão Play | 365 Conexões por Ano",
    description:
      "Networking premium para empresários. Conexões diárias, reuniões estratégicas e negócios reais.",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Conexão Play | 365 Conexões por Ano",
    description:
      "Networking premium para empresários. Conexões diárias, reuniões estratégicas e negócios reais.",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <SWRProvider>
            <AuthProvider>
              {children}
              <Toaster />
            </AuthProvider>
          </SWRProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
