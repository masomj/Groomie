import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    name?: string
    email?: string
    phone?: string
    message?: string
  }>(event)

  if (!body?.name?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Name is required.' })
  }
  if (!body?.email?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Email is required.' })
  }

  const email = body.email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid email address.' })
  }

  const lead = await prisma.lead.create({
    data: {
      name: body.name.trim(),
      email,
      phone: body.phone?.trim() || null,
      message: body.message?.trim() || null,
    },
  })

  return { success: true, id: lead.id }
})
