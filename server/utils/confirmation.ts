import prisma from '~/server/utils/prisma'

interface ConfirmationInput {
  paymentId: string
  customerEmail: string
  customerName: string
  invoiceNumber: string
  serviceName: string
  amountPence: number
  appointmentDate: Date
}

export async function sendPaymentConfirmation(input: ConfirmationInput) {
  const config = useRuntimeConfig()
  const emailConfigured = !!(config.smtpHost && config.smtpUser && config.smtpPass)

  if (emailConfigured) {
    try {
      await sendEmailConfirmation(input, config)
      await prisma.paymentConfirmation.create({
        data: {
          paymentId: input.paymentId,
          channel: 'email',
          recipient: input.customerEmail,
          subject: `Payment Confirmation - ${input.invoiceNumber}`,
          success: true,
        },
      })
    } catch (err: any) {
      console.error('Email send failed, falling back to log:', err.message)
      await persistConfirmationLog(input, err.message)
    }
  } else {
    await persistConfirmationLog(input)
  }
}

async function persistConfirmationLog(input: ConfirmationInput, error?: string) {
  await prisma.paymentConfirmation.create({
    data: {
      paymentId: input.paymentId,
      channel: 'log',
      recipient: 'system',
      subject: `Payment Confirmation - ${input.invoiceNumber}`,
      success: !error,
      error: error || null,
    },
  })
  console.log(`[PaymentConfirmation] ${input.invoiceNumber} for ${input.customerEmail} - £${(input.amountPence / 100).toFixed(2)} (logged, email ${error ? 'failed: ' + error : 'not configured'})`)
}

async function sendEmailConfirmation(input: ConfirmationInput, config: any) {
  // Dynamic import to avoid errors when nodemailer isn't installed
  const nodemailer = await import('nodemailer').catch(() => null)
  if (!nodemailer) {
    throw new Error('nodemailer not installed')
  }

  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: parseInt(config.smtpPort || '587', 10),
    secure: parseInt(config.smtpPort || '587', 10) === 465,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass,
    },
  })

  await transporter.sendMail({
    from: config.smtpFrom || config.smtpUser,
    to: input.customerEmail,
    subject: `Payment Confirmation - ${input.invoiceNumber}`,
    text: [
      `Dear ${input.customerName},`,
      '',
      `Thank you for your payment of £${(input.amountPence / 100).toFixed(2)}.`,
      '',
      `Invoice: ${input.invoiceNumber}`,
      `Service: ${input.serviceName}`,
      `Appointment: ${input.appointmentDate.toLocaleDateString('en-GB')}`,
      '',
      'You can download your invoice from your dashboard.',
      '',
      'Pampered Pooch Porthcawl',
    ].join('\n'),
  })
}
