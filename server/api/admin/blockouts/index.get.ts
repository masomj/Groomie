import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const now = new Date()

  const blockouts = await prisma.blockoutPeriod.findMany({
    where: { endsAt: { gte: now } },
    orderBy: { startsAt: 'asc' },
    take: 200,
  })

  return { blockouts }
})
