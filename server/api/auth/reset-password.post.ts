import { defineEventHandler, readBody, createError } from 'h3'
import bcrypt from 'bcrypt'
import prisma from '~/server/utils/prisma'
import { hashPasswordResetToken } from '~/server/utils/password-reset'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ token?: string; password?: string }>(event)

  const token = body?.token?.trim()
  const password = body?.password ?? ''

  if (!token || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Token and new password are required.' })
  }

  if (password.length < 8) {
    throw createError({ statusCode: 400, statusMessage: 'Password must be at least 8 characters.' })
  }

  const tokenHash = hashPasswordResetToken(token)

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    select: { id: true, userId: true, expiresAt: true, usedAt: true },
  })

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    throw createError({ statusCode: 400, statusMessage: 'This reset link is invalid or has expired.' })
  }

  const passwordHash = await bcrypt.hash(password, 10)

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
    prisma.passwordResetToken.deleteMany({
      where: {
        userId: resetToken.userId,
        id: { not: resetToken.id },
      },
    }),
    prisma.session.deleteMany({ where: { userId: resetToken.userId } }),
  ])

  return { ok: true }
})
