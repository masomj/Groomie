import { defineEventHandler, readBody, createError } from 'h3'
import bcrypt from 'bcrypt'
import prisma from '~/server/utils/prisma'
import { createSession } from '~/server/utils/session'
import { isUserSuspended } from '~/server/utils/account-state'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string; password?: string }>(event)

  if (!body?.email || !body?.password) {
    throw createError({ statusCode: 400, statusMessage: 'Email and password are required.' })
  }

  const email = body.email.trim().toLowerCase()

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid email or password.' })
  }

  if (await isUserSuspended(user.id)) {
    throw createError({ statusCode: 403, statusMessage: 'This account is suspended. Please contact support.' })
  }

  const valid = await bcrypt.compare(body.password, user.passwordHash)
  if (!valid) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid email or password.' })
  }

  await createSession(event, user.id)

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    },
  }
})
