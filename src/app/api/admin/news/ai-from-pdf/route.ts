import { NextResponse } from 'next/server'
import { createRequire } from 'module'
import { getCurrentAdminProfile } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { generateNewsFromPdfText } from '@/lib/news-ai-free'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const require = createRequire(import.meta.url)
const NEWS_PDF_BUCKET = 'news-pdfs'

type PdfParseFunction = (buffer: Buffer) => Promise<{ text?: string }>

function slugifyFileName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90) || 'news'
}

function formatRomeDateTime() {
  const parts = new Intl.DateTimeFormat('it-IT', {
    timeZone: 'Europe/Rome',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date())

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value || '00'

  return `${get('year')}-${get('month')}-${get('day')}_${get('hour')}-${get(
    'minute'
  )}`
}

async function extractPdfText(buffer: Buffer) {
  const pdfParse = require('pdf-parse/lib/pdf-parse.js') as PdfParseFunction

  if (typeof pdfParse !== 'function') {
    throw new Error('Motore PDF non disponibile sul server.')
  }

  const result = await pdfParse(buffer)
  return result.text || ''
}

async function ensureNewsPdfBucket() {
  const service = createServiceClient()
  const { data: buckets, error: listError } = await service.storage.listBuckets()

  if (listError) {
    throw new Error(`Errore verifica bucket PDF: ${listError.message}`)
  }

  const exists = buckets?.some((bucket) => bucket.name === NEWS_PDF_BUCKET)

  if (!exists) {
    const { error: createError } = await service.storage.createBucket(
      NEWS_PDF_BUCKET,
      {
        public: false,
        allowedMimeTypes: ['application/pdf'],
        fileSizeLimit: 10 * 1024 * 1024,
      }
    )

    if (createError) {
      throw new Error(`Errore creazione bucket PDF: ${createError.message}`)
    }
  }

  return service
}

async function savePdfToStorage({
  buffer,
  fileName,
}: {
  buffer: Buffer
  fileName: string
}) {
  const service = await ensureNewsPdfBucket()

  const { error } = await service.storage
    .from(NEWS_PDF_BUCKET)
    .upload(fileName, buffer, {
      contentType: 'application/pdf',
      upsert: true,
    })

  if (error) {
    throw new Error(`Errore salvataggio PDF: ${error.message}`)
  }
}

function buildPublicPdfUrl(request: Request, fileName: string) {
  const originFromRequest = new URL(request.url).origin
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || originFromRequest

  return `${baseUrl}/pdf/${encodeURIComponent(fileName)}`
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'AI News PDF assistant',
  })
}

export async function POST(request: Request) {
  try {
    const profile = await getCurrentAdminProfile()

    if (
      !profile ||
      !profile.is_active ||
      (profile.role !== 'owner' && profile.role !== 'administrator' && !profile.can_manage_news)
    ) {
      return NextResponse.json(
        { error: 'Operazione non autorizzata.' },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: 'File PDF mancante.' },
        { status: 400 }
      )
    }

    const isPdf =
      file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')

    if (!isPdf) {
      return NextResponse.json(
        { error: 'Carica un file PDF valido.' },
        { status: 400 }
      )
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Il PDF supera la dimensione massima di 10 MB.' },
        { status: 400 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const extractedText = (await extractPdfText(buffer)).trim()

    if (!extractedText || extractedText.length < 120) {
      return NextResponse.json(
        {
          error:
            'Il PDF non contiene abbastanza testo leggibile. Potrebbe essere una scansione immagine.',
        },
        { status: 400 }
      )
    }

    const generatedBase = generateNewsFromPdfText(extractedText)

    const safeTitle = slugifyFileName(generatedBase.title)
    const timestamp = formatRomeDateTime()
    const finalPdfFileName = `${safeTitle}_${timestamp}.pdf`
    const sourcePdfUrl = buildPublicPdfUrl(request, finalPdfFileName)

    await savePdfToStorage({
      buffer,
      fileName: finalPdfFileName,
    })

    const pdfFooterPlain = `Fonte PDF completa:\n${sourcePdfUrl}`
    const pdfFooterHtml = `<p><strong>Fonte PDF completa:</strong><br><a href="${sourcePdfUrl}">${sourcePdfUrl}</a></p>`

    return NextResponse.json({
      ok: true,
      ...generatedBase,
      sourcePdfUrl,
      pdfFileName: finalPdfFileName,
      plainContent: generatedBase.plainContent.includes(sourcePdfUrl)
        ? generatedBase.plainContent
        : `${generatedBase.plainContent}\n\n${pdfFooterPlain}`,
      content: generatedBase.content.includes(sourcePdfUrl)
        ? generatedBase.content
        : `${generatedBase.content}\n${pdfFooterHtml}`,
    })
  } catch (error) {
    console.error('Errore AI News da PDF:', error)

    const detail =
      error instanceof Error
        ? error.message
        : 'Errore sconosciuto durante l’analisi del PDF.'

    return NextResponse.json(
      {
        error: `Errore durante l’analisi del PDF: ${detail}`,
      },
      { status: 500 }
    )
  }
}
