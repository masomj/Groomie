import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireAdmin } from '~/server/utils/auth'

const VALID_STATUSES = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = event.context.params?.id
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Appointment ID is required.' })
  }

  const body = await readBody<{
    status?: string
    userId?: string
    dogId?: string
    serviceId?: string
    dateTime?: string
    durationMin?: number
    priceCharged?: number | null
    notes?: string | null
  }>(event)

  const appointment = await prisma.appointment.findUnique({ where: { id } })
  if (!appointment) {
    throw createError({ statusCode: 404, statusMessage: 'Appointment not found.' })
  }

  if (body.status !== undefined && !VALID_STATUSES.includes(body.status)) {
    throw createError({ statusCode: 400, statusMessage: `Status must be one of: ${VALID_STATUSES.join(', ')}` })
  }

  const data: Record<string, any> = {}

  if (body.userId !== undefined) {
    const user = await prisma.user.findUnique({ where: { id: body.userId }, select: { id: true } })
    if (!user) {
      throw createError({ statusCode: 400, statusMessage: 'userId must reference an existing user.' })
    }
    data.userId = body.userId
  }

  if (body.dogId !== undefined) {
    const dog = await prisma.dog.findUnique({ where: { id: body.dogId }, select: { id: true, ownerId: true } })
    if (!dog) {
      throw createError({ statusCode: 400, statusMessage: 'dogId must reference an existing dog.' })
    }
    data.dogId = body.dogId
  }

  if (body.serviceId !== undefined) {
    const service = await prisma.service.findUnique({ where: { id: body.serviceId }, select: { id: true, durationMin: true } })
    if (!service) {
      throw createError({ statusCode: 400, statusMessage: 'serviceId must reference an existing service.' })
    }
    data.serviceId = service.id
    if (body.durationMin === undefined) {
      data.durationMin = service.durationMin
    }
  }

  if (body.dateTime !== undefined) {
    const dt = new Date(body.dateTime)
    if (isNaN(dt.getTime())) {
      throw createError({ statusCode: 400, statusMessage: 'dateTime must be a valid ISO datetime string.' })
    }
    data.dateTime = dt
  }

  if (body.durationMin !== undefined) {
    if (!Number.isInteger(body.durationMin) || body.durationMin <= 0 || body.durationMin > 12 * 60) {
      throw createError({ statusCode: 400, statusMessage: 'durationMin must be an integer between 1 and 720.' })
    }
    data.durationMin = body.durationMin
  }

  if (body.priceCharged !== undefined) {
    if (body.priceCharged !== null && (!Number.isInteger(body.priceCharged) || body.priceCharged < 0)) {
      throw createError({ statusCode: 400, statusMessage: 'priceCharged must be null or a non-negative integer (pence).' })
    }
    data.priceCharged = body.priceCharged
  }

  if (body.status !== undefined) {
    data.status = body.status
  }

  if (body.notes !== undefined) {
    data.notes = body.notes?.trim() || null
  }

  const nextUserId = (data.userId ?? appointment.userId) as string
  const nextDogId = (data.dogId ?? appointment.dogId) as string

  const dogForOwnership = await prisma.dog.findUnique({ where: { id: nextDogId }, select: { ownerId: true } })
  if (!dogForOwnership || dogForOwnership.ownerId !== nextUserId) {
    throw createError({ statusCode: 400, statusMessage: 'Selected dog does not belong to the selected user.' })
  }

  const scheduleChanged = data.dateTime !== undefined || data.durationMin !== undefined
  if (scheduleChanged) {
    const nextDate = (data.dateTime ?? appointment.dateTime) as Date
    const nextDurationMin = (data.durationMin ?? appointment.durationMin) as number
    const apptStart = new Date(nextDate).getTime()
    const apptEnd = apptStart + nextDurationMin * 60 * 1000

    const [conflicts, blockouts] = await Promise.all([
      prisma.appointment.findMany({
        where: {
          id: { not: id },
          dateTime: {
            gte: new Date(apptStart - 24 * 60 * 60 * 1000),
            lte: new Date(apptEnd + 24 * 60 * 60 * 1000),
          },
          status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        },
        select: { dateTime: true, durationMin: true },
      }),
      prisma.blockoutPeriod.findMany({
        where: {
          startsAt: { lt: new Date(apptEnd) },
          endsAt: { gt: new Date(apptStart) },
        },
        select: { id: true },
        take: 1,
      }),
    ])

    const hasConflict = conflicts.some((c) => {
      const cStart = new Date(c.dateTime).getTime()
      const cEnd = cStart + c.durationMin * 60 * 1000
      return apptStart < cEnd && apptEnd > cStart
    })

    if (hasConflict) {
      throw createError({ statusCode: 409, statusMessage: 'This time slot overlaps an existing appointment.' })
    }
    if (blockouts.length > 0) {
      throw createError({ statusCode: 409, statusMessage: 'This time slot is blocked out.' })
    }
  }

  if (Object.keys(data).length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No update fields were provided.' })
  }

  const updated = await prisma.appointment.update({
    where: { id },
    data,
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
      dog: { select: { id: true, name: true } },
      service: { select: { id: true, name: true } },
    },
  })

  return { appointment: updated }
})
