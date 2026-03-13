import { defineEventHandler, getQuery } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireAdmin } from '~/server/utils/auth'
import { parseDateRange } from '~/server/utils/reporting'

/**
 * GET /api/admin/reports/summary?from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 * Returns aggregate booking and revenue metrics for the given date range.
 * Dates are treated as inclusive UTC day boundaries:
 *   from = start of day (00:00:00.000Z)
 *   to   = end of day   (23:59:59.999Z)
 *
 * All monetary values are in pence (integer).
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const query = getQuery(event)
  const { from, to } = parseDateRange(query.from as string, query.to as string)

  const appointments = await prisma.appointment.findMany({
    where: { dateTime: { gte: from, lte: to } },
    select: {
      id: true,
      status: true,
      priceCharged: true,
      payment: {
        select: { status: true, amountPence: true },
      },
    },
  })

  const totalAppointments = appointments.length
  let completedCount = 0
  let cancelledCount = 0
  let noShowCount = 0
  let grossRevenuePence = 0
  let pendingRevenuePence = 0
  let refundedAmountPence = 0
  let averageBookingValuePence = 0
  const paymentStatusCounts: Record<string, number> = {
    PENDING: 0,
    PAID: 0,
    FAILED: 0,
    REFUNDED: 0,
  }

  for (const appt of appointments) {
    if (appt.status === 'COMPLETED') completedCount++
    if (appt.status === 'CANCELLED') cancelledCount++
    if (appt.status === 'NO_SHOW') noShowCount++

    if (appt.payment) {
      const ps = appt.payment.status
      paymentStatusCounts[ps] = (paymentStatusCounts[ps] || 0) + 1

      if (ps === 'PAID') {
        grossRevenuePence += appt.payment.amountPence
      } else if (ps === 'PENDING') {
        pendingRevenuePence += appt.payment.amountPence
      } else if (ps === 'REFUNDED') {
        refundedAmountPence += appt.payment.amountPence
      }
    }
  }

  const paidCount = paymentStatusCounts.PAID || 0
  averageBookingValuePence = paidCount > 0 ? Math.round(grossRevenuePence / paidCount) : 0

  return {
    from: from.toISOString(),
    to: to.toISOString(),
    totalAppointments,
    completedCount,
    cancelledCount,
    noShowCount,
    grossRevenuePence,
    pendingRevenuePence,
    refundedAmountPence,
    averageBookingValuePence,
    paymentStatusCounts,
  }
})
