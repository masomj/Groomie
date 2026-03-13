import { PrismaClient } from '../generated/prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // ── Services ────────────────────────────────────────────────────────
  const services = [
    {
      name: 'Wash & Dry',
      description:
        'A thorough wash using premium shampoo tailored to your dog\'s coat, followed by a full blow-dry and brush-out.',
      priceFrom: 1500, // £15.00
      priceTo: 2500,   // £25.00
      durationMin: 45,
      sortOrder: 1,
    },
    {
      name: 'Full Groom',
      description:
        'Complete groom including wash, dry, full-body clip or scissor cut, nail trim, ear clean, and finishing spray.',
      priceFrom: 2500, // £25.00
      priceTo: 3500,   // £35.00
      durationMin: 90,
      sortOrder: 2,
    },
    {
      name: 'De-Shed Treatment',
      description:
        'Specialist de-shedding shampoo and conditioner with thorough blow-out to remove loose undercoat.',
      priceFrom: 2000, // £20.00
      priceTo: 3000,   // £30.00
      durationMin: 60,
      sortOrder: 3,
    },
    {
      name: 'Puppy Groom',
      description:
        'Gentle introductory groom for puppies. Includes wash, light trim, nail clip, and lots of positive reinforcement.',
      priceFrom: 1500, // £15.00
      priceTo: 2000,   // £20.00
      durationMin: 30,
      sortOrder: 4,
    },
  ]

  for (const svc of services) {
    await prisma.service.upsert({
      where: { name: svc.name },
      update: svc,
      create: svc,
    })
  }
  console.log(`  ✓ ${services.length} services seeded`)

  // ── Admin user ──────────────────────────────────────────────────────
  const adminEmail = 'admin@pamperedpooch.co.uk'
  const adminPassword = 'admin1234' // change in production!
  const hash = await bcrypt.hash(adminPassword, 10)

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: hash,
      role: 'ADMIN',
      firstName: 'Admin',
      lastName: 'User',
    },
  })
  console.log('  ✓ Admin user seeded (admin@pamperedpooch.co.uk / admin1234)')

  // ── Consent template ───────────────────────────────────────────────
  await prisma.consentTemplate.upsert({
    where: { title_version: { title: 'Terms & Conditions', version: 1 } },
    update: {},
    create: {
      title: 'Terms & Conditions',
      version: 1,
      body: 'By booking a grooming appointment with Pampered Pooch Porthcawl you agree to the following terms...',
      active: true,
    },
  })
  console.log('  ✓ Consent template seeded')

  // ── Default availability (Mon–Sat 09:00–17:00) ────────────────────
  for (let day = 1; day <= 6; day++) {
    await prisma.availabilitySlot.upsert({
      where: { dayOfWeek_startTime: { dayOfWeek: day, startTime: '09:00' } },
      update: {},
      create: {
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '17:00',
        active: true,
      },
    })
  }
  console.log('  ✓ Availability slots seeded (Mon–Sat 09:00–17:00)')

  console.log('Seeding complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
