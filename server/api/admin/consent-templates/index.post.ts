import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const body = await readBody<{
    title?: string
    body?: string
    questions?: any
  }>(event)

  if (!body?.title?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Title is required.' })
  }
  if (!body?.body?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Body/content is required.' })
  }

  // Auto-increment version for this title
  const latest = await prisma.consentTemplate.findFirst({
    where: { title: body.title.trim() },
    orderBy: { version: 'desc' },
  })
  const nextVersion = latest ? latest.version + 1 : 1

  const template = await prisma.consentTemplate.create({
    data: {
      title: body.title.trim(),
      version: nextVersion,
      body: body.body.trim(),
      questions: body.questions || undefined,
      active: false,
    },
  })

  return { template }
})
