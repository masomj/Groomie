import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const templates = await prisma.consentTemplate.findMany({
    orderBy: [{ title: 'asc' }, { version: 'desc' }],
    include: { _count: { select: { records: true } } },
  })

  return { templates }
})
