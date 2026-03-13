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

  const id = event.context.params?.id
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Slot ID is required.' })
  }

  const body = await readBody<{
    dayOfWeek?: number
    startTime?: string
    endTime?: string
    active?: boolean
  }>(event)

  const existing = await prisma.availabilitySlot.findUnique({ where: { id } })
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Availability slot not found.' })
  }

  const dayOfWeek = body.dayOfWeek ?? existing.dayOfWeek
  const startTime = body.startTime ?? existing.startTime
  const endTime = body.endTime ?? existing.endTime

  if (dayOfWeek < 0 || dayOfWeek > 6) {
    throw createError({ statusCode: 400, statusMessage: 'dayOfWeek must be between 0 and 6.' })
  }
  if (!isValidTime(startTime) || !isValidTime(endTime)) {
    throw createError({ statusCode: 400, statusMessage: 'startTime and endTime must be in HH:MM format.' })
  }
  if (minutes(endTime) <= minutes(startTime)) {
    throw createError({ statusCode: 400, statusMessage: 'endTime must be after startTime.' })
  }

  try {
    const slot = await prisma.availabilitySlot.update({
      where: { id },
      data: {
        dayOfWeek,
        startTime,
        endTime,
        active: body.active ?? existing.active,
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
