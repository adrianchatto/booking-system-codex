import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()
const LEGACY_DEMO_SLUGS = ['bright-windows', 'shear-perfection', 'peak-performance', 'rapidfix-plumbing']

async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL ?? 'superadmin@platform.com'
  const password = process.env.SUPER_ADMIN_PASSWORD ?? 'SuperAdmin2024!'
  const name = process.env.SUPER_ADMIN_NAME ?? 'Platform Admin'
  const hashedPassword = await bcrypt.hash(password, 10)

  await prisma.superAdmin.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      name,
    },
    create: {
      email,
      password: hashedPassword,
      name,
    },
  })

  const deletedDemoBusinesses = await prisma.tenant.deleteMany({
    where: { slug: { in: LEGACY_DEMO_SLUGS } },
  })

  console.log(`Platform admin ready: ${email}`)
  if (deletedDemoBusinesses.count > 0) {
    console.log(`Removed ${deletedDemoBusinesses.count} legacy demo business account(s).`)
  }
  console.log('No demo businesses are created. Create real businesses from /admin/dashboard.')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
