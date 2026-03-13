import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'

export default defineEventHandler(async () => {
  const services = await prisma.service.findMany({
    where: { active: true },
    orderBy: { sortOrder: 'asc' },
  })

  return { services }
})
