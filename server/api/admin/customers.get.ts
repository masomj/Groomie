import { defineEventHandler, getQuery } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const query = getQuery(event)
  const search = typeof query.search === 'string' ? query.search.trim() : ''
  const status = typeof query.status === 'string' ? query.status : 'all'

  const where: Record<string, any> = { role: 'CUSTOMER' }
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
      { dogs: { some: { name: { contains: search, mode: 'insensitive' } } } },
    ]
  }

  const rawCustomers = await prisma.user.findMany({
    where,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      createdAt: true,
      updatedAt: true,
      dogs: {
        select: {
          id: true,
          name: true,
          breed: true,
          age: true,
          notes: true,
          medicalHistory: true,
        },
        orderBy: { name: 'asc' },
      },
      _count: {
        select: {
          dogs: true,
          appointments: true,
        },
      },
    },
    orderBy: [
      { firstName: 'asc' },
      { lastName: 'asc' },
    ],
    take: 500,
  })

  const customerIds = rawCustomers.map(c => c.id)
  const suspensionLogs = customerIds.length
    ? await prisma.auditLog.findMany({
      where: {
        entity: 'USER',
        entityId: { in: customerIds },
        action: { in: ['ACCOUNT_SUSPENDED', 'ACCOUNT_UNSUSPENDED'] },
      },
      select: {
        entityId: true,
        action: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    : []

  const suspendedByUserId = new Map<string, boolean>()
  for (const log of suspensionLogs) {
    if (!log.entityId || suspendedByUserId.has(log.entityId)) continue
    suspendedByUserId.set(log.entityId, log.action === 'ACCOUNT_SUSPENDED')
  }

  const customers = rawCustomers
    .map((customer) => {
      const suspended = suspendedByUserId.get(customer.id) || false
      return {
        ...customer,
        suspended,
        status: suspended ? 'inactive' : 'active',
      }
    })
    .filter((customer) => {
      if (status === 'active') return !customer.suspended
      if (status === 'inactive') return customer.suspended
      return true
    })

  return {
    customers,
    filters: {
      search,
      status: ['all', 'active', 'inactive'].includes(status) ? status : 'all',
    },
  }
})
