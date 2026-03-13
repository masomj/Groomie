import { defineEventHandler, getRequestURL } from 'h3'
import { requireAdmin, requireAuth } from '~/server/utils/auth'

const PUBLIC_API_PATHS = new Set([
  '/api/health',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/logout',
  '/api/auth/me',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/services',
  '/api/availability',
  '/api/leads',
  '/api/consent/active',
  '/api/webhooks/stripe',
])

export default defineEventHandler(async (event) => {
  if (event.method === 'OPTIONS') return

  const pathname = getRequestURL(event).pathname
  if (!pathname.startsWith('/api/')) return

  if (PUBLIC_API_PATHS.has(pathname)) return

  if (pathname.startsWith('/api/admin/')) {
    await requireAdmin(event)
    return
  }

  await requireAuth(event)
})
