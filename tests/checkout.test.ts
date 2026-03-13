import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocked = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  readBody: vi.fn(),
  findUnique: vi.fn(),
  findActiveTemplate: vi.fn(),
  findConsentRecord: vi.fn(),
  upsertPayment: vi.fn(),
  createCheckoutSession: vi.fn(),
}))

vi.mock('~/server/utils/auth', () => ({
  requireAuth: mocked.requireAuth,
}))

vi.mock('~/server/utils/prisma', () => ({
  default: {
    appointment: { findUnique: mocked.findUnique },
    consentTemplate: { findFirst: mocked.findActiveTemplate },
    consentRecord: { findFirst: mocked.findConsentRecord },
    payment: { upsert: mocked.upsertPayment },
  },
}))

vi.mock('~/server/utils/stripe', () => ({
  getStripe: () => ({
    checkout: {
      sessions: {
        create: mocked.createCheckoutSession,
      },
    },
  }),
}))

vi.mock('h3', () => ({
  defineEventHandler: (fn: any) => fn,
  readBody: (event: any) => mocked.readBody(event),
  createError: ({ statusCode, statusMessage }: any) =>
    Object.assign(new Error(statusMessage), { statusCode, statusMessage }),
}))

import handler from '../server/api/payments/checkout.post'

describe('POST /api/payments/checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocked.requireAuth.mockResolvedValue({ id: 'u1', role: 'CUSTOMER' })
    mocked.readBody.mockResolvedValue({ appointmentId: 'appt-1' })
    mocked.findActiveTemplate.mockResolvedValue(null)
    mocked.findConsentRecord.mockResolvedValue({ id: 'consent-1' })
    mocked.createCheckoutSession.mockResolvedValue({
      id: 'cs_123',
      url: 'https://checkout.stripe.test/session',
      payment_intent: 'pi_123',
    })
    ;(globalThis as any).useRuntimeConfig = vi.fn(() => ({
      appBaseUrl: 'https://app.example.test',
    }))
    mocked.findUnique.mockResolvedValue({
      id: 'appt-1',
      userId: 'u1',
      status: 'PENDING',
      priceCharged: null,
      dateTime: '2026-04-10T10:00:00.000Z',
      service: { name: 'Groom', priceFrom: 5500 },
      dog: { name: 'Rex' },
      payment: null,
    })
  })

  it('requires appointmentId', async () => {
    mocked.readBody.mockResolvedValue({})
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('rejects unknown appointments', async () => {
    mocked.findUnique.mockResolvedValue(null)
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('enforces customer ownership', async () => {
    mocked.findUnique.mockResolvedValue({
      id: 'appt-1',
      userId: 'another-user',
      status: 'PENDING',
      payment: null,
      service: { name: 'Groom', priceFrom: 5500 },
      dog: { name: 'Rex' },
      dateTime: '2026-04-10T10:00:00.000Z',
    })
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('allows admin to bypass ownership restriction', async () => {
    mocked.requireAuth.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' })
    mocked.findUnique.mockResolvedValue({
      id: 'appt-1',
      userId: 'another-user',
      status: 'PENDING',
      payment: null,
      service: { name: 'Groom', priceFrom: 5500 },
      dog: { name: 'Rex' },
      dateTime: '2026-04-10T10:00:00.000Z',
    })
    await expect(handler({} as any)).resolves.toEqual({
      url: 'https://checkout.stripe.test/session',
    })
  })

  it('rejects cancelled or no-show appointments', async () => {
    mocked.findUnique.mockResolvedValue({
      id: 'appt-1',
      userId: 'u1',
      status: 'CANCELLED',
      payment: null,
      service: { name: 'Groom', priceFrom: 5500 },
      dog: { name: 'Rex' },
      dateTime: '2026-04-10T10:00:00.000Z',
    })
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('rejects already paid appointments', async () => {
    mocked.findUnique.mockResolvedValue({
      id: 'appt-1',
      userId: 'u1',
      status: 'CONFIRMED',
      payment: { status: 'PAID' },
      service: { name: 'Groom', priceFrom: 5500 },
      dog: { name: 'Rex' },
      dateTime: '2026-04-10T10:00:00.000Z',
    })
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('requires consent record when active template exists', async () => {
    mocked.findActiveTemplate.mockResolvedValue({ id: 'tpl-1', active: true })
    mocked.findConsentRecord.mockResolvedValue(null)
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('creates checkout session and pending payment', async () => {
    const result = await handler({} as any)

    expect(result).toEqual({ url: 'https://checkout.stripe.test/session' })
    expect(mocked.createCheckoutSession).toHaveBeenCalledTimes(1)
    expect(mocked.upsertPayment).toHaveBeenCalledWith({
      where: { appointmentId: 'appt-1' },
      create: expect.objectContaining({
        appointmentId: 'appt-1',
        status: 'PENDING',
        checkoutSessionId: 'cs_123',
      }),
      update: expect.objectContaining({
        status: 'PENDING',
        checkoutSessionId: 'cs_123',
      }),
    })
  })
})
