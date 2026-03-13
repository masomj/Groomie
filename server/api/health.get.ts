import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'

export default defineEventHandler(async () => {
  const status: { status: string; timestamp: string; database: string } = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: 'unknown',
  }

  try {
    await prisma.$queryRaw`SELECT 1`
    status.database = 'connected'
  } catch {
    status.database = 'disconnected'
    status.status = 'degraded'
  }

  return status
})
