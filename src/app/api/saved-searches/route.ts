import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    {
      error:
        'Usa /api/saved-searches/request-verification e /api/saved-searches/verify-code.',
    },
    { status: 400 }
  )
}
