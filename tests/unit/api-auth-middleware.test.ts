import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocked = vi.hoisted(() => ({
  requireAuth: vi.fn(async () => ({ id: 'u1', role: 'CUSTOMER' })),
  requireAdmin: vi.fn(async () => ({ id: 'a1', role: 'ADMIN' })),
}))

vi.mock('~/server/utils/auth', () => ({
  requireAuth: mocked.requireAuth,
  requireAdmin: mocked.requireAdmin,
}))
vi.mock('h3', () => ({
  defineEventHandler: (fn: any) => fn,
  getRequestURL: (event: any) => ({ pathname: event.path }),
}))

import apiAuthMiddleware from '../../server/middleware/api-auth'

describe('api auth middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('skips non-api routes', async () => {
    await apiAuthMiddleware({ method: 'GET', path: '/dashboard' } as any)
    expect(mocked.requireAuth).not.toHaveBeenCalled()
    expect(mocked.requireAdmin).not.toHaveBeenCalled()
  })

  it('allows public api routes', async () => {
    await apiAuthMiddleware({ method: 'GET', path: '/api/services' } as any)
    expect(mocked.requireAuth).not.toHaveBeenCalled()
    expect(mocked.requireAdmin).not.toHaveBeenCalled()
  })

  it('requires auth for protected non-admin api routes', async () => {
    await apiAuthMiddleware({ method: 'GET', path: '/api/dogs' } as any)
    expect(mocked.requireAuth).toHaveBeenCalledTimes(1)
    expect(mocked.requireAdmin).not.toHaveBeenCalled()
  })

  it('requires admin for admin api routes', async () => {
    await apiAuthMiddleware({ method: 'POST', path: '/api/admin/customers' } as any)
    expect(mocked.requireAdmin).toHaveBeenCalledTimes(1)
    expect(mocked.requireAuth).not.toHaveBeenCalled()
  })
})
