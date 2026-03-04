import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { generateResetToken } from "@/lib/tokens"
import { sendMail } from "@/lib/mail"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ message: "OK" }, { status: 200 })
    }

    // Check if user exists
    const { data: user } = await supabaseAdmin
      .from("users")
      .select("id, email")
      .eq("email", email.toLowerCase().trim())
      .single()

    if (!user) {
      // Return 200 anyway to not leak info
      return NextResponse.json({ message: "OK" }, { status: 200 })
    }

    const token = generateResetToken(user.email)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const resetLink = `${appUrl}/reset-password?token=${encodeURIComponent(token)}`

    await sendMail({
      to: user.email,
      subject: "Redefinir sua senha - ConectaPlay",
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
          <!-- Header gradient -->
          <tr>
            <td style="height:4px;background:linear-gradient(to right,#2563eb,#7c3aed,#ec4899);"></td>
          </tr>
          <!-- Logo -->
          <tr>
            <td align="center" style="padding:32px 32px 16px;">
              <img src="cid:logo@conectaplay" alt="ConectaPlay" width="48" height="48" style="display:block;border-radius:12px;" />
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:0 32px 32px;text-align:center;">
              <h1 style="margin:0 0 8px;font-size:22px;color:#18181b;">Redefinir Senha</h1>
              <p style="margin:0 0 24px;font-size:14px;color:#71717a;line-height:1.6;">
                Recebemos uma solicitacao para redefinir a senha da sua conta ConectaPlay. Clique no botao abaixo para criar uma nova senha.
              </p>
              <a href="${resetLink}" style="display:inline-block;padding:14px 32px;background:linear-gradient(to right,#2563eb,#7c3aed);color:#ffffff;text-decoration:none;border-radius:12px;font-weight:600;font-size:14px;">
                Redefinir Minha Senha
              </a>
              <p style="margin:24px 0 0;font-size:12px;color:#a1a1aa;line-height:1.5;">
                Este link expira em <strong>30 minutos</strong>.<br/>
                Se voce nao solicitou essa alteracao, ignore este e-mail.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px;border-top:1px solid #f4f4f5;text-align:center;">
              <p style="margin:0;font-size:11px;color:#a1a1aa;">
                ConectaPlay &mdash; Conectando empresarios
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    })

    return NextResponse.json({ message: "OK" }, { status: 200 })
  } catch (error) {
    console.error("Reset password error:", error)
    // Still return 200 to not leak info
    return NextResponse.json({ message: "OK" }, { status: 200 })
  }
}
