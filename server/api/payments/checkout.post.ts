import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireAuth } from '~/server/utils/auth'
import { getStripe } from '~/server/utils/stripe'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody<{ appointmentId?: string }>(event)

  if (!body?.appointmentId) {
    throw createError({ statusCode: 400, statusMessage: 'appointmentId is required.' })
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: body.appointmentId },
    include: {
      service: true,
      dog: { select: { name: true } },
      payment: true,
    },
  })

  if (!appointment) {
    throw createError({ statusCode: 404, statusMessage: 'Appointment not found.' })
  }

  // Ownership check
  if (appointment.userId !== user.id && user.role !== 'ADMIN') {
    throw createError({ statusCode: 403, statusMessage: 'Not authorized for this appointment.' })
  }

  // Must not be cancelled or no_show
  if (['CANCELLED', 'NO_SHOW'].includes(appointment.status)) {
    throw createError({ statusCode: 400, statusMessage: 'This appointment is not eligible for payment.' })
  }

  // Must not already be paid
  if (appointment.payment?.status === 'PAID') {
    throw createError({ statusCode: 400, statusMessage: 'This appointment has already been paid.' })
  }

  // Consent check: if there's an active consent template, appointment must have a consent record
  const activeTemplate = await prisma.consentTemplate.findFirst({ where: { active: true } })
  if (activeTemplate) {
    const consentRecord = await prisma.consentRecord.findFirst({
      where: {
        appointmentId: appointment.id,
        userId: appointment.userId,
        accepted: true,
      },
    })
    if (!consentRecord) {
      throw createError({ statusCode: 400, statusMessage: 'Consent must be captured before payment.' })
    }
  }

  const amountPence = appointment.priceCharged ?? appointment.service.priceFrom
  const config = useRuntimeConfig()
  const stripe = getStripe()

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'gbp',
          unit_amount: amountPence,
          product_data: {
            name: `${appointment.service.name} - ${appointment.dog.name}`,
            description: `Appointment on ${new Date(appointment.dateTime).toLocaleDateString('en-GB')}`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      appointmentId: appointment.id,
      userId: appointment.userId,
    },
    success_url: `${config.appBaseUrl}/dashboard/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.appBaseUrl}/dashboard`,
  })

  // Upsert payment record as PENDING
  await prisma.payment.upsert({
    where: { appointmentId: appointment.id },
    create: {
      appointmentId: appointment.id,
      amountPence,
      status: 'PENDING',
      provider: 'stripe',
      providerRef: session.payment_intent as string | null,
      checkoutSessionId: session.id,
    },
    update: {
      amountPence,
      status: 'PENDING',
      provider: 'stripe',
      providerRef: session.payment_intent as string | null,
      checkoutSessionId: session.id,
    },
  })

  return { url: session.url }
})
