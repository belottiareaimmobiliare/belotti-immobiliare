import crypto from 'crypto'

export const ADMIN_QR_SESSION_COOKIE = 'admin_qr_session'
const ADMIN_QR_SESSION_MAX_AGE = 60 * 60 * 12

function getSecret() {
  const secret = process.env.ADMIN_QR_SESSION_SECRET

  if (!secret) {
    throw new Error('ADMIN_QR_SESSION_SECRET non configurato')
  }

  return secret
}

function sign(value: string) {
  return crypto.createHmac('sha256', getSecret()).update(value).digest('base64url')
}

export function createAdminQrSessionToken(profileId: string) {
  const payload = {
    profileId,
    exp: Math.floor(Date.now() / 1000) + ADMIN_QR_SESSION_MAX_AGE,
  }

  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
  const signature = sign(encoded)

  return `${encoded}.${signature}`
}

export function verifyAdminQrSessionToken(token: string) {
  const [encoded, signature] = token.split('.')

  if (!encoded || !signature) return null

  const expected = sign(encoded)

  if (signature.length !== expected.length) return null

  const isValid = crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  )

  if (!isValid) return null

  try {
    const payload = JSON.parse(
      Buffer.from(encoded, 'base64url').toString('utf8')
    ) as { profileId?: string; exp?: number }

    if (!payload.profileId || !payload.exp) return null
    if (payload.exp < Math.floor(Date.now() / 1000)) return null

    return { profileId: payload.profileId }
  } catch {
    return null
  }
}

export function getAdminQrSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: ADMIN_QR_SESSION_MAX_AGE,
  }
}

export function getExpiredAdminQrSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 0,
  }
}