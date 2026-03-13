import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireAdmin } from '~/server/utils/auth'

function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
}

function minutes(value: string) {
  const parts = value.split(':')
  const h = Number(parts[0] ?? 0)
  const m = Number(parts[1] ?? 0)
  return h * 60 + m
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const body = await readBody<{
    dayOfWeek?: number
    startTime?: string
    endTime?: string
    active?: boolean
  }>(event)

  if (body.dayOfWeek === undefined || body.dayOfWeek < 0 || body.dayOfWeek > 6) {
    throw createError({ statusCode: 400, statusMessage: 'dayOfWeek must be between 0 and 6.' })
  }
  if (!body.startTime || !isValidTime(body.startTime)) {
    throw createError({ statusCode: 400, statusMessage: 'startTime must be in HH:MM format.' })
  }
  if (!body.endTime || !isValidTime(body.endTime)) {
    throw createError({ statusCode: 400, statusMessage: 'endTime must be in HH:MM format.' })
  }
  if (minutes(body.endTime) <= minutes(body.startTime)) {
    throw createError({ statusCode: 400, statusMessage: 'endTime must be after startTime.' })
  }

  try {
    const slot = await prisma.availabilitySlot.create({
      data: {
        dayOfWeek: body.dayOfWeek,
        startTime: body.startTime,
        endTime: body.endTime,
        active: body.active ?? true,
      },
    })

    return { slot }
  } catch (e: any) {
    if (e?.code === 'P2002') {
      throw createError({ statusCode: 409, statusMessage: 'A slot already exists for this day and start time.' })
    }
    throw e
  }
})
