import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocked = vi.hoisted(() => ({
  getHeader: vi.fn(),
  readRawBody: vi.fn(),
  constructEvent: vi.fn(),
  findStripeEvent: vi.fn(),
  createStripeEvent: vi.fn(),
  findPaymentByCheckoutSession: vi.fn(),
  findPaymentByProviderRef: vi.fn(),
  updatePayment: vi.fn(),
  updateAppointment: vi.fn(),
  transaction: vi.fn(),
  createInvoiceForPayment: vi.fn(),
  sendPaymentConfirmation: vi.fn(),
}))

vi.mock('~/server/utils/stripe', () => ({
  getStripe: () => ({
    webhooks: {
      constructEvent: mocked.constructEvent,
    },
  }),
}))

vi.mock('~/server/utils/invoice', () => ({
  createInvoiceForPayment: mocked.createInvoiceForPayment,
}))

vi.mock('~/server/utils/confirmation', () => ({
  sendPaymentConfirmation: mocked.sendPaymentConfirmation,
}))

vi.mock('~/server/utils/prisma', () => ({
  default: {
    stripeEvent: {
      findUnique: mocked.findStripeEvent,
      create: mocked.createStripeEvent,
    },
    payment: {
      findUnique: mocked.findPaymentByCheckoutSession,
      findFirst: mocked.findPaymentByProviderRef,
      update: mocked.updatePayment,
    },
    appointment: {
      update: mocked.updateAppointment,
    },
    $transaction: mocked.transaction,
  },
}))

vi.mock('h3', () => ({
  defineEventHandler: (fn: any) => fn,
  getHeader: (event: any, name: string) => mocked.getHeader(event, name),
  readRawBody: (event: any) => mocked.readRawBody(event),
  createError: ({ statusCode, statusMessage }: any) =>
    Object.assign(new Error(statusMessage), { statusCode, statusMessage }),
}))

import handler from '../server/api/webhooks/stripe.post'

describe('POST /api/webhooks/stripe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(globalThis as any).useRuntimeConfig = vi.fn(() => ({
      stripeWebhookSecret: 'whsec_test',
    }))
    mocked.getHeader.mockReturnValue('sig_123')
    mocked.readRawBody.mockResolvedValue('{"id":"evt_1"}')
    mocked.findStripeEvent.mockResolvedValue(null)
    mocked.createStripeEvent.mockResolvedValue({ id: 'evt_1', type: 'checkout.session.completed' })
    mocked.constructEvent.mockReturnValue({
      id: 'evt_1',
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_1', payment_intent: 'pi_1' } },
    })
    mocked.findPaymentByCheckoutSession.mockResolvedValue({
      id: 'pay_1',
      amountPence: 5000,
      status: 'PENDING',
      appointment: {
        id: 'appt_1',
        status: 'PENDING',
        dateTime: new Date('2026-04-20T10:00:00.000Z'),
        service: { name: 'Full Groom' },
        dog: { name: 'Rex' },
        user: { id: 'u1', firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com' },
      },
    })
    mocked.transaction.mockImplementation(async (fn: any) =>
      fn({
        payment: { update: mocked.updatePayment },
        appointment: { update: mocked.updateAppointment },
      }))
    mocked.createInvoiceForPayment.mockResolvedValue({
      invoice: { number: 'INV-001' },
      pdfPath: '/tmp/inv-001.pdf',
    })
  })

  it('rejects missing signature header', async () => {
    mocked.getHeader.mockReturnValue(undefined)
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('rejects invalid webhook signature', async () => {
    mocked.constructEvent.mockImplementation(() => {
      throw new Error('bad signature')
    })
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('returns duplicate response for already processed events', async () => {
    mocked.findStripeEvent.mockResolvedValue({ id: 'evt_1' })
    await expect(handler({} as any)).resolves.toEqual({ received: true, duplicate: true })
    expect(mocked.createStripeEvent).not.toHaveBeenCalled()
  })

  it('handles checkout.session.completed and generates invoice + confirmation', async () => {
    await expect(handler({} as any)).resolves.toEqual({ received: true })

    expect(mocked.createStripeEvent).toHaveBeenCalledWith({
      data: { id: 'evt_1', type: 'checkout.session.completed' },
    })
    expect(mocked.transaction).toHaveBeenCalledTimes(1)
    expect(mocked.updatePayment).toHaveBeenCalled()
    expect(mocked.updateAppointment).toHaveBeenCalledWith({
      where: { id: 'appt_1' },
      data: { status: 'CONFIRMED' },
    })
    expect(mocked.createInvoiceForPayment).toHaveBeenCalledTimes(1)
    expect(mocked.sendPaymentConfirmation).toHaveBeenCalledTimes(1)
  })

  it('marks payment as FAILED for payment_intent.payment_failed', async () => {
    mocked.constructEvent.mockReturnValue({
      id: 'evt_2',
      type: 'payment_intent.payment_failed',
      data: { object: { id: 'pi_2' } },
    })
    mocked.findPaymentByProviderRef.mockResolvedValue({ id: 'pay_2', status: 'PENDING' })
    await expect(handler({} as any)).resolves.toEqual({ received: true })

    expect(mocked.updatePayment).toHaveBeenCalledWith({
      where: { id: 'pay_2' },
      data: { status: 'FAILED' },
    })
  })
})
