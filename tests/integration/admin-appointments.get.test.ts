import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocked = vi.hoisted(() => ({
  requireAdmin: vi.fn(async () => ({ id: 'admin-1', role: 'ADMIN' })),
  findMany: vi.fn(),
}))

vi.mock('~/server/utils/auth', () => ({ requireAdmin: mocked.requireAdmin }))
vi.mock('~/server/utils/prisma', () => ({
  default: {
    appointment: { findMany: mocked.findMany },
  },
}))
vi.mock('h3', () => ({
  defineEventHandler: (fn: any) => fn,
  getQuery: (event: any) => event.query || {},
  createError: ({ statusCode, statusMessage }: any) => {
    const err: any = new Error(statusMessage)
    err.statusCode = statusCode
    throw err
  },
}))

import handler from '../../server/api/admin/appointments/index.get'

describe('GET /api/admin/appointments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocked.findMany.mockResolvedValue([])
  })

  it('requires admin and returns appointments collection', async () => {
    const result = await handler({ query: {} } as any)
    expect(mocked.requireAdmin).toHaveBeenCalledTimes(1)
    expect(mocked.findMany).toHaveBeenCalledTimes(1)
    expect(result).toHaveProperty('appointments')
  })

  it('applies status/date/customer filters', async () => {
    await handler({ query: { status: 'CONFIRMED', customerId: 'u1', from: '2026-03-01', to: '2026-03-05' } } as any)
    const args = mocked.findMany.mock.calls[0][0]
    expect(args.where.status).toBe('CONFIRMED')
    expect(args.where.userId).toBe('u1')
    expect(args.where.dateTime).toBeTruthy()
  })
})
