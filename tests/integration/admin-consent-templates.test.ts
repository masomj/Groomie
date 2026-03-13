import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocked = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  readBody: vi.fn(),
  findTemplateUnique: vi.fn(),
  countRecords: vi.fn(),
  updateTemplate: vi.fn(),
  createTemplate: vi.fn(),
  findLatestByTitle: vi.fn(),
  transactionArray: vi.fn(),
}))

vi.mock('~/server/utils/auth', () => ({
  requireAdmin: mocked.requireAdmin,
}))

vi.mock('~/server/utils/prisma', () => ({
  default: {
    consentTemplate: {
      findUnique: mocked.findTemplateUnique,
      update: mocked.updateTemplate,
      create: mocked.createTemplate,
      findFirst: mocked.findLatestByTitle,
      updateMany: vi.fn(() => ({ op: 'updateMany' })),
    },
    consentRecord: {
      count: mocked.countRecords,
    },
    $transaction: mocked.transactionArray,
  },
}))

vi.mock('h3', () => ({
  defineEventHandler: (fn: any) => fn,
  readBody: (event: any) => mocked.readBody(event),
  createError: ({ statusCode, statusMessage }: any) =>
    Object.assign(new Error(statusMessage), { statusCode, statusMessage }),
}))

import patchTemplateHandler from '../../server/api/admin/consent-templates/[id].patch'
import createTemplateHandler from '../../server/api/admin/consent-templates/index.post'
import activateTemplateHandler from '../../server/api/admin/consent-templates/[id]/activate.post'

describe('admin consent template flows', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocked.requireAdmin.mockResolvedValue({ id: 'a1', role: 'ADMIN' })
    mocked.readBody.mockResolvedValue({
      title: 'Terms',
      body: 'Updated body',
      questions: [{ id: 'q1', label: 'OK?' }],
    })
    mocked.findTemplateUnique.mockResolvedValue({
      id: 'tpl_1',
      title: 'Terms',
      version: 1,
      body: 'Old body',
      active: false,
    })
    mocked.countRecords.mockResolvedValue(0)
    mocked.updateTemplate.mockResolvedValue({ id: 'tpl_1', title: 'Terms', body: 'Updated body' })
    mocked.createTemplate.mockResolvedValue({ id: 'tpl_2', title: 'Terms', version: 3, active: false })
    mocked.findLatestByTitle.mockResolvedValue({ id: 'tpl_prev', version: 2 })
    mocked.transactionArray.mockResolvedValue([{ count: 1 }, { id: 'tpl_1' }])
  })

  it('blocks editing templates that already have consent records', async () => {
    mocked.countRecords.mockResolvedValue(2)
    await expect(
      patchTemplateHandler({ context: { params: { id: 'tpl_1' } } } as any),
    ).rejects.toMatchObject({ statusCode: 409 })
  })

  it('auto-increments version when creating template with same title', async () => {
    const result = await createTemplateHandler({} as any)
    expect(result.template).toEqual(expect.objectContaining({ id: 'tpl_2', version: 3 }))
    expect(mocked.createTemplate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: 'Terms',
        version: 3,
        active: false,
      }),
    })
  })

  it('activates chosen template after deactivating existing active one', async () => {
    mocked.findTemplateUnique.mockResolvedValue({ id: 'tpl_1', active: false })
    await activateTemplateHandler({ context: { params: { id: 'tpl_1' } } } as any)
    expect(mocked.transactionArray).toHaveBeenCalledTimes(1)
    expect(mocked.findTemplateUnique).toHaveBeenCalledTimes(2)
  })
})
