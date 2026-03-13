import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireAdmin } from '~/server/utils/auth'
import { isUserSuspended } from '~/server/utils/account-state'

const VALID_ROLES = ['CUSTOMER', 'ADMIN'] as const

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = event.context.params?.id
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'User ID is required.' })
  }

  const body = await readBody<{
    email?: string
    firstName?: string
    lastName?: string
    phone?: string | null
    role?: 'CUSTOMER' | 'ADMIN'
  }>(event)

  const existing = await prisma.user.findUnique({ where: { id } })
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'User not found.' })
  }

  const data: Record<string, any> = {}

  if (body.email !== undefined) {
    const email = body.email.trim().toLowerCase()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw createError({ statusCode: 400, statusMessage: 'A valid email is required.' })
    }

    const emailOwner = await prisma.user.findUnique({ where: { email } })
    if (emailOwner && emailOwner.id !== id) {
      throw createError({ statusCode: 409, statusMessage: 'That email address is already in use.' })
    }

    data.email = email
  }

  if (body.firstName !== undefined) {
    const firstName = body.firstName.trim()
    if (!firstName) {
      throw createError({ statusCode: 400, statusMessage: 'First name cannot be empty.' })
    }
    data.firstName = firstName
  }

  if (body.lastName !== undefined) {
    const lastName = body.lastName.trim()
    if (!lastName) {
      throw createError({ statusCode: 400, statusMessage: 'Last name cannot be empty.' })
    }
    data.lastName = lastName
  }

  if (body.phone !== undefined) {
    data.phone = body.phone?.trim() || null
  }

  if (body.role !== undefined) {
    if (!VALID_ROLES.includes(body.role)) {
      throw createError({ statusCode: 400, statusMessage: 'Role must be CUSTOMER or ADMIN.' })
    }
    data.role = body.role
  }

  const user = Object.keys(data).length
    ? await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
      },
    })
    : {
      id: existing.id,
      email: existing.email,
      firstName: existing.firstName,
      lastName: existing.lastName,
      phone: existing.phone,
      role: existing.role,
    }

  const suspended = await isUserSuspended(id)

  return {
    user: {
      ...user,
      suspended,
    },
  }
})
