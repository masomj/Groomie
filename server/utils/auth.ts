import { H3Event, createError } from 'h3'
import { getUserSession } from './session'

export async function requireAuth(event: H3Event) {
  const session = await getUserSession(event)
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: 'Authentication required.' })
  }
  return session.user
}

export async function requireAdmin(event: H3Event) {
  const user = await requireAuth(event)
  if (user.role !== 'ADMIN') {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required.' })
  }
  return user
}
