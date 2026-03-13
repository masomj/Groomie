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

  const body = await readBody<{ status?: string }>(event)

  if (!body?.status || !VALID_STATUSES.includes(body.status)) {
    throw createError({ statusCode: 400, statusMessage: `Status must be one of: ${VALID_STATUSES.join(', ')}` })
  }

  const appointment = await prisma.appointment.findUnique({ where: { id } })
  if (!appointment) {
    throw createError({ statusCode: 404, statusMessage: 'Appointment not found.' })
  }

  const updated = await prisma.appointment.update({
    where: { id },
    data: { status: body.status as any },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
      dog: { select: { id: true, name: true } },
      service: { select: { id: true, name: true } },
    },
  })

  return { appointment: updated }
})
