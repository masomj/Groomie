import { createError, defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireAdmin } from '~/server/utils/auth'
import { isUserSuspended } from '~/server/utils/account-state'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = event.context.params?.id
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'User ID is required.' })
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
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
          updatedAt: true,
        },
        orderBy: { name: 'asc' },
      },
      appointments: {
        include: {
          dog: { select: { id: true, name: true, breed: true } },
          service: { select: { id: true, name: true } },
          payment: { select: { id: true, status: true, amountPence: true, paidAt: true } },
        },
        orderBy: { dateTime: 'desc' },
        take: 200,
      },
      _count: {
        select: {
          dogs: true,
          appointments: true,
        },
      },
    },
  })

  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'User not found.' })
  }

  const suspended = await isUserSuspended(user.id)

  return {
    user: {
      ...user,
      suspended,
      status: suspended ? 'inactive' : 'active',
    },
  }
})
