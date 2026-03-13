import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocked = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  readBody: vi.fn(),
  findUnique: vi.fn(),
  update: vi.fn(),
}))

vi.mock('~/server/utils/auth', () => ({
  requireAuth: mocked.requireAuth,
}))

vi.mock('~/server/utils/prisma', () => ({
  default: {
    dog: {
      findUnique: mocked.findUnique,
      update: mocked.update,
    },
  },
}))

vi.mock('h3', () => ({
  defineEventHandler: (fn: any) => fn,
  readBody: (event: any) => mocked.readBody(event),
  createError: ({ statusCode, statusMessage }: any) =>
    Object.assign(new Error(statusMessage), { statusCode, statusMessage }),
}))

import handler from '../../server/api/dogs/[id].patch'

describe('PATCH /api/dogs/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocked.requireAuth.mockResolvedValue({ id: 'u1', role: 'CUSTOMER' })
    mocked.findUnique.mockResolvedValue({ id: 'dog_1', ownerId: 'u1' })
    mocked.readBody.mockResolvedValue({ name: '  Rex  ', peopleFriendly: 'YES' })
    mocked.update.mockResolvedValue({ id: 'dog_1', name: 'Rex', peopleFriendly: 'YES' })
  })

  it('rejects updates for dogs not owned by customer', async () => {
    mocked.findUnique.mockResolvedValue({ id: 'dog_1', ownerId: 'u2' })
    await expect(handler({ context: { params: { id: 'dog_1' } } } as any)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('rejects invalid enum values', async () => {
    mocked.readBody.mockResolvedValue({ dogFriendly: 'MAYBE' })
    await expect(handler({ context: { params: { id: 'dog_1' } } } as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('trims and persists valid updates', async () => {
    const result = await handler({ context: { params: { id: 'dog_1' } } } as any)
    expect(result).toEqual({ dog: { id: 'dog_1', name: 'Rex', peopleFriendly: 'YES' } })
    expect(mocked.update).toHaveBeenCalledWith({
      where: { id: 'dog_1' },
      data: expect.objectContaining({
        name: 'Rex',
        peopleFriendly: 'YES',
      }),
    })
  })
})
