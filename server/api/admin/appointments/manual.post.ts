import { createError, defineEventHandler, readBody } from 'h3'
import bcrypt from 'bcrypt'
import { randomUUID } from 'node:crypto'
import prisma from '~/server/utils/prisma'
import { requireAdmin } from '~/server/utils/auth'

type GuestPayload = {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  dogName?: string
  dogBreed?: string
  dogAge?: number | null
}

function toDateUtc(date: string, time: string) {
  return new Date(`${date}T${time}:00.000Z`)
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const body = await readBody<{
    serviceId?: string
    date?: string
    time?: string
    notes?: string
    status?: string
    existingUserId?: string
    existingDogId?: string
    guest?: GuestPayload
  }>(event)

  if (!body.serviceId) {
    throw createError({ statusCode: 400, statusMessage: 'Service is required.' })
  }
  if (!body.date || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
    throw createError({ statusCode: 400, statusMessage: 'A valid date is required.' })
  }
  if (!body.time || !/^([01]\d|2[0-3]):[0-5]\d$/.test(body.time)) {
    throw createError({ statusCode: 400, statusMessage: 'A valid time is required.' })
  }

  const dateTime = toDateUtc(body.date, body.time)
  if (isNaN(dateTime.getTime())) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid appointment date/time.' })
  }

  const service = await prisma.service.findUnique({ where: { id: body.serviceId } })
  if (!service || !service.active) {
    throw createError({ statusCode: 404, statusMessage: 'Service not found or not active.' })
  }

  let userId = body.existingUserId || ''
  let dogId = body.existingDogId || ''

  if (!userId || !dogId) {
    const guest = body.guest
    if (!guest?.firstName?.trim() || !guest?.lastName?.trim() || !guest?.dogName?.trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Guest first name, last name, and dog name are required when not booking for an existing customer.',
      })
    }

    const baseEmail = guest.email?.trim().toLowerCase()
    let email = baseEmail

    if (email) {
      const existing = await prisma.user.findUnique({ where: { email } })
      if (existing) {
        userId = existing.id
      }
    }

    if (!userId) {
      if (!email) {
        email = `guest-${randomUUID()}@pamperedpooch.local`
      }

      const passwordHash = await bcrypt.hash(randomUUID(), 10)
      const createdUser = await prisma.user.create({
        data: {
          email,
          passwordHash,
          role: 'CUSTOMER',
          firstName: guest.firstName.trim(),
          lastName: guest.lastName.trim(),
          phone: guest.phone?.trim() || null,
        },
      })
      userId = createdUser.id
    }

    const createdDog = await prisma.dog.create({
      data: {
        ownerId: userId,
        name: guest.dogName.trim(),
        breed: guest.dogBreed?.trim() || null,
        age: guest.dogAge ?? null,
      },
    })
    dogId = createdDog.id
  }

  const dog = await prisma.dog.findUnique({ where: { id: dogId } })
  if (!dog || dog.ownerId !== userId) {
    throw createError({ statusCode: 400, statusMessage: 'Selected dog does not belong to the selected customer.' })
  }

  const apptStart = dateTime.getTime()
  const apptEnd = apptStart + service.durationMin * 60 * 1000

  const [conflicts, blockouts] = await Promise.all([
    prisma.appointment.findMany({
      where: {
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

  const status = body.status && ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(body.status)
    ? body.status
    : 'CONFIRMED'

  const appointment = await prisma.appointment.create({
    data: {
      userId,
      dogId,
      serviceId: service.id,
      dateTime,
      durationMin: service.durationMin,
      priceCharged: service.priceFrom,
      status: status as any,
      notes: body.notes?.trim() || null,
    },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
      dog: { select: { id: true, name: true } },
      service: { select: { id: true, name: true } },
    },
  })

  return { appointment }
})
