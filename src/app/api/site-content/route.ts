import { NextResponse } from 'next/server'
import { getAboutContent, getHomeContent } from '@/lib/site-content.server'
import { ABOUT_CONTENT_KEY, HOME_CONTENT_KEY } from '@/lib/site-content'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const key = searchParams.get('key')

  if (key === HOME_CONTENT_KEY) {
    const content = await getHomeContent()

    return NextResponse.json(content, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    })
  }

  if (key === ABOUT_CONTENT_KEY) {
    const content = await getAboutContent()

    return NextResponse.json(content, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    })
  }

  return NextResponse.json({ error: 'Chiave non valida' }, { status: 400 })
}