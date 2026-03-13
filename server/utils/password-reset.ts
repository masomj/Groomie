import { randomBytes, createHash } from 'node:crypto'

export const PASSWORD_RESET_TOKEN_TTL_MS = 30 * 60 * 1000 // 30 minutes

export function generatePasswordResetToken() {
  const token = randomBytes(32).toString('hex')
  return {
    token,
    tokenHash: hashPasswordResetToken(token),
    expiresAt: new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS),
  }
}

export function hashPasswordResetToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}
