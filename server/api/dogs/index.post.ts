import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireAuth } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const body = await readBody<{
    name?: string
    age?: number
    breed?: string
    sex?: string
    neutered?: boolean
    vaccinated?: boolean
    medicalHistory?: string
    dogFriendly?: string
    peopleFriendly?: string
    emergencyVetName?: string
    emergencyVetAddr?: string
    notes?: string
  }>(event)

  if (!body?.name?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Dog name is required.' })
  }

  if (body.sex && !['MALE', 'FEMALE'].includes(body.sex)) {
    throw createError({ statusCode: 400, statusMessage: 'Sex must be MALE or FEMALE.' })
  }
  if (body.dogFriendly && !['YES', 'NO', 'UNSURE'].includes(body.dogFriendly)) {
    throw createError({ statusCode: 400, statusMessage: 'dogFriendly must be YES, NO, or UNSURE.' })
  }
  if (body.peopleFriendly && !['YES', 'NO', 'UNSURE'].includes(body.peopleFriendly)) {
    throw createError({ statusCode: 400, statusMessage: 'peopleFriendly must be YES, NO, or UNSURE.' })
  }
  if (body.age !== undefined && body.age !== null && (typeof body.age !== 'number' || body.age < 0)) {
    throw createError({ statusCode: 400, statusMessage: 'Age must be a non-negative number.' })
  }

  const dog = await prisma.dog.create({
    data: {
      ownerId: user.id,
      name: body.name.trim(),
      age: body.age ?? null,
      breed: body.breed?.trim() || null,
      sex: (body.sex as any) || null,
      neutered: body.neutered ?? null,
      vaccinated: body.vaccinated ?? null,
      medicalHistory: body.medicalHistory?.trim() || null,
      dogFriendly: (body.dogFriendly as any) || 'UNSURE',
      peopleFriendly: (body.peopleFriendly as any) || 'UNSURE',
      emergencyVetName: body.emergencyVetName?.trim() || null,
      emergencyVetAddr: body.emergencyVetAddr?.trim() || null,
      notes: body.notes?.trim() || null,
    },
  })

  return { dog }
})
