import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = event.context.params?.id
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Dog ID is required.' })
  }

  const existing = await prisma.dog.findUnique({ where: { id } })
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Dog not found.' })
  }

  const body = await readBody<{
    ownerId?: string
    name?: string
    age?: number | null
    breed?: string | null
    sex?: 'MALE' | 'FEMALE' | null
    neutered?: boolean | null
    vaccinated?: boolean | null
    medicalHistory?: string | null
    dogFriendly?: 'YES' | 'NO' | 'UNSURE'
    peopleFriendly?: 'YES' | 'NO' | 'UNSURE'
    emergencyVetName?: string | null
    emergencyVetAddr?: string | null
    notes?: string | null
  }>(event)

  if (body.name !== undefined && !body.name.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Dog name cannot be empty.' })
  }
  if (body.sex !== undefined && body.sex !== null && !['MALE', 'FEMALE'].includes(body.sex)) {
    throw createError({ statusCode: 400, statusMessage: 'Sex must be MALE or FEMALE.' })
  }
  if (body.dogFriendly !== undefined && !['YES', 'NO', 'UNSURE'].includes(body.dogFriendly)) {
    throw createError({ statusCode: 400, statusMessage: 'dogFriendly must be YES, NO, or UNSURE.' })
  }
  if (body.peopleFriendly !== undefined && !['YES', 'NO', 'UNSURE'].includes(body.peopleFriendly)) {
    throw createError({ statusCode: 400, statusMessage: 'peopleFriendly must be YES, NO, or UNSURE.' })
  }
  if (body.age !== undefined && body.age !== null && (!Number.isInteger(body.age) || body.age < 0 || body.age > 40)) {
    throw createError({ statusCode: 400, statusMessage: 'Age must be a whole number between 0 and 40.' })
  }

  if (body.ownerId !== undefined) {
    const owner = await prisma.user.findUnique({ where: { id: body.ownerId }, select: { id: true } })
    if (!owner) {
      throw createError({ statusCode: 400, statusMessage: 'ownerId must reference an existing user.' })
    }
  }

  const data: Record<string, any> = {}
  if (body.ownerId !== undefined) data.ownerId = body.ownerId
  if (body.name !== undefined) data.name = body.name.trim()
  if (body.age !== undefined) data.age = body.age
  if (body.breed !== undefined) data.breed = body.breed?.trim() || null
  if (body.sex !== undefined) data.sex = body.sex || null
  if (body.neutered !== undefined) data.neutered = body.neutered
  if (body.vaccinated !== undefined) data.vaccinated = body.vaccinated
  if (body.medicalHistory !== undefined) data.medicalHistory = body.medicalHistory?.trim() || null
  if (body.dogFriendly !== undefined) data.dogFriendly = body.dogFriendly
  if (body.peopleFriendly !== undefined) data.peopleFriendly = body.peopleFriendly
  if (body.emergencyVetName !== undefined) data.emergencyVetName = body.emergencyVetName?.trim() || null
  if (body.emergencyVetAddr !== undefined) data.emergencyVetAddr = body.emergencyVetAddr?.trim() || null
  if (body.notes !== undefined) data.notes = body.notes?.trim() || null

  const dog = await prisma.dog.update({
    where: { id },
    data,
    include: {
      owner: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  })

  return { dog }
})
