import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const NEWS_PDF_BUCKET = 'news-pdfs'

function isSafePdfFileName(value: string) {
  if (!value.endsWith('.pdf')) return false
  if (value.includes('/') || value.includes('\\') || value.includes('..')) {
    return false
  }

  return /^[a-zA-Z0-9._-]+\.pdf$/.test(value)
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ filename: string }> }
) {
  const { filename } = await context.params
  const decodedFileName = decodeURIComponent(filename)

  if (!isSafePdfFileName(decodedFileName)) {
    return NextResponse.json({ error: 'PDF non valido.' }, { status: 400 })
  }

  const service = createServiceClient()

  const { data, error } = await service.storage
    .from(NEWS_PDF_BUCKET)
    .download(decodedFileName)

  if (error || !data) {
    return NextResponse.json({ error: 'PDF non trovato.' }, { status: 404 })
  }

  const arrayBuffer = await data.arrayBuffer()

  return new Response(arrayBuffer, {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `inline; filename="${decodedFileName}"`,
      'cache-control': 'public, max-age=3600',
    },
  })
}
