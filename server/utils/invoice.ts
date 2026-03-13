import prisma from '~/server/utils/prisma'
import { createWriteStream, mkdirSync, existsSync } from 'fs'
import { join } from 'path'

export async function generateNextInvoiceNumber(): Promise<string> {
  const last = await prisma.invoice.findFirst({
    orderBy: { number: 'desc' },
    select: { number: true },
  })
  if (!last) return 'INV-0001'
  const num = parseInt(last.number.replace('INV-', ''), 10)
  return `INV-${String(num + 1).padStart(4, '0')}`
}

interface InvoiceInput {
  appointmentId: string
  userId: string
  serviceName: string
  dogName: string
  dateTime: Date
  amountPence: number
  customerName: string
  customerEmail: string
}

export async function createInvoiceForPayment(input: InvoiceInput) {
  const invoiceNumber = await generateNextInvoiceNumber()
  const now = new Date()

  const invoice = await prisma.invoice.create({
    data: {
      userId: input.userId,
      number: invoiceNumber,
      status: 'PAID',
      totalPence: input.amountPence,
      issuedAt: now,
      paidAt: now,
      items: {
        create: {
          appointmentId: input.appointmentId,
          description: `${input.serviceName} for ${input.dogName} on ${input.dateTime.toLocaleDateString('en-GB')}`,
          amountPence: input.amountPence,
        },
      },
    },
    include: { items: true },
  })

  // Generate PDF
  const pdfPath = await generateInvoicePdf({
    invoiceNumber,
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    serviceName: input.serviceName,
    dogName: input.dogName,
    dateTime: input.dateTime,
    amountPence: input.amountPence,
    issuedAt: now,
  })

  return { invoice, pdfPath }
}

interface PdfInput {
  invoiceNumber: string
  customerName: string
  customerEmail: string
  serviceName: string
  dogName: string
  dateTime: Date
  amountPence: number
  issuedAt: Date
}

async function generateInvoicePdf(input: PdfInput): Promise<string> {
  const PDFDocument = (await import('pdfkit')).default
  const dir = join(process.cwd(), 'data', 'invoices')
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  const filename = `${input.invoiceNumber}.pdf`
  const filePath = join(dir, filename)

  return new Promise<string>((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 })
    const stream = createWriteStream(filePath)
    doc.pipe(stream)

    // Header
    doc.fontSize(22).text('Pampered Pooch Porthcawl', { align: 'center' })
    doc.fontSize(10).text('Professional Dog Grooming', { align: 'center' })
    doc.moveDown(2)

    // Invoice info
    doc.fontSize(16).text('INVOICE', { align: 'left' })
    doc.moveDown(0.5)
    doc.fontSize(10)
    doc.text(`Invoice Number: ${input.invoiceNumber}`)
    doc.text(`Date Issued: ${input.issuedAt.toLocaleDateString('en-GB')}`)
    doc.text(`Status: PAID`)
    doc.moveDown(1)

    // Customer
    doc.fontSize(12).text('Bill To:', { underline: true })
    doc.fontSize(10)
    doc.text(input.customerName)
    doc.text(input.customerEmail)
    doc.moveDown(1)

    // Line items table
    doc.fontSize(12).text('Items', { underline: true })
    doc.moveDown(0.5)
    doc.fontSize(10)

    const description = `${input.serviceName} for ${input.dogName}`
    const dateStr = input.dateTime.toLocaleDateString('en-GB')
    const amount = `£${(input.amountPence / 100).toFixed(2)}`

    doc.text(`${description}`)
    doc.text(`Appointment date: ${dateStr}`)
    doc.text(`Amount: ${amount}`)
    doc.moveDown(1)

    // Total
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke()
    doc.moveDown(0.5)
    doc.fontSize(14).text(`Total: ${amount}`, { align: 'right' })
    doc.moveDown(2)

    // Footer
    doc.fontSize(8).text('Thank you for choosing Pampered Pooch Porthcawl!', { align: 'center' })

    doc.end()
    stream.on('finish', () => resolve(filePath))
    stream.on('error', reject)
  })
}
