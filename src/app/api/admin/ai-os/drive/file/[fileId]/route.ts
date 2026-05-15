import { NextRequest, NextResponse } from 'next/server'
import { Readable } from 'node:stream'
import {
  getAiOsDriveFileBuffer,
  getAiOsDriveFileMetadata,
  getAiOsDriveFileStream,
  getDriveErrorMessage,
} from '@/lib/ai-os/googleDrive'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{
    fileId: string
  }>
}

function safeDispositionFileName(name: string) {
  return encodeURIComponent(name).replace(/['()]/g, escape).replace(/\*/g, '%2A')
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { fileId } = await context.params
    const searchParams = request.nextUrl.searchParams

    const raw = searchParams.get('raw') === '1'
    const download = searchParams.get('download') === '1'
    const text = searchParams.get('text') === '1'

    const metadata = await getAiOsDriveFileMetadata(fileId)

    if (text) {
      const buffer = await getAiOsDriveFileBuffer(fileId)

      return NextResponse.json(
        {
          ok: true,
          file: metadata,
          content: buffer.toString('utf8'),
        },
        {
          headers: {
            'Cache-Control': 'no-store',
          },
        }
      )
    }

    if (!raw) {
      return NextResponse.json(
        {
          ok: true,
          file: metadata,
        },
        {
          headers: {
            'Cache-Control': 'no-store',
          },
        }
      )
    }

    const stream = await getAiOsDriveFileStream(fileId)

    const headers = new Headers()
    headers.set('Content-Type', metadata.mimeType || 'application/octet-stream')
    headers.set('Cache-Control', 'private, max-age=60')

    if (metadata.size) {
      headers.set('Content-Length', metadata.size)
    }

    const dispositionType = download ? 'attachment' : 'inline'
    headers.set(
      'Content-Disposition',
      `${dispositionType}; filename*=UTF-8''${safeDispositionFileName(metadata.name)}`
    )

    return new Response(Readable.toWeb(stream) as unknown as BodyInit, {
      status: 200,
      headers,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: getDriveErrorMessage(error),
      },
      { status: 500 }
    )
  }
}
