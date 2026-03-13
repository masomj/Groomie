import { defineEventHandler, getQuery, createError } from 'h3'
import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const dateStr = query.date as string | undefined

  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    throw createError({ statusCode: 400, statusMessage: 'A valid date (YYYY-MM-DD) is required.' })
  }

  const date = new Date(dateStr + 'T00:00:00.000Z')
  if (isNaN(date.getTime())) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid date.' })
  }

  const dayOfWeek = date.getUTCDay()

  // Get availability slots for that day of week
  const slots = await prisma.availabilitySlot.findMany({
    where: { dayOfWeek, active: true },
    orderBy: { startTime: 'asc' },
  })

  // Get existing non-cancelled appointments for that date
  const dayStart = new Date(dateStr + 'T00:00:00.000Z')
  const dayEnd = new Date(dateStr + 'T23:59:59.999Z')

  const existingAppointments = await prisma.appointment.findMany({
    where: {
      dateTime: { gte: dayStart, lte: dayEnd },
      status: { notIn: ['CANCELLED', 'NO_SHOW'] },
    },
    select: { dateTime: true, durationMin: true },
  })

  const blockouts = await prisma.blockoutPeriod.findMany({
    where: {
      startsAt: { lt: dayEnd },
      endsAt: { gt: dayStart },
    },
    select: { startsAt: true, endsAt: true },
  })

  // Generate hourly time slots from availability, mark booked ones
  const available: { time: string; available: boolean }[] = []

  for (const slot of slots) {
    // Parse HH:MM format from startTime and endTime
    const startParts = slot.startTime.split(':')
    const endParts = slot.endTime.split(':')
    const startH = Number(startParts[0] ?? 0)
    const startM = Number(startParts[1] ?? 0)
    const endH = Number(endParts[0] ?? 0)
    const endM = Number(endParts[1] ?? 0)

    let h = startH
    let m = startM
    while (h < endH || (h === endH && m < endM)) {
      const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
      const slotStart = new Date(`${dateStr}T${timeStr}:00.000Z`)

      // Check if any existing appointment overlaps this slot
      const isBooked = existingAppointments.some((appt) => {
        const apptStart = new Date(appt.dateTime).getTime()
        const apptEnd = apptStart + appt.durationMin * 60 * 1000
        const slotTime = slotStart.getTime()
        const slotEnd = slotTime + 60 * 60 * 1000 // 1 hour default
        return slotTime < apptEnd && slotEnd > apptStart
      })

      const isBlocked = blockouts.some((blockout) => {
        const blockedStart = new Date(blockout.startsAt).getTime()
        const blockedEnd = new Date(blockout.endsAt).getTime()
        const slotTime = slotStart.getTime()
        const slotEnd = slotTime + 60 * 60 * 1000
        return slotTime < blockedEnd && slotEnd > blockedStart
      })

      available.push({ time: timeStr, available: !isBooked && !isBlocked })

      // Advance by 1 hour
      m += 60
      if (m >= 60) {
        h += Math.floor(m / 60)
        m = m % 60
      }
    }
  }

  return { date: dateStr, slots: available }
})
