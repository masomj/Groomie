import { createError, defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = event.context.params?.id
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Blockout ID is required.' })
  }

  await prisma.blockoutPeriod.delete({ where: { id } })
  return { ok: true }
})
