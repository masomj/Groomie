import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = event.context.params?.id
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Template ID is required.' })
  }

  const existing = await prisma.consentTemplate.findUnique({ where: { id } })
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Template not found.' })
  }

  const body = await readBody<{
    title?: string
    body?: string
    questions?: any
  }>(event)

  // Only allow editing templates that have no consent records
  const recordCount = await prisma.consentRecord.count({ where: { templateId: id } })
  if (recordCount > 0) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Cannot edit a template that has been used. Create a new version instead.',
    })
  }

  const data: Record<string, any> = {}
  if (body?.title?.trim()) data.title = body.title.trim()
  if (body?.body?.trim()) data.body = body.body.trim()
  if (body?.questions !== undefined) data.questions = body.questions

  const template = await prisma.consentTemplate.update({
    where: { id },
    data,
  })

  return { template }
})
