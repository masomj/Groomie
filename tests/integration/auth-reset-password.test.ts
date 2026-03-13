import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocked = vi.hoisted(() => ({
  findUnique: vi.fn(),
  userUpdate: vi.fn(),
  tokenUpdate: vi.fn(),
  tokenDeleteMany: vi.fn(),
  sessionDeleteMany: vi.fn(),
  transaction: vi.fn(async () => []),
  bcryptHash: vi.fn(async () => 'hashed-password'),
  hashToken: vi.fn(() => 'hashed-token'),
}))

vi.mock('bcrypt', () => ({ default: { hash: mocked.bcryptHash } }))
vi.mock('~/server/utils/password-reset', () => ({ hashPasswordResetToken: mocked.hashToken }))
vi.mock('~/server/utils/prisma', () => ({
  default: {
    passwordResetToken: {
      findUnique: mocked.findUnique,
      update: mocked.tokenUpdate,
      deleteMany: mocked.tokenDeleteMany,
    },
    user: { update: mocked.userUpdate },
    session: { deleteMany: mocked.sessionDeleteMany },
    $transaction: mocked.transaction,
  },
}))
vi.mock('h3', () => ({
  defineEventHandler: (fn: any) => fn,
  readBody: async (event: any) => event.body,
  createError: ({ statusCode, statusMessage }: any) => {
    const err: any = new Error(statusMessage)
    err.statusCode = statusCode
    return err
  },
}))

import handler from '../../server/api/auth/reset-password.post'

describe('POST /api/auth/reset-password', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects invalid payload', async () => {
    await expect(handler({ body: { token: '', password: '123' } } as any)).rejects.toThrow('Token and new password are required.')
  })

  it('rejects missing/expired token', async () => {
    mocked.findUnique.mockResolvedValue(null)

    await expect(handler({ body: { token: 'abc', password: 'newpassword' } } as any)).rejects.toThrow('This reset link is invalid or has expired.')
  })

  it('updates password and invalidates sessions for valid token', async () => {
    mocked.findUnique.mockResolvedValue({
      id: 'rt1',
      userId: 'u1',
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: null,
    })

    const result = await handler({ body: { token: 'abc', password: 'newpassword123' } } as any)

    expect(result.ok).toBe(true)
    expect(mocked.transaction).toHaveBeenCalledTimes(1)
    expect(mocked.userUpdate).toHaveBeenCalledTimes(1)
    expect(mocked.sessionDeleteMany).toHaveBeenCalledTimes(1)
  })
})
