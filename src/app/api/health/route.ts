import { NextResponse } from 'next/server'

export function GET() {
  return NextResponse.json({
    ok: true,
    service: 'bookright-platform',
    timestamp: new Date().toISOString(),
  })
}

