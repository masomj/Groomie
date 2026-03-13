import { defineEventHandler, createError } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = event.context.params?.id
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Template ID is required.' })
  }

  const template = await prisma.consentTemplate.findUnique({ where: { id } })
  if (!template) {
    throw createError({ statusCode: 404, statusMessage: 'Template not found.' })
  }

  // Deactivate all templates, then activate this one (atomic)
  await prisma.$transaction([
    prisma.consentTemplate.updateMany({ where: { active: true }, data: { active: false } }),
    prisma.consentTemplate.update({ where: { id }, data: { active: true } }),
  ])

  const updated = await prisma.consentTemplate.findUnique({ where: { id } })
  return { template: updated }
})
