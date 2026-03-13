import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireAuth } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = event.context.params?.id
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Appointment ID is required.' })
  }

  const appointment = await prisma.appointment.findUnique({ where: { id } })
  if (!appointment) {
    throw createError({ statusCode: 404, statusMessage: 'Appointment not found.' })
  }
  if (appointment.userId !== user.id) {
    throw createError({ statusCode: 403, statusMessage: 'Access denied.' })
  }

  const body = await readBody<{
    action?: 'cancel' | 'reschedule'
    dateTime?: string
  }>(event)

  if (!body?.action || !['cancel', 'reschedule'].includes(body.action)) {
    throw createError({ statusCode: 400, statusMessage: 'Action must be "cancel" or "reschedule".' })
  }

  // Policy: can only modify PENDING or CONFIRMED, at least 24h before
  if (!['PENDING', 'CONFIRMED'].includes(appointment.status)) {
    throw createError({ statusCode: 400, statusMessage: 'This appointment can no longer be modified.' })
  }
  const hoursUntil = (new Date(appointment.dateTime).getTime() - Date.now()) / (1000 * 60 * 60)
  if (hoursUntil < 24) {
    throw createError({ statusCode: 400, statusMessage: 'Appointments can only be modified at least 24 hours in advance.' })
  }

  if (body.action === 'cancel') {
    const updated = await prisma.appointment.update({
      where: { id },
      data: { status: 'CANCELLED' },
    })
    return { appointment: updated }
  }

  // Reschedule
  if (!body.dateTime) {
    throw createError({ statusCode: 400, statusMessage: 'New date/time is required for rescheduling.' })
  }
  const newDt = new Date(body.dateTime)
  if (isNaN(newDt.getTime())) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid date/time format.' })
  }
  if (newDt.getTime() <= Date.now()) {
    throw createError({ statusCode: 400, statusMessage: 'New appointment time must be in the future.' })
  }

  // Conflict check with transaction
  const updated = await prisma.$transaction(async (tx) => {
    const apptStart = newDt.getTime()
    const apptEnd = apptStart + appointment.durationMin * 60 * 1000

    const conflicts = await tx.appointment.findMany({
      where: {
        id: { not: id },
        dateTime: {
          gte: new Date(apptStart - 24 * 60 * 60 * 1000),
          lte: new Date(apptEnd + 24 * 60 * 60 * 1000),
        },
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      },
    })

    const hasConflict = conflicts.some((c) => {
      const cStart = new Date(c.dateTime).getTime()
      const cEnd = cStart + c.durationMin * 60 * 1000
      return apptStart < cEnd && apptEnd > cStart
    })

    if (hasConflict) {
      throw createError({ statusCode: 409, statusMessage: 'This time slot is not available.' })
    }

    return tx.appointment.update({
      where: { id },
      data: { dateTime: newDt, status: 'PENDING' },
    })
  })

  return { appointment: updated }
})
