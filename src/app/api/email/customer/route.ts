import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getEmailConfigStatus } from '@/lib/email-settings'
import { decryptSecret } from '@/lib/secret-crypto'
import { sendSmtpMail } from '@/lib/smtp-client'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const user = session?.user as any
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!user?.tenantId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { customerId, subject, message } = await req.json()
  if (!customerId || !subject?.trim() || !message?.trim()) {
    return NextResponse.json({ error: 'Customer, subject, and message are required' }, { status: 400 })
  }

  const [tenant, customer] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: user.tenantId },
      include: { settings: true },
    }),
    prisma.customer.findUnique({ where: { id: customerId } }),
  ])

  if (!tenant?.settings) return NextResponse.json({ error: 'Email settings are not configured' }, { status: 400 })
  if (!customer || customer.tenantId !== user.tenantId) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })

  const status = getEmailConfigStatus(tenant.settings)
  if (!status.configured) {
    return NextResponse.json({
      error: `Email settings are missing: ${status.missing.join(', ')}`,
      missing: status.missing,
    }, { status: 400 })
  }

  await sendSmtpMail({
    host: tenant.settings.smtpHost!,
    port: tenant.settings.smtpPort!,
    secure: tenant.settings.smtpSecure,
    username: tenant.settings.smtpUsername!,
    password: decryptSecret(tenant.settings.smtpPasswordEncrypted!),
    fromEmail: tenant.settings.smtpFromEmail!,
    fromName: tenant.settings.smtpFromName || tenant.businessName,
    toEmail: customer.email,
    subject: subject.trim(),
    text: message.trim(),
  })

  return NextResponse.json({ ok: true })
}
