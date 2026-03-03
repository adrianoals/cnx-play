import crypto from "crypto"

const SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY!
const TOKEN_TTL_MS = 30 * 60 * 1000 // 30 minutes

function hmac(data: string): string {
  return crypto.createHmac("sha256", SECRET).update(data).digest("base64url")
}

export function generateResetToken(email: string): string {
  const payload = Buffer.from(`${email}|${Date.now()}`).toString("base64url")
  const signature = hmac(payload)
  return `${payload}.${signature}`
}

export function validateResetToken(token: string): { email: string } | null {
  const parts = token.split(".")
  if (parts.length !== 2) return null

  const [payload, signature] = parts

  if (hmac(payload) !== signature) return null

  const decoded = Buffer.from(payload, "base64url").toString("utf-8")
  const pipeIndex = decoded.lastIndexOf("|")
  if (pipeIndex === -1) return null

  const email = decoded.slice(0, pipeIndex)
  const timestamp = Number(decoded.slice(pipeIndex + 1))

  if (!email || isNaN(timestamp)) return null
  if (Date.now() - timestamp > TOKEN_TTL_MS) return null

  return { email }
}
