import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireAdmin } from '~/server/utils/auth'
import { isUserSuspended, setUserSuspendedState } from '~/server/utils/account-state'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)

  const id = event.context.params?.id
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'User ID is required.' })
  }

  const body = await readBody<{
    suspended?: boolean
    reason?: string | null
    invalidateSessions?: boolean
  }>(event)

  if (typeof body?.suspended !== 'boolean') {
    throw createError({ statusCode: 400, statusMessage: 'suspended must be true or false.' })
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
    },
  })

  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'User not found.' })
  }

  if (admin.id === id && body.suspended) {
    throw createError({ statusCode: 400, statusMessage: 'You cannot suspend your own account.' })
  }

  await setUserSuspendedState({
    adminUserId: admin.id,
    userId: id,
    suspended: body.suspended,
    reason: body.reason,
  })

  if (body.suspended || body.invalidateSessions !== false) {
    await prisma.session.deleteMany({ where: { userId: id } })
  }

  const suspended = await isUserSuspended(id)

  return {
    user: {
      ...user,
      suspended,
    },
  }
})
