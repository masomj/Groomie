import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireAuth } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const appointments = await prisma.appointment.findMany({
    where: { userId: user.id },
    include: {
      dog: { select: { id: true, name: true, breed: true } },
      service: { select: { id: true, name: true } },
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
