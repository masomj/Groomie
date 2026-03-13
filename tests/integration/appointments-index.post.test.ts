import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocked = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  readBody: vi.fn(),
  dogFindUnique: vi.fn(),
  serviceFindUnique: vi.fn(),
  activeTemplateFindFirst: vi.fn(),
  transaction: vi.fn(),
  txBlockoutFindFirst: vi.fn(),
  txAppointmentFindMany: vi.fn(),
  txAppointmentCreate: vi.fn(),
  txConsentCreate: vi.fn(),
}))

vi.mock('~/server/utils/auth', () => ({
  requireAuth: mocked.requireAuth,
}))

vi.mock('~/server/utils/prisma', () => ({
  default: {
    dog: { findUnique: mocked.dogFindUnique },
    service: { findUnique: mocked.serviceFindUnique },
    consentTemplate: { findFirst: mocked.activeTemplateFindFirst },
    $transaction: mocked.transaction,
  },
}))

vi.mock('h3', () => ({
  defineEventHandler: (fn: any) => fn,
  readBody: (event: any) => mocked.readBody(event),
  createError: ({ statusCode, statusMessage }: any) =>
    Object.assign(new Error(statusMessage), { statusCode, statusMessage }),
}))

import handler from '../../server/api/appointments/index.post'

describe('POST /api/appointments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocked.requireAuth.mockResolvedValue({ id: 'u1', role: 'CUSTOMER' })
    mocked.readBody.mockResolvedValue({
      serviceId: 'svc_1',
      dogId: 'dog_1',
      dateTime: '2026-05-10T10:00:00.000Z',
      consent: { templateId: 'tpl_1', accepted: true, signedName: 'Ada' },
    })
    mocked.dogFindUnique.mockResolvedValue({ id: 'dog_1', ownerId: 'u1' })
    mocked.serviceFindUnique.mockResolvedValue({
      id: 'svc_1',
      active: true,
      durationMin: 60,
      priceFrom: 6000,
    })
    mocked.activeTemplateFindFirst.mockResolvedValue({ id: 'tpl_1', title: 'Terms', version: 2, body: 'Body' })
    mocked.transaction.mockImplementation(async (fn: any) =>
      fn({
        blockoutPeriod: { findFirst: mocked.txBlockoutFindFirst },
        appointment: { findMany: mocked.txAppointmentFindMany, create: mocked.txAppointmentCreate },
        consentRecord: { create: mocked.txConsentCreate },
      }))
    mocked.txBlockoutFindFirst.mockResolvedValue(null)
    mocked.txAppointmentFindMany.mockResolvedValue([])
    mocked.txAppointmentCreate.mockResolvedValue({
      id: 'appt_1',
      userId: 'u1',
      status: 'PENDING',
      dog: { id: 'dog_1', name: 'Rex' },
      service: { id: 'svc_1', name: 'Full Groom' },
    })
  })

  it('rejects when dog is not owned by requesting user', async () => {
    mocked.dogFindUnique.mockResolvedValue({ id: 'dog_1', ownerId: 'u2' })
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('requires consent acceptance when active template exists', async () => {
    mocked.readBody.mockResolvedValue({
      serviceId: 'svc_1',
      dogId: 'dog_1',
      dateTime: '2026-05-10T10:00:00.000Z',
      consent: { templateId: 'tpl_1', accepted: false },
    })
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('rejects when selected consent template is stale', async () => {
    mocked.readBody.mockResolvedValue({
      serviceId: 'svc_1',
      dogId: 'dog_1',
      dateTime: '2026-05-10T10:00:00.000Z',
      consent: { templateId: 'tpl_old', accepted: true },
    })
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('rejects blocked out timeslot', async () => {
    mocked.txBlockoutFindFirst.mockResolvedValue({ id: 'blk_1' })
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 409 })
  })

  it('creates appointment and consent atomically', async () => {
    const result = await handler({} as any)

    expect(result).toEqual({
      appointment: expect.objectContaining({
        id: 'appt_1',
        status: 'PENDING',
      }),
    })
    expect(mocked.txAppointmentCreate).toHaveBeenCalledTimes(1)
    expect(mocked.txConsentCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        appointmentId: 'appt_1',
        userId: 'u1',
        templateId: 'tpl_1',
        accepted: true,
      }),
    })
  })
})
