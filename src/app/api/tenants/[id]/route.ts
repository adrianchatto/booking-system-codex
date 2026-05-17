import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { normalizeSmtpSettings, redactSmtpSettings } from '@/lib/email-settings'
import { encryptSecret } from '@/lib/secret-crypto'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const user = session?.user as any
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const tenant = await prisma.tenant.findUnique({
    where: { id: params.id },
    include: {
      settings: true,
      services: { where: { active: true }, orderBy: { createdAt: 'asc' } },
      _count: { select: { bookings: true, customers: true } },
    },
  })

  if (!tenant) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (user?.role === 'TENANT_ADMIN' && tenant.id !== user.tenantId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json({
    ...tenant,
    settings: tenant.settings ? {
      ...tenant.settings,
      ...redactSmtpSettings(tenant.settings),
      smtpPasswordEncrypted: undefined,
    } : tenant.settings,
  })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const user = session?.user as any
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const tenant = await prisma.tenant.findUnique({ where: { id: params.id } })
  if (!tenant) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (user?.role === 'TENANT_ADMIN' && tenant.id !== user.tenantId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()

  // Separate tenant-level fields from settings fields
  const { status, businessName, settings: settingsData } = body
  let preparedSettings = settingsData

  if (settingsData) {
    const smtp = normalizeSmtpSettings(settingsData)
    const { smtpPassword, smtpPasswordSet, emailStatus, ...settingsWithoutPassword } = settingsData
    preparedSettings = {
      ...settingsWithoutPassword,
      smtpHost: smtp.smtpHost || null,
      smtpPort: smtp.smtpPort || null,
      smtpSecure: smtp.smtpSecure,
      smtpUsername: smtp.smtpUsername || null,
      smtpFromEmail: smtp.smtpFromEmail || null,
      smtpFromName: smtp.smtpFromName || null,
      ...(smtp.smtpPassword ? { smtpPasswordEncrypted: encryptSecret(smtp.smtpPassword) } : {}),
    }
  }

  const updated = await prisma.tenant.update({
    where: { id: params.id },
    data: {
      ...(businessName ? { businessName } : {}),
      ...(status ? { status } : {}),
      ...(preparedSettings ? {
        settings: {
          upsert: {
            create: preparedSettings,
            update: preparedSettings,
          },
        },
      } : {}),
    },
    include: { settings: true },
  })

  return NextResponse.json({
    ...updated,
    settings: updated.settings ? {
      ...updated.settings,
      ...redactSmtpSettings(updated.settings),
      smtpPasswordEncrypted: undefined,
    } : updated.settings,
  })
}
