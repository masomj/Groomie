import { defineEventHandler, createError, setHeader } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireAuth } from '~/server/utils/auth'
import { createReadStream, existsSync } from 'fs'
import { sendStream } from 'h3'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const invoiceNumber = getRouterParam(event, 'number')

  if (!invoiceNumber) {
    throw createError({ statusCode: 400, statusMessage: 'Invoice number is required.' })
  }

  const invoice = await prisma.invoice.findUnique({
    where: { number: invoiceNumber },
  })

  if (!invoice) {
    throw createError({ statusCode: 404, statusMessage: 'Invoice not found.' })
  }

  // Ownership check (admin can access any)
  if (invoice.userId !== user.id && user.role !== 'ADMIN') {
    throw createError({ statusCode: 403, statusMessage: 'Not authorized.' })
  }

  // Find associated payment for PDF path
  const payment = await prisma.payment.findFirst({
    where: {
      appointment: {
        invoiceItems: {
          some: { invoiceId: invoice.id },
        },
      },
    },
    select: { pdfPath: true },
  })

  if (!payment?.pdfPath || !existsSync(payment.pdfPath)) {
    throw createError({ statusCode: 404, statusMessage: 'Invoice PDF not found.' })
  }

  setHeader(event, 'Content-Type', 'application/pdf')
  setHeader(event, 'Content-Disposition', `attachment; filename="${invoiceNumber}.pdf"`)

  return sendStream(event, createReadStream(payment.pdfPath))
})
