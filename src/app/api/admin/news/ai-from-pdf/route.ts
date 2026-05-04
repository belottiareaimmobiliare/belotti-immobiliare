import { NextResponse } from 'next/server'
import { createRequire } from 'module'
import { getCurrentAdminProfile } from '@/lib/admin-auth'
import { generateNewsFromPdfText } from '@/lib/news-ai-free'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const require = createRequire(import.meta.url)

type PdfParseFunction = (buffer: Buffer) => Promise<{ text?: string }>

async function extractPdfText(buffer: Buffer) {
  const pdfParse = require('pdf-parse/lib/pdf-parse.js') as PdfParseFunction

  if (typeof pdfParse !== 'function') {
    throw new Error('Motore PDF non disponibile sul server.')
  }

  const result = await pdfParse(buffer)
  return result.text || ''
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
      (profile.role !== 'owner' && !profile.can_manage_news)
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

    const generated = generateNewsFromPdfText(extractedText)

    return NextResponse.json({
      ok: true,
      ...generated,
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
