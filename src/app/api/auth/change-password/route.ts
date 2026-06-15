import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { validateResetToken } from "@/lib/tokens"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token e senha sao obrigatorios." },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "A senha deve ter no minimo 6 caracteres." },
        { status: 400 }
      )
    }

    const result = validateResetToken(token)
    if (!result) {
      return NextResponse.json(
        { error: "Link invalido ou expirado. Solicite um novo link de recuperacao." },
        { status: 400 }
      )
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", result.email.toLowerCase())
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Usuario nao encontrado." },
        { status: 404 }
      )
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      profile.id,
      { password }
    )

    if (updateError) {
      console.error("Update password error:", updateError)
      return NextResponse.json(
        { error: "Erro ao atualizar a senha." },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: "Senha atualizada com sucesso." })
  } catch (error) {
    console.error("Change password error:", error)
    return NextResponse.json({ error: "Erro interno." }, { status: 500 })
  }
}
