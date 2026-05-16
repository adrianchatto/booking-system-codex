import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  assertBookingStatusTransition,
  getStatusForAction,
  isKnownBookingAction,
  type BookingStatus,
} from '@/lib/booking-workflow'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json()
  const { action, status, notes, startTime, endTime } = body

  const booking = await prisma.booking.findUnique({ where: { id: params.id } })
  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

  const user = session.user as any
  if (user.role === 'TENANT_ADMIN' && booking.tenantId !== user.tenantId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let nextStatus = status as BookingStatus | undefined
  if (action) {
    if (!isKnownBookingAction(action)) {
      return NextResponse.json({ error: 'Unknown booking action' }, { status: 400 })
    }
    nextStatus = getStatusForAction(action)
  }

  if (nextStatus && nextStatus !== booking.status) {
    try {
      assertBookingStatusTransition(booking.status as BookingStatus, nextStatus)
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message }, { status: 409 })
    }
  }

  const updated = await prisma.booking.update({
    where: { id: params.id },
    data: {
      ...(nextStatus ? { status: nextStatus } : {}),
      ...(notes !== undefined ? { notes } : {}),
      ...(startTime ? { startTime: new Date(startTime) } : {}),
      ...(endTime ? { endTime: new Date(endTime) } : {}),
    },
    include: { customer: true, service: true },
  })

  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const booking = await prisma.booking.findUnique({ where: { id: params.id } })
  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

  const user = session.user as any
  if (user.role === 'TENANT_ADMIN' && booking.tenantId !== user.tenantId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.booking.update({
    where: { id: params.id },
    data: { status: 'CANCELLED' },
  })

  return NextResponse.json({ success: true })
}
