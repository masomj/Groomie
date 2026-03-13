import { createError, defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = event.context.params?.id
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Slot ID is required.' })
  }

  await prisma.availabilitySlot.delete({ where: { id } })
  return { ok: true }
})
