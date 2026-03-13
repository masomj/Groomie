import { defineEventHandler, getQuery, setHeaders } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireAdmin } from '~/server/utils/auth'
import { parseDateRange, toCsv } from '~/server/utils/reporting'

/**
 * GET /api/admin/exports/appointments.csv?from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 * Exports appointments as CSV with booking, customer, dog, consent, and payment info.
 * All monetary values are in pence (integer). See README for column docs.
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const query = getQuery(event)
  const { from, to } = parseDateRange(query.from as string, query.to as string)

  const appointments = await prisma.appointment.findMany({
    where: { dateTime: { gte: from, lte: to } },
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
      dog: { select: { name: true, breed: true } },
      service: { select: { name: true } },
      consentRecords: {
        select: {
          accepted: true,
          template: { select: { version: true } },
        },
        orderBy: { capturedAt: 'desc' },
        take: 1,
      },
      payment: {
        select: { status: true },
      },
      invoiceItems: {
        include: { invoice: { select: { number: true } } },
        take: 1,
      },
    },
    orderBy: { dateTime: 'asc' },
  })

  const headers = [
    'appointmentId',
    'dateTime',
    'status',
    'serviceName',
    'durationMinutes',
    'priceChargedPence',
    'customerName',
    'customerEmail',
    'dogName',
    'breed',
    'consentCaptured',
    'consentTemplateVersion',
    'paymentStatus',
    'invoiceNumber',
  ]

  const rows = appointments.map((appt) => {
    const consent = appt.consentRecords[0]
    const invoiceNumber = appt.invoiceItems[0]?.invoice?.number || ''

    return [
      appt.id,
      appt.dateTime.toISOString(),
      appt.status,
      appt.service.name,
      String(appt.durationMin),
      appt.priceCharged != null ? String(appt.priceCharged) : '',
      `${appt.user.firstName} ${appt.user.lastName}`,
      appt.user.email,
      appt.dog.name,
      appt.dog.breed || '',
      consent ? 'yes' : 'no',
      consent ? String(consent.template.version) : '',
      appt.payment?.status || '',
      invoiceNumber,
    ]
  })

  const csv = toCsv(headers, rows)

  const fromLabel = (query.from as string).replace(/-/g, '')
  const toLabel = (query.to as string).replace(/-/g, '')

  setHeaders(event, {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="appointments_${fromLabel}_${toLabel}.csv"`,
  })

  return csv
})
