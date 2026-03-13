import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocked = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  getQuery: vi.fn(),
  setHeaders: vi.fn(),
  findManyAppointments: vi.fn(),
}))

vi.mock('~/server/utils/auth', () => ({
  requireAdmin: mocked.requireAdmin,
}))

vi.mock('~/server/utils/prisma', () => ({
  default: {
    appointment: {
      findMany: mocked.findManyAppointments,
    },
  },
}))

vi.mock('h3', () => ({
  defineEventHandler: (fn: any) => fn,
  getQuery: (event: any) => mocked.getQuery(event),
  setHeaders: (event: any, headers: any) => mocked.setHeaders(event, headers),
  createError: ({ statusCode, statusMessage }: any) =>
    Object.assign(new Error(statusMessage), { statusCode, statusMessage }),
}))

import summaryHandler from '../../server/api/admin/reports/summary.get'
import revenueExportHandler from '../../server/api/admin/exports/revenue.csv.get'

describe('admin reports + exports range handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocked.requireAdmin.mockResolvedValue({ id: 'a1', role: 'ADMIN' })
    mocked.getQuery.mockReturnValue({ from: '2026-01-01', to: '2026-01-31' })
    mocked.findManyAppointments.mockResolvedValue([
      {
        id: 'appt_1',
        dateTime: new Date('2026-01-10T10:00:00.000Z'),
        status: 'COMPLETED',
        priceCharged: 5000,
        payment: { id: 'p1', status: 'PAID', amountPence: 5000 },
        user: { email: 'ada@example.com' },
        service: { name: 'Full Groom' },
        invoiceItems: [{ invoice: { number: 'INV-01' } }],
      },
      {
        id: 'appt_2',
        dateTime: new Date('2026-01-11T10:00:00.000Z'),
        status: 'CANCELLED',
        priceCharged: 5000,
        payment: { id: 'p2', status: 'REFUNDED', amountPence: 5000 },
        user: { email: 'ada@example.com' },
        service: { name: 'Full Groom' },
        invoiceItems: [],
      },
    ])
  })

  it('summary aggregates paid/refunded counters', async () => {
    const result = await summaryHandler({} as any)
    expect(result.totalAppointments).toBe(2)
    expect(result.completedCount).toBe(1)
    expect(result.cancelledCount).toBe(1)
    expect(result.grossRevenuePence).toBe(5000)
    expect(result.refundedAmountPence).toBe(5000)
  })

  it('rejects invalid date range for summary', async () => {
    mocked.getQuery.mockReturnValue({ from: '2026-02-01', to: '2026-01-01' })
    await expect(summaryHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('builds revenue csv and sets download headers', async () => {
    const csv = await revenueExportHandler({} as any)
    expect(csv).toContain('appointmentId,paymentId,paymentStatus')
    expect(csv).toContain('appt_1,p1,PAID')
    expect(csv).toContain('appt_2,p2,REFUNDED')
    expect(mocked.setHeaders).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        'Content-Type': 'text/csv; charset=utf-8',
      }),
    )
  })

  it('rejects missing date query fields for export', async () => {
    mocked.getQuery.mockReturnValue({ from: '2026-01-01' })
    await expect(revenueExportHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })
})
