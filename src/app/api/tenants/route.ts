import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  getDefaultTenantSettings,
  getStarterServices,
  validateTenantProvisioningInput,
} from '@/lib/tenant-provisioning'
import bcrypt from 'bcryptjs'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const user = session?.user as any
  if (!session || user?.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const tenants = await prisma.tenant.findMany({
    include: {
      settings: true,
      _count: { select: { bookings: true, customers: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(tenants)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const user = session?.user as any
  if (!session || user?.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const result = validateTenantProvisioningInput(await req.json())

  if (!result.ok) {
    return NextResponse.json({ error: result.errors[0], errors: result.errors }, { status: 400 })
  }

  const { businessName, slug, type, adminEmail, adminName, adminPassword } = result.value
  const existing = await prisma.tenant.findUnique({ where: { slug } })
  if (existing) return NextResponse.json({ error: 'Slug already taken' }, { status: 409 })

  const hashedPw = await bcrypt.hash(adminPassword, 10)

  const tenant = await prisma.tenant.create({
    data: {
      businessName,
      slug,
      type,
      settings: {
        create: getDefaultTenantSettings(type, businessName, adminEmail),
      },
      services: {
        create: getStarterServices(type),
      },
      users: {
        create: {
          email: adminEmail,
          name: adminName,
          password: hashedPw,
        },
      },
    },
    include: {
      settings: true,
      _count: { select: { bookings: true, customers: true } },
    },
  })

  return NextResponse.json(tenant, { status: 201 })
}
