import { NextResponse } from 'next/server'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { requireAdminProfile } from '@/lib/admin-auth'
import { jsonError } from '@/lib/ai-os'

export const dynamic = 'force-dynamic'

function cleanText(value: unknown) {
  return String(value ?? '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim()
}

function cleanFilename(value: unknown) {
  const cleaned = String(value ?? 'documento-ai-os')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9À-ÿ]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120)

  return cleaned || 'documento-ai-os'
}

function wrapLine(input: string, font: any, fontSize: number, maxWidth: number) {
  const text = input || ''
  const words = text.split(/\s+/).filter(Boolean)

  if (words.length === 0) return ['']

  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    const width = font.widthOfTextAtSize(candidate, fontSize)

    if (width <= maxWidth) {
      current = candidate
      continue
    }

    if (current) {
      lines.push(current)
      current = word
    } else {
      lines.push(word)
      current = ''
    }
  }

  if (current) lines.push(current)

  return lines
}

export async function POST(request: Request) {
  try {
    const profile = await requireAdminProfile()

    if (!profile?.is_active) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    const body = await request.json().catch(() => null)

    const title = cleanText(body?.title || 'Documento AI-OS')
    const content = cleanText(body?.content)
    const filename = cleanFilename(body?.filename || title)

    if (!content) {
      return NextResponse.json(
        { error: 'Contenuto documento mancante' },
        { status: 400 },
      )
    }

    const pdfDoc = await PDFDocument.create()
    const regularFont = await pdfDoc.embedFont(StandardFonts.Courier)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    const pageWidth = 595.28
    const pageHeight = 841.89
    const marginX = 48
    const marginTop = 54
    const marginBottom = 48
    const titleSize = 15
    const fontSize = 10
    const lineHeight = 15
    const maxTextWidth = pageWidth - marginX * 2

    let page = pdfDoc.addPage([pageWidth, pageHeight])
    let y = pageHeight - marginTop

    page.drawText(title, {
      x: marginX,
      y,
      size: titleSize,
      font: boldFont,
      color: rgb(0.08, 0.1, 0.14),
      maxWidth: maxTextWidth,
    })

    y -= 26

    page.drawLine({
      start: { x: marginX, y },
      end: { x: pageWidth - marginX, y },
      thickness: 0.8,
      color: rgb(0.55, 0.6, 0.68),
    })

    y -= 24

    const lines = content.split('\n')

    for (const rawLine of lines) {
      const wrappedLines = wrapLine(rawLine, regularFont, fontSize, maxTextWidth)

      for (const line of wrappedLines) {
        if (y <= marginBottom) {
          page = pdfDoc.addPage([pageWidth, pageHeight])
          y = pageHeight - marginTop
        }

        page.drawText(line || ' ', {
          x: marginX,
          y,
          size: fontSize,
          font: regularFont,
          color: rgb(0.06, 0.07, 0.09),
        })

        y -= lineHeight
      }
    }

    const pages = pdfDoc.getPages()
    pages.forEach((pdfPage, index) => {
      pdfPage.drawText(`AI-OS Area Immobiliare · ${index + 1}/${pages.length}`, {
        x: marginX,
        y: 24,
        size: 8,
        font: regularFont,
        color: rgb(0.45, 0.48, 0.55),
      })
    })

    const pdfBytes = await pdfDoc.save()

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}.pdf"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: jsonError(error, 'Errore generazione PDF') },
      { status: 500 },
    )
  }
}
