import { NextRequest, NextResponse } from 'next/server'
import {
  getAiOsRootFolderId,
  getDriveErrorMessage,
  uploadAiOsDriveFile,
} from '@/lib/ai-os/googleDrive'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const parentId = String(formData.get('parentId') || getAiOsRootFolderId()).trim()

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          ok: false,
          error: 'File mancante.',
        },
        { status: 400 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const uploaded = await uploadAiOsDriveFile({
      parentId,
      name: file.name,
      mimeType: file.type || 'application/octet-stream',
      buffer,
    })

    return NextResponse.json({
      ok: true,
      file: uploaded,
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
