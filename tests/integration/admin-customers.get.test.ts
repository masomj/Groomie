import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocked = vi.hoisted(() => ({
  requireAdmin: vi.fn(async () => ({ id: 'admin-1', role: 'ADMIN' })),
  findMany: vi.fn(),
}))

vi.mock('~/server/utils/auth', () => ({ requireAdmin: mocked.requireAdmin }))
vi.mock('~/server/utils/prisma', () => ({
  default: {
    user: { findMany: mocked.findMany },
    appointment: { count: vi.fn(async () => 0) },
  },
}))
vi.mock('h3', () => ({
  defineEventHandler: (fn: any) => fn,
  getQuery: (event: any) => event.query || {},
}))

import handler from '../../server/api/admin/customers.get'

describe('GET /api/admin/customers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocked.findMany.mockResolvedValue([])
  })

  it('requires admin and fetches customer list', async () => {
    const result = await handler({ query: {} } as any)
    expect(mocked.requireAdmin).toHaveBeenCalledTimes(1)
    expect(mocked.findMany).toHaveBeenCalledTimes(1)
    expect(result).toHaveProperty('customers')
  })

  it('applies search query parameter', async () => {
    await handler({ query: { search: 'rex', status: 'suspended' } } as any)
    const args = mocked.findMany.mock.calls[0][0]
    expect(args.where.role).toBe('CUSTOMER')
    expect(args.where.OR).toBeTruthy()
  })
})
