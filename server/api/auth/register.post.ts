import { defineEventHandler, readBody, createError } from 'h3'
import bcrypt from 'bcrypt'
import prisma from '~/server/utils/prisma'
import { createSession } from '~/server/utils/session'

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    email?: string
    password?: string
    firstName?: string
    lastName?: string
  }>(event)

  if (!body?.email || !body?.password || !body?.firstName || !body?.lastName) {
    throw createError({ statusCode: 400, statusMessage: 'Email, password, first name, and last name are required.' })
  }

  const email = body.email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid email address.' })
  }
  if (body.password.length < 8) {
    throw createError({ statusCode: 400, statusMessage: 'Password must be at least 8 characters.' })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    throw createError({ statusCode: 409, statusMessage: 'An account with this email already exists.' })
  }

  const passwordHash = await bcrypt.hash(body.password, 10)

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName: body.firstName.trim(),
      lastName: body.lastName.trim(),
      role: 'CUSTOMER',
    },
  })

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
