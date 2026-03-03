import { NextResponse } from "next/server"
import { sendMail } from "@/lib/mail"

export async function POST(request: Request) {
  try {
    const { email, fullName } = await request.json()

    if (!email || !fullName) {
      return NextResponse.json({ message: "Email e nome são obrigatórios." }, { status: 400 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const loginLink = `${appUrl}/login`

    await sendMail({
      to: email,
      subject: "Bem-vindo à Conecta Play! Seu cadastro foi aprovado",
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
              <div style="width:48px;height:48px;background:linear-gradient(135deg,#2563eb,#7c3aed);border-radius:12px;color:#fff;font-size:24px;font-weight:bold;line-height:48px;text-align:center;">C</div>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:0 32px 32px;text-align:center;">
              <h1 style="margin:0 0 8px;font-size:22px;color:#18181b;">Cadastro Aprovado!</h1>
              <p style="margin:0 0 24px;font-size:14px;color:#71717a;line-height:1.6;">
                Ola, <strong>${fullName.split(" ")[0]}</strong>! Seu cadastro na <strong>Conecta Play</strong> foi aprovado com sucesso. Agora voce tem acesso completo a plataforma para fazer networking, participar de reunioes e fechar negocios.
              </p>
              <a href="${loginLink}" style="display:inline-block;padding:14px 32px;background:linear-gradient(to right,#2563eb,#7c3aed);color:#ffffff;text-decoration:none;border-radius:12px;font-weight:600;font-size:14px;">
                Acessar Plataforma
              </a>
              <p style="margin:24px 0 0;font-size:12px;color:#a1a1aa;line-height:1.5;">
                Dica: Complete o perfil da sua empresa para aparecer nas buscas e receber mais conexoes!
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

    return NextResponse.json({ message: "Email enviado com sucesso." }, { status: 200 })
  } catch (error) {
    console.error("Approve email error:", error)
    return NextResponse.json({ message: "Erro ao enviar email." }, { status: 500 })
  }
}
