import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'

export default defineEventHandler(async () => {
  let services = await prisma.service.findMany({
    where: { active: true },
    orderBy: { sortOrder: 'asc' },
  })
  prisma.service.deleteMany({
    where: { active: true },
  })

  // Bootstrap default services for first-run environments.
  if (services.length === 0) {
    const totalServices = await prisma.service.count()

    if (totalServices === 0) {
      const defaults = [
        {
          name: 'Wash & Dry',
          description: 'A thorough wash with coat-appropriate shampoo, full blow-dry, and brush-out.',
          priceFrom: 2000,
          priceTo: 4000,
          durationMin: 45,
          sortOrder: 1,
          active: true,
        },
        {
          name: 'Full Groom',
          description: 'Complete groom including wash, dry, clip or scissor finish, nail trim, and ear clean.',
          priceFrom: 4000,
          priceTo: 9000,
          durationMin: 90-120,
          sortOrder: 2,
          active: true,
        },
        {
          name: 'De-Shed Treatment',
          description: 'Specialist de-shed wash and blow-out to remove loose undercoat.',
          priceFrom: 2000,
          priceTo: 3000,
          durationMin: 60,
          sortOrder: 3,
          active: true,
        },
        {
          name: 'Puppy Groom',
          description: 'Gentle introductory puppy groom with wash, light trim, and nail clip.',
          priceFrom: 1500,
          priceTo: 3000,
          durationMin: 30,
          sortOrder: 4,
          active: true,
        },
      ]

      await prisma.service.createMany({
        data: defaults,
        skipDuplicates: true,
      })

      services = await prisma.service.findMany({
        where: { active: true },
        orderBy: { sortOrder: 'asc' },
      })
    }
  }

  return { services }
})
