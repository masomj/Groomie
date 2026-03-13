import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocked = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  getQuery: vi.fn(),
  findFirst: vi.fn(),
}))

vi.mock('~/server/utils/auth', () => ({
  requireAuth: mocked.requireAuth,
}))

vi.mock('~/server/utils/prisma', () => ({
  default: {
    payment: { findFirst: mocked.findFirst },
  },
}))

vi.mock('h3', () => ({
  defineEventHandler: (fn: any) => fn,
  getQuery: (event: any) => mocked.getQuery(event),
  createError: ({ statusCode, statusMessage }: any) =>
    Object.assign(new Error(statusMessage), { statusCode, statusMessage }),
}))

import handler from '../../server/api/payments/status.get'

describe('GET /api/payments/status', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocked.requireAuth.mockResolvedValue({ id: 'u1', role: 'CUSTOMER' })
    mocked.getQuery.mockReturnValue({ session_id: 'cs_1' })
    mocked.findFirst.mockResolvedValue({
      status: 'PAID',
      amountPence: 4000,
      appointment: {
        userId: 'u1',
        service: { name: 'Nail Trim' },
        dog: { name: 'Rex' },
        invoiceItems: [{ invoice: { number: 'INV-42' } }],
      },
    })
  })

  it('requires session_id', async () => {
    mocked.getQuery.mockReturnValue({})
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('returns not found when no payment for checkout session', async () => {
    mocked.findFirst.mockResolvedValue(null)
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('enforces payment ownership for customers', async () => {
    mocked.findFirst.mockResolvedValue({
      status: 'PAID',
      amountPence: 4000,
      appointment: {
        userId: 'u2',
        service: { name: 'Nail Trim' },
        dog: { name: 'Rex' },
        invoiceItems: [],
      },
    })
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('returns status payload for authorized user', async () => {
    await expect(handler({} as any)).resolves.toEqual({
      paymentStatus: 'PAID',
      amountPence: 4000,
      serviceName: 'Nail Trim',
      dogName: 'Rex',
      invoiceNumber: 'INV-42',
    })
  })
})
