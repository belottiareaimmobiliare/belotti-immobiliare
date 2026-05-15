import { NextRequest, NextResponse } from 'next/server'
import {
  getDriveErrorMessage,
  listAiOsDriveFiles,
} from '@/lib/ai-os/googleDrive'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const folderId = searchParams.get('folderId') || undefined
    const pageToken = searchParams.get('pageToken')

    const result = await listAiOsDriveFiles(folderId, pageToken)

    return NextResponse.json(
      {
        ok: true,
        ...result,
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    )
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
