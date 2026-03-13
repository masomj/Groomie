import { defineEventHandler, createError, getHeader, readRawBody } from 'h3'
import prisma from '~/server/utils/prisma'
import { getStripe } from '~/server/utils/stripe'
import { createInvoiceForPayment } from '~/server/utils/invoice'
import { sendPaymentConfirmation } from '~/server/utils/confirmation'
import type Stripe from 'stripe'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const stripe = getStripe()

  if (!config.stripeWebhookSecret) {
    throw createError({ statusCode: 500, statusMessage: 'Webhook secret not configured.' })
  }

  // Read raw body for signature verification
  const rawBody = await readRawBody(event)
  if (!rawBody) {
    throw createError({ statusCode: 400, statusMessage: 'Empty request body.' })
  }

  const sig = getHeader(event, 'stripe-signature')
  if (!sig) {
    throw createError({ statusCode: 400, statusMessage: 'Missing stripe-signature header.' })
  }

  let stripeEvent: Stripe.Event
  try {
    stripeEvent = stripe.webhooks.constructEvent(rawBody, sig, config.stripeWebhookSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    throw createError({ statusCode: 400, statusMessage: 'Invalid signature.' })
  }

  // Idempotency check
  const existing = await prisma.stripeEvent.findUnique({
    where: { id: stripeEvent.id },
  })
  if (existing) {
    return { received: true, duplicate: true }
  }

  // Store event ID for idempotency
  await prisma.stripeEvent.create({
    data: {
      id: stripeEvent.id,
      type: stripeEvent.type,
    },
  })

  switch (stripeEvent.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(stripeEvent.data.object as Stripe.Checkout.Session)
      break
    case 'payment_intent.succeeded':
      await handlePaymentIntentSucceeded(stripeEvent.data.object as Stripe.PaymentIntent)
      break
    case 'payment_intent.payment_failed':
      await handlePaymentFailed(stripeEvent.data.object as Stripe.PaymentIntent)
      break
    case 'charge.refunded':
      await handleChargeRefunded(stripeEvent.data.object as Stripe.Charge)
      break
    default:
      console.log(`Unhandled Stripe event type: ${stripeEvent.type}`)
  }

  return { received: true }
})

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const payment = await prisma.payment.findUnique({
    where: { checkoutSessionId: session.id },
    include: {
      appointment: {
        include: {
          service: true,
          dog: { select: { name: true } },
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      },
    },
  })

  if (!payment) {
    console.error(`No payment found for checkout session: ${session.id}`)
    return
  }

  if (payment.status === 'PAID') return // Already processed

  const now = new Date()

  // Update payment + appointment in transaction
  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: 'PAID',
        paidAt: now,
        providerRef: session.payment_intent as string | null,
      },
    })

    // Confirm appointment if currently PENDING
    if (payment.appointment.status === 'PENDING') {
      await tx.appointment.update({
        where: { id: payment.appointment.id },
        data: { status: 'CONFIRMED' },
      })
    }
  })

  // Create invoice + PDF
  const { invoice, pdfPath } = await createInvoiceForPayment({
    appointmentId: payment.appointment.id,
    userId: payment.appointment.user.id,
    serviceName: payment.appointment.service.name,
    dogName: payment.appointment.dog.name,
    dateTime: payment.appointment.dateTime,
    amountPence: payment.amountPence,
    customerName: `${payment.appointment.user.firstName} ${payment.appointment.user.lastName}`,
    customerEmail: payment.appointment.user.email,
  })

  // Store PDF path on payment
  await prisma.payment.update({
    where: { id: payment.id },
    data: { pdfPath },
  })

  // Send confirmation
  await sendPaymentConfirmation({
    paymentId: payment.id,
    customerEmail: payment.appointment.user.email,
    customerName: `${payment.appointment.user.firstName} ${payment.appointment.user.lastName}`,
    invoiceNumber: invoice.number,
    serviceName: payment.appointment.service.name,
    amountPence: payment.amountPence,
    appointmentDate: payment.appointment.dateTime,
  })
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  // The checkout.session.completed handler is the primary flow.
  // This handles edge cases where checkout event is missed.
  const payment = await prisma.payment.findFirst({
    where: { providerRef: paymentIntent.id },
  })

  if (!payment || payment.status === 'PAID') return

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: 'PAID',
      paidAt: new Date(),
    },
  })
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const payment = await prisma.payment.findFirst({
    where: { providerRef: paymentIntent.id },
  })

  if (!payment) return

  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: 'FAILED' },
  })
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  const paymentIntentId = charge.payment_intent as string | null
  if (!paymentIntentId) return

  const payment = await prisma.payment.findFirst({
    where: { providerRef: paymentIntentId },
    include: { appointment: true },
  })

  if (!payment) return

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: { status: 'REFUNDED' },
    })

    // If appointment not already cancelled, mark it cancelled
    if (!['CANCELLED', 'COMPLETED'].includes(payment.appointment.status)) {
      await tx.appointment.update({
        where: { id: payment.appointment.id },
        data: { status: 'CANCELLED' },
      })
    }
  })
}
