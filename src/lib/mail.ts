import nodemailer from "nodemailer"
import path from "path"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 465,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendMail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  await transporter.sendMail({
    from: `"ConectaPlay" <${process.env.SMTP_FROM}>`,
    to,
    subject,
    html,
    attachments: [
      {
        filename: "icon.png",
        path: path.join(process.cwd(), "public", "icon.png"),
        cid: "logo@conectaplay",
      },
    ],
  })
}
