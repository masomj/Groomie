import { defineEventHandler, getQuery, setHeaders } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireAdmin } from '~/server/utils/auth'
import { parseDateRange, toCsv } from '~/server/utils/reporting'

/**
 * GET /api/admin/exports/revenue.csv?from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 * Exports a revenue/tax snapshot CSV. One row per appointment that has a payment.
 * All monetary values are in pence (integer). See README for column docs.
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const query = getQuery(event)
  const { from, to } = parseDateRange(query.from as string, query.to as string)

  const appointments = await prisma.appointment.findMany({
    where: {
      dateTime: { gte: from, lte: to },
      payment: { isNot: null },
    },
    include: {
      user: { select: { email: true } },
      service: { select: { name: true } },
      payment: true,
      invoiceItems: {
        include: { invoice: { select: { number: true } } },
        take: 1,
      },
    },
    orderBy: { dateTime: 'asc' },
  })

  const headers = [
    'date',
    'appointmentId',
    'paymentId',
    'paymentStatus',
    'grossAmountPence',
    'refundedAmountPence',
    'netAmountPence',
    'invoiceNumber',
    'customerEmail',
    'serviceName',
    'taxYearHint',
    'notes',
  ]

  const rows = appointments.map((appt) => {
    const payment = appt.payment!
    const invoiceNumber = appt.invoiceItems[0]?.invoice?.number || ''
    const grossPence = payment.amountPence
    const refundedPence = payment.status === 'REFUNDED' ? payment.amountPence : 0
    const netPence = grossPence - refundedPence

    // UK tax year runs 6 Apr – 5 Apr. Derive a hint like "2025/26".
    const dt = appt.dateTime
    const year = dt.getUTCFullYear()
    const month = dt.getUTCMonth() + 1
    const day = dt.getUTCDate()
    const taxYearStart = (month > 4 || (month === 4 && day >= 6)) ? year : year - 1
    const taxYearHint = `${taxYearStart}/${String(taxYearStart + 1).slice(2)}`

    const notes = [
      appt.status !== 'COMPLETED' ? `appt:${appt.status}` : '',
      payment.status === 'FAILED' ? 'payment:FAILED' : '',
    ].filter(Boolean).join('; ')

    return [
      dt.toISOString().slice(0, 10),
      appt.id,
      payment.id,
      payment.status,
      String(grossPence),
      String(refundedPence),
      String(netPence),
      invoiceNumber,
      appt.user.email,
      appt.service.name,
      taxYearHint,
      notes,
    ]
  })

  const csv = toCsv(headers, rows)

  const fromLabel = (query.from as string).replace(/-/g, '')
  const toLabel = (query.to as string).replace(/-/g, '')

  setHeaders(event, {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="revenue_${fromLabel}_${toLabel}.csv"`,
  })

  return csv
})
