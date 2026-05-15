import { NextRequest, NextResponse } from 'next/server'
import {
  createAiOsFolder,
  getAiOsRootFolderId,
  getDriveErrorMessage,
} from '@/lib/ai-os/googleDrive'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const name = String(body?.name || '').trim()
    const parentId = String(body?.parentId || getAiOsRootFolderId()).trim()

    if (!name) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Nome cartella mancante.',
        },
        { status: 400 }
      )
    }

    const folder = await createAiOsFolder(parentId, name)

    return NextResponse.json({
      ok: true,
      folder,
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
