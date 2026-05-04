import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getCurrentAdminProfile } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const BUCKET_NAME = 'property-media'

function safeExt(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase() || 'jpg'

  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) {
    return ext
  }

  return 'jpg'
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
    const newsItemId = String(formData.get('newsItemId') || '').trim()
    const file = formData.get('file')

    if (!newsItemId) {
      return NextResponse.json(
        { error: 'ID news mancante.' },
        { status: 400 }
      )
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: 'File immagine mancante.' },
        { status: 400 }
      )
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Carica un file immagine valido.' },
        { status: 400 }
      )
    }

    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Immagine troppo pesante. Carica un file massimo da 8 MB.' },
        { status: 400 }
      )
    }

    const ext = safeExt(file.name)
    const fileName = `news-${Date.now()}-${randomUUID()}.${ext}`
    const filePath = `news/${newsItemId}/${fileName}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const service = createServiceClient()

    const { error: uploadError } = await service.storage
      .from(BUCKET_NAME)
      .upload(filePath, buffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      })

    if (uploadError) {
      return NextResponse.json(
        { error: `Errore Supabase Storage: ${uploadError.message}` },
        { status: 500 }
      )
    }

    const { data } = service.storage.from(BUCKET_NAME).getPublicUrl(filePath)

    return NextResponse.json({
      ok: true,
      imageUrl: data.publicUrl,
      filePath,
    })
  } catch (error) {
    console.error('Errore upload immagine news:', error)

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Errore durante l'upload immagine.",
      },
      { status: 500 }
    )
  }
}
