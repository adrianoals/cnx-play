import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <p className="text-muted-foreground mb-8">Página não encontrada</p>
      <Link href="/login" className="text-primary hover:underline">Voltar ao início</Link>
    </div>
  )
}
