import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocked = vi.hoisted(() => ({
  findFirst: vi.fn(),
  create: vi.fn(),
}))

vi.mock('~/server/utils/prisma', () => ({
  default: {
    auditLog: {
      findFirst: mocked.findFirst,
      create: mocked.create,
    },
  },
}))

import { isUserSuspended, setUserSuspendedState } from '../../server/utils/account-state'

describe('account-state utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns false when no suspension/unsuspension logs exist', async () => {
    mocked.findFirst.mockResolvedValue(null)
    await expect(isUserSuspended('u1')).resolves.toBe(false)
  })

  it('returns true when latest action is ACCOUNT_SUSPENDED', async () => {
    mocked.findFirst.mockResolvedValue({ action: 'ACCOUNT_SUSPENDED' })
    await expect(isUserSuspended('u1')).resolves.toBe(true)
  })

  it('returns false when latest action is ACCOUNT_UNSUSPENDED', async () => {
    mocked.findFirst.mockResolvedValue({ action: 'ACCOUNT_UNSUSPENDED' })
    await expect(isUserSuspended('u1')).resolves.toBe(false)
  })

  it('writes suspend audit log with trimmed reason', async () => {
    await setUserSuspendedState({
      adminUserId: 'a1',
      userId: 'u1',
      suspended: true,
      reason: '  abusive conduct  ',
    })

    expect(mocked.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'a1',
        action: 'ACCOUNT_SUSPENDED',
        entity: 'USER',
        entityId: 'u1',
        meta: { reason: 'abusive conduct' },
      }),
    })
  })
})
