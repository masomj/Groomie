import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireAuth } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = event.context.params?.id
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Dog ID is required.' })
  }

  const existing = await prisma.dog.findUnique({ where: { id } })
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Dog not found.' })
  }
  if (existing.ownerId !== user.id) {
    throw createError({ statusCode: 403, statusMessage: 'Access denied.' })
  }

  const body = await readBody<{
    name?: string
    age?: number | null
    breed?: string | null
    sex?: string | null
    neutered?: boolean | null
    vaccinated?: boolean | null
    medicalHistory?: string | null
    dogFriendly?: string
    peopleFriendly?: string
    emergencyVetName?: string | null
    emergencyVetAddr?: string | null
    notes?: string | null
  }>(event)

  if (body.name !== undefined && !body.name?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Dog name cannot be empty.' })
  }
  if (body.sex !== undefined && body.sex !== null && !['MALE', 'FEMALE'].includes(body.sex)) {
    throw createError({ statusCode: 400, statusMessage: 'Sex must be MALE or FEMALE.' })
  }
  if (body.dogFriendly && !['YES', 'NO', 'UNSURE'].includes(body.dogFriendly)) {
    throw createError({ statusCode: 400, statusMessage: 'dogFriendly must be YES, NO, or UNSURE.' })
  }
  if (body.peopleFriendly && !['YES', 'NO', 'UNSURE'].includes(body.peopleFriendly)) {
    throw createError({ statusCode: 400, statusMessage: 'peopleFriendly must be YES, NO, or UNSURE.' })
  }

  const data: Record<string, any> = {}
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
  })

  return { dog }
})
