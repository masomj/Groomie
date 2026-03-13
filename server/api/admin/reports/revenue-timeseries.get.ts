import { defineEventHandler, getQuery, createError } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireAdmin } from '~/server/utils/auth'
import { parseDateRange } from '~/server/utils/reporting'

type GroupBy = 'day' | 'week' | 'month'

/**
 * GET /api/admin/reports/revenue-timeseries?from=YYYY-MM-DD&to=YYYY-MM-DD&groupBy=day|week|month
 *
 * Returns timeseries buckets with appointment counts and revenue totals.
 * Dates are UTC day boundaries. groupBy defaults to "day".
 * All monetary values are in pence (integer).
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const query = getQuery(event)
  const { from, to } = parseDateRange(query.from as string, query.to as string)
  const groupBy = validateGroupBy(query.groupBy as string | undefined)

  const appointments = await prisma.appointment.findMany({
    where: { dateTime: { gte: from, lte: to } },
    select: {
      dateTime: true,
      status: true,
      payment: {
        select: { status: true, amountPence: true },
      },
    },
    orderBy: { dateTime: 'asc' },
  })

  const buckets = new Map<string, {
    period: string
    appointmentCount: number
    completedCount: number
    grossRevenuePence: number
    paidCount: number
  }>()

  for (const appt of appointments) {
    const key = getBucketKey(appt.dateTime, groupBy)

    if (!buckets.has(key)) {
      buckets.set(key, {
        period: key,
        appointmentCount: 0,
        completedCount: 0,
        grossRevenuePence: 0,
        paidCount: 0,
      })
    }

    const bucket = buckets.get(key)!
    bucket.appointmentCount++
    if (appt.status === 'COMPLETED') bucket.completedCount++
    if (appt.payment?.status === 'PAID') {
      bucket.grossRevenuePence += appt.payment.amountPence
      bucket.paidCount++
    }
  }

  return {
    from: from.toISOString(),
    to: to.toISOString(),
    groupBy,
    series: Array.from(buckets.values()),
  }
})

function validateGroupBy(value: string | undefined): GroupBy {
  if (!value) return 'day'
  if (['day', 'week', 'month'].includes(value)) return value as GroupBy
  throw createError({ statusCode: 400, statusMessage: 'groupBy must be "day", "week", or "month".' })
}

function getBucketKey(date: Date, groupBy: GroupBy): string {
  const d = new Date(date)
  const year = d.getUTCFullYear()
  const month = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')

  switch (groupBy) {
    case 'day':
      return `${year}-${month}-${day}`
    case 'week': {
      // ISO week: find Monday of the week
      const dow = d.getUTCDay() || 7 // convert Sunday=0 to 7
      const monday = new Date(d)
      monday.setUTCDate(d.getUTCDate() - dow + 1)
      const wy = monday.getUTCFullYear()
      const wm = String(monday.getUTCMonth() + 1).padStart(2, '0')
      const wd = String(monday.getUTCDate()).padStart(2, '0')
      return `${wy}-${wm}-${wd}`
    }
    case 'month':
      return `${year}-${month}`
  }
}
