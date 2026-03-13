import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const body = await readBody<{
    startsAt?: string
    endsAt?: string
    reason?: string
  }>(event)

  if (!body.startsAt || !body.endsAt) {
    throw createError({ statusCode: 400, statusMessage: 'startsAt and endsAt are required.' })
  }

  const startsAt = new Date(body.startsAt)
  const endsAt = new Date(body.endsAt)

  if (isNaN(startsAt.getTime()) || isNaN(endsAt.getTime())) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid blockout date/time.' })
  }
  if (endsAt <= startsAt) {
    throw createError({ statusCode: 400, statusMessage: 'Blockout end must be after start.' })
  }

  const blockout = await prisma.blockoutPeriod.create({
    data: {
      startsAt,
      endsAt,
      reason: body.reason?.trim() || null,
    },
  })

  return { blockout }
})
