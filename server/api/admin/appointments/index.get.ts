import { createError, defineEventHandler, getQuery } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireAdmin } from '~/server/utils/auth'

const VALID_STATUSES = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const query = getQuery(event)
  const status = query.status as string | undefined
  const customerId = query.customerId as string | undefined
  const dogId = query.dogId as string | undefined
  const search = typeof query.search === 'string' ? query.search.trim() : ''
  const from = query.from as string | undefined
  const to = query.to as string | undefined

  const where: Record<string, any> = {}
  if (status && VALID_STATUSES.includes(status)) {
    where.status = status
  }
  if (customerId) {
    where.userId = customerId
  }
  if (dogId) {
    where.dogId = dogId
  }

  if (from || to) {
    const dateRange: Record<string, Date> = {}
    if (from) {
      const parsedFrom = new Date(from)
      if (isNaN(parsedFrom.getTime())) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid from date filter.' })
      }
      dateRange.gte = parsedFrom
    }
    if (to) {
      const parsedTo = new Date(to)
      if (isNaN(parsedTo.getTime())) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid to date filter.' })
      }
      dateRange.lte = parsedTo
    }
    where.dateTime = dateRange
  }

  if (search) {
    where.OR = [
      { notes: { contains: search, mode: 'insensitive' } },
      { user: { is: { firstName: { contains: search, mode: 'insensitive' } } } },
      { user: { is: { lastName: { contains: search, mode: 'insensitive' } } } },
      { user: { is: { email: { contains: search, mode: 'insensitive' } } } },
      { dog: { is: { name: { contains: search, mode: 'insensitive' } } } },
      { dog: { is: { breed: { contains: search, mode: 'insensitive' } } } },
      { service: { is: { name: { contains: search, mode: 'insensitive' } } } },
    ]
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
    take: 500,
  })

  return {
    appointments,
    filters: {
      status: status && VALID_STATUSES.includes(status) ? status : '',
      customerId: customerId || '',
      dogId: dogId || '',
      search,
      from: from || '',
      to: to || '',
    },
  }
})
