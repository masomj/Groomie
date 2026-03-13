import { defineEventHandler, readBody } from 'h3'
import prisma from '~/server/utils/prisma'
import { generatePasswordResetToken } from '~/server/utils/password-reset'
import { sendPasswordResetEmail } from '~/server/utils/password-reset-email'

const GENERIC_MESSAGE = 'If an account exists for that email, a reset link has been sent.'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string }>(event)
  const email = body?.email?.trim().toLowerCase()

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: true, message: GENERIC_MESSAGE }
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return { ok: true, message: GENERIC_MESSAGE }
  }

  const { token, tokenHash, expiresAt } = generatePasswordResetToken()

  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } })
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  })

  const config = useRuntimeConfig()
  const resetUrl = `${config.appBaseUrl}/reset-password?token=${encodeURIComponent(token)}`

  await sendPasswordResetEmail({
    recipientEmail: user.email,
    recipientName: user.firstName || 'there',
    resetUrl,
  })

  return { ok: true, message: GENERIC_MESSAGE }
})
