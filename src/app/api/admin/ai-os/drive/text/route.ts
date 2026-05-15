import { NextRequest, NextResponse } from 'next/server'
import {
  getDriveErrorMessage,
  saveAiOsTextFile,
} from '@/lib/ai-os/googleDrive'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const file = await saveAiOsTextFile({
      fileId: body?.fileId ? String(body.fileId) : undefined,
      parentId: body?.parentId ? String(body.parentId) : undefined,
      name: body?.name ? String(body.name) : undefined,
      content: body?.content ? String(body.content) : '',
    })

    return NextResponse.json({
      ok: true,
      file,
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
