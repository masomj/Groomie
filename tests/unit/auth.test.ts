import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocked = vi.hoisted(() => ({
  getUserSession: vi.fn(),
}))

vi.mock('~/server/utils/session', () => ({
  getUserSession: mocked.getUserSession,
}))

vi.mock('h3', () => ({
  createError: ({ statusCode, statusMessage }: any) =>
    Object.assign(new Error(statusMessage), { statusCode, statusMessage }),
}))

import { requireAuth, requireAdmin } from '../../server/utils/auth'

describe('auth utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('requireAuth rejects when no session exists', async () => {
    mocked.getUserSession.mockResolvedValue(null)
    await expect(requireAuth({} as any)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('requireAuth returns session user', async () => {
    mocked.getUserSession.mockResolvedValue({ user: { id: 'u1', role: 'CUSTOMER' } })
    await expect(requireAuth({} as any)).resolves.toEqual({ id: 'u1', role: 'CUSTOMER' })
  })

  it('requireAdmin rejects non-admin users', async () => {
    mocked.getUserSession.mockResolvedValue({ user: { id: 'u1', role: 'CUSTOMER' } })
    await expect(requireAdmin({} as any)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('requireAdmin allows admins', async () => {
    mocked.getUserSession.mockResolvedValue({ user: { id: 'a1', role: 'ADMIN' } })
    await expect(requireAdmin({} as any)).resolves.toEqual({ id: 'a1', role: 'ADMIN' })
  })
})
