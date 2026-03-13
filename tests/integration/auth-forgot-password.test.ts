import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocked = vi.hoisted(() => ({
  findUnique: vi.fn(),
  deleteMany: vi.fn(async () => ({})),
  create: vi.fn(async () => ({})),
  sendPasswordResetEmail: vi.fn(async () => ({})),
  generatePasswordResetToken: vi.fn(() => ({
    token: 'raw-token',
    tokenHash: 'hashed-token',
    expiresAt: new Date('2030-01-01T00:00:00.000Z'),
  })),
}))

vi.mock('~/server/utils/prisma', () => ({
  default: {
    user: { findUnique: mocked.findUnique },
    passwordResetToken: {
      deleteMany: mocked.deleteMany,
      create: mocked.create,
    },
  },
}))
vi.mock('~/server/utils/password-reset-email', () => ({ sendPasswordResetEmail: mocked.sendPasswordResetEmail }))
vi.mock('~/server/utils/password-reset', () => ({ generatePasswordResetToken: mocked.generatePasswordResetToken }))
vi.mock('h3', () => ({ defineEventHandler: (fn: any) => fn, readBody: async (event: any) => event.body }))

;(globalThis as any).useRuntimeConfig = () => ({ appBaseUrl: 'http://localhost:3000' })

import handler from '../../server/api/auth/forgot-password.post'

describe('POST /api/auth/forgot-password', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns generic success for unknown email', async () => {
    mocked.findUnique.mockResolvedValue(null)

    const result = await handler({ body: { email: 'nobody@example.com' } } as any)
    expect(result.ok).toBe(true)
    expect(mocked.create).not.toHaveBeenCalled()
  })

  it('creates reset token and sends email for existing user', async () => {
    mocked.findUnique.mockResolvedValue({ id: 'u1', email: 'user@example.com', firstName: 'Mason' })

    const result = await handler({ body: { email: 'user@example.com' } } as any)

    expect(result.ok).toBe(true)
    expect(mocked.deleteMany).toHaveBeenCalledTimes(1)
    expect(mocked.create).toHaveBeenCalledTimes(1)
    expect(mocked.sendPasswordResetEmail).toHaveBeenCalledWith(expect.objectContaining({ recipientEmail: 'user@example.com' }))
  })
})
