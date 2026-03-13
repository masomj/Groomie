import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocked = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  readBody: vi.fn(),
  findUnique: vi.fn(),
  update: vi.fn(),
  transaction: vi.fn(),
  txFindMany: vi.fn(),
  txUpdate: vi.fn(),
}))

vi.mock('~/server/utils/auth', () => ({
  requireAuth: mocked.requireAuth,
}))

vi.mock('~/server/utils/prisma', () => ({
  default: {
    appointment: {
      findUnique: mocked.findUnique,
      update: mocked.update,
    },
    $transaction: mocked.transaction,
  },
}))

vi.mock('h3', () => ({
  defineEventHandler: (fn: any) => fn,
  readBody: (event: any) => mocked.readBody(event),
  createError: ({ statusCode, statusMessage }: any) =>
    Object.assign(new Error(statusMessage), { statusCode, statusMessage }),
}))

import handler from '../../server/api/appointments/[id].patch'

describe('PATCH /api/appointments/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocked.requireAuth.mockResolvedValue({ id: 'u1', role: 'CUSTOMER' })
    mocked.findUnique.mockResolvedValue({
      id: 'appt_1',
      userId: 'u1',
      status: 'CONFIRMED',
      durationMin: 60,
      dateTime: '2026-06-01T10:00:00.000Z',
    })
    mocked.update.mockResolvedValue({ id: 'appt_1', status: 'CANCELLED' })
    mocked.readBody.mockResolvedValue({ action: 'cancel' })
    mocked.transaction.mockImplementation(async (fn: any) =>
      fn({
        appointment: {
          findMany: mocked.txFindMany,
          update: mocked.txUpdate,
        },
      }))
    mocked.txFindMany.mockResolvedValue([])
    mocked.txUpdate.mockResolvedValue({ id: 'appt_1', status: 'PENDING' })
  })

  it('enforces ownership for appointment updates', async () => {
    mocked.findUnique.mockResolvedValue({
      id: 'appt_1',
      userId: 'u2',
      status: 'CONFIRMED',
      durationMin: 60,
      dateTime: '2026-06-01T10:00:00.000Z',
    })
    await expect(handler({ context: { params: { id: 'appt_1' } } } as any)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('blocks modifications inside 24-hour window', async () => {
    mocked.findUnique.mockResolvedValue({
      id: 'appt_1',
      userId: 'u1',
      status: 'CONFIRMED',
      durationMin: 60,
      dateTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    })
    await expect(handler({ context: { params: { id: 'appt_1' } } } as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('cancels eligible appointments', async () => {
    const result = await handler({ context: { params: { id: 'appt_1' } } } as any)
    expect(result).toEqual({ appointment: { id: 'appt_1', status: 'CANCELLED' } })
    expect(mocked.update).toHaveBeenCalledWith({
      where: { id: 'appt_1' },
      data: { status: 'CANCELLED' },
    })
  })

  it('rejects reschedule conflicts', async () => {
    mocked.readBody.mockResolvedValue({
      action: 'reschedule',
      dateTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    })
    mocked.txFindMany.mockResolvedValue([
      { dateTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), durationMin: 60 },
    ])
    await expect(handler({ context: { params: { id: 'appt_1' } } } as any)).rejects.toMatchObject({ statusCode: 409 })
  })

  it('reschedules and resets status to PENDING', async () => {
    const target = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()
    mocked.readBody.mockResolvedValue({
      action: 'reschedule',
      dateTime: target,
    })
    const result = await handler({ context: { params: { id: 'appt_1' } } } as any)

    expect(result).toEqual({ appointment: { id: 'appt_1', status: 'PENDING' } })
    expect(mocked.txUpdate).toHaveBeenCalledWith({
      where: { id: 'appt_1' },
      data: { dateTime: new Date(target), status: 'PENDING' },
    })
  })
})
