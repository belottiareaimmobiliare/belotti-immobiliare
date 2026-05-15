import { NextResponse } from 'next/server'
import {
  ensureAiOsDesktopFolders,
  getDriveErrorMessage,
} from '@/lib/ai-os/googleDrive'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const desktop = await ensureAiOsDesktopFolders()

    return NextResponse.json(
      {
        ok: true,
        desktop,
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
