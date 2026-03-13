import { defineEventHandler, createError } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireAuth } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = event.context.params?.id
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Dog ID is required.' })
  }

  const dog = await prisma.dog.findUnique({ where: { id } })
  if (!dog) {
    throw createError({ statusCode: 404, statusMessage: 'Dog not found.' })
  }
  if (dog.ownerId !== user.id) {
    throw createError({ statusCode: 403, statusMessage: 'Access denied.' })
  }

  await prisma.dog.delete({ where: { id } })

  return { success: true }
})
