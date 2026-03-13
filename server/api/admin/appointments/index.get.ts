import { defineEventHandler, getQuery } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const query = getQuery(event)
  const status = query.status as string | undefined

  const where: Record<string, any> = {}
  if (status && ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(status)) {
    where.status = status
  }

  const appointments = await prisma.appointment.findMany({
    where,
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
      dog: { select: { id: true, name: true, breed: true } },
      service: { select: { id: true, name: true } },
      consentRecords: {
        select: {
          id: true,
          accepted: true,
          capturedAt: true,
          payload: true,
          template: { select: { id: true, title: true, version: true } },
        },
        orderBy: { capturedAt: 'desc' },
        take: 1,
      },
      payment: {
        select: { id: true, status: true, amountPence: true, paidAt: true },
      },
      invoiceItems: {
        include: {
          invoice: { select: { id: true, number: true, status: true } },
        },
        take: 1,
      },
    },
    orderBy: { dateTime: 'desc' },
  })

  return { appointments }
})
