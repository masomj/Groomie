import { defineEventHandler, getQuery, createError } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireAuth } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const query = getQuery(event)
  const sessionId = query.session_id as string

  if (!sessionId) {
    throw createError({ statusCode: 400, statusMessage: 'session_id is required.' })
  }

  const payment = await prisma.payment.findFirst({
    where: { checkoutSessionId: sessionId },
    include: {
      appointment: {
        include: {
          service: { select: { name: true } },
          dog: { select: { name: true } },
          invoiceItems: {
            include: {
              invoice: { select: { number: true } },
            },
            take: 1,
          },
        },
      },
    },
  })

  if (!payment) {
    throw createError({ statusCode: 404, statusMessage: 'Payment not found.' })
  }

  // Ownership check
  if (payment.appointment.userId !== user.id && user.role !== 'ADMIN') {
    throw createError({ statusCode: 403, statusMessage: 'Not authorized.' })
  }

  return {
    paymentStatus: payment.status,
    amountPence: payment.amountPence,
    serviceName: payment.appointment.service.name,
    dogName: payment.appointment.dog.name,
    invoiceNumber: payment.appointment.invoiceItems[0]?.invoice?.number || null,
  }
})
