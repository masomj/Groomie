import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'

export default defineEventHandler(async () => {
  const template = await prisma.consentTemplate.findFirst({
    where: { active: true },
    select: { id: true, title: true, version: true, body: true, questions: true },
  })

  return { template: template || null }
})
