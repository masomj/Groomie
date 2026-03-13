import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const body = await readBody<{
    ownerId?: string
    name?: string
    age?: number | null
    breed?: string | null
    notes?: string | null
    specialRequirements?: string | null
    medicalHistory?: string | null
  }>(event)

  if (!body.ownerId) {
    throw createError({ statusCode: 400, statusMessage: 'ownerId is required.' })
  }
  if (!body.name?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Dog name is required.' })
  }
  if (body.age !== undefined && body.age !== null && (!Number.isInteger(body.age) || body.age < 0 || body.age > 40)) {
    throw createError({ statusCode: 400, statusMessage: 'Age must be a whole number between 0 and 40.' })
  }

  const owner = await prisma.user.findUnique({
    where: { id: body.ownerId },
    select: { id: true },
  })
  if (!owner) {
    throw createError({ statusCode: 400, statusMessage: 'ownerId must reference an existing user.' })
  }

  const dog = await prisma.dog.create({
    data: {
      ownerId: owner.id,
      name: body.name.trim(),
      age: body.age ?? null,
      breed: body.breed?.trim() || null,
      notes: body.notes?.trim() || null,
      medicalHistory: body.specialRequirements?.trim() || body.medicalHistory?.trim() || null,
    },
    include: {
      owner: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  })

  return { dog }
})
