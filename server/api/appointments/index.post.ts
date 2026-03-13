import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireAuth } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const body = await readBody<{
    serviceId?: string
    dogId?: string
    dateTime?: string
    notes?: string
    consent?: {
      templateId: string
      accepted: boolean
      signedName?: string
    }
  }>(event)

  if (!body?.serviceId) {
    throw createError({ statusCode: 400, statusMessage: 'Service is required.' })
  }
  if (!body?.dogId) {
    throw createError({ statusCode: 400, statusMessage: 'Dog is required.' })
  }
  if (!body?.dateTime) {
    throw createError({ statusCode: 400, statusMessage: 'Date and time are required.' })
  }

  // Validate the dateTime
  const dt = new Date(body.dateTime)
  if (isNaN(dt.getTime())) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid date/time format.' })
  }
  if (dt.getTime() <= Date.now()) {
    throw createError({ statusCode: 400, statusMessage: 'Appointment must be in the future.' })
  }

  // Verify ownership of the dog
  const dog = await prisma.dog.findUnique({ where: { id: body.dogId } })
  if (!dog) {
    throw createError({ statusCode: 404, statusMessage: 'Dog not found.' })
  }
  if (dog.ownerId !== user.id) {
    throw createError({ statusCode: 403, statusMessage: 'You can only book appointments for your own dogs.' })
  }

  // Verify service exists and is active
  const service = await prisma.service.findUnique({ where: { id: body.serviceId } })
  if (!service || !service.active) {
    throw createError({ statusCode: 404, statusMessage: 'Service not found or not available.' })
  }

  // Validate consent: check if there's an active template
  const activeTemplate = await prisma.consentTemplate.findFirst({ where: { active: true } })
  if (activeTemplate) {
    if (!body.consent || !body.consent.accepted) {
      throw createError({ statusCode: 400, statusMessage: 'You must accept the terms and conditions before booking.' })
    }
    if (body.consent.templateId !== activeTemplate.id) {
      throw createError({ statusCode: 400, statusMessage: 'Consent template has changed. Please review and accept the current terms.' })
    }
  }

  // Use a transaction for conflict-safe booking + atomic consent record
  const result = await prisma.$transaction(async (tx) => {
    // Check for conflicting appointments
    const apptStart = dt.getTime()
    const apptEnd = apptStart + service.durationMin * 60 * 1000

    const overlappingBlockout = await tx.blockoutPeriod.findFirst({
      where: {
        startsAt: { lt: new Date(apptEnd) },
        endsAt: { gt: new Date(apptStart) },
      },
      select: { id: true },
    })

    if (overlappingBlockout) {
      throw createError({ statusCode: 409, statusMessage: 'This time slot is unavailable. Please choose another.' })
    }

    const conflicts = await tx.appointment.findMany({
      where: {
        dateTime: {
          gte: new Date(apptStart - 24 * 60 * 60 * 1000),
          lte: new Date(apptEnd + 24 * 60 * 60 * 1000),
        },
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      },
    })

    const hasConflict = conflicts.some((c) => {
      const cStart = new Date(c.dateTime).getTime()
      const cEnd = cStart + c.durationMin * 60 * 1000
      return apptStart < cEnd && apptEnd > cStart
    })

    if (hasConflict) {
      throw createError({ statusCode: 409, statusMessage: 'This time slot is no longer available. Please choose another.' })
    }

    const appointment = await tx.appointment.create({
      data: {
        userId: user.id,
        dogId: body.dogId!,
        serviceId: body.serviceId!,
        dateTime: dt,
        durationMin: service.durationMin,
        priceCharged: service.priceFrom,
        notes: body.notes?.trim() || null,
        status: 'PENDING',
      },
      include: {
        dog: { select: { id: true, name: true } },
        service: { select: { id: true, name: true } },
      },
    })

    // Create consent record atomically if active template exists
    if (activeTemplate && body.consent) {
      await tx.consentRecord.create({
        data: {
          userId: user.id,
          appointmentId: appointment.id,
          templateId: activeTemplate.id,
          accepted: true,
          payload: {
            signedName: body.consent.signedName || null,
            templateTitle: activeTemplate.title,
            templateVersion: activeTemplate.version,
            templateBody: activeTemplate.body,
            acceptedAt: new Date().toISOString(),
          },
        },
      })
    }

    return appointment
  })

  return { appointment: result }
})
