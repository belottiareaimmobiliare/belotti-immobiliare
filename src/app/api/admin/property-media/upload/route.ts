import { NextResponse } from 'next/server'
import { requireAdminProfile } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'

type MediaType = 'image' | 'plan'

function isMediaType(value: string): value is MediaType {
  return value === 'image' || value === 'plan'
}

function safeExtension(fileName: string, mediaType: MediaType) {
  const rawExtension = fileName.split('.').pop()?.toLowerCase().trim()

  if (!rawExtension) {
    return mediaType === 'plan' ? 'pdf' : 'jpg'
  }

  return rawExtension.replace(/[^a-z0-9]/g, '') || (mediaType === 'plan' ? 'pdf' : 'jpg')
}

export async function POST(request: Request) {
  try {
    const profile = await requireAdminProfile()

    if (profile.role !== 'owner' && profile.role !== 'administrator' && !profile.can_manage_properties) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    const formData = await request.formData()

    const propertyId = String(formData.get('property_id') ?? '').trim()
    const mediaTypeRaw = String(formData.get('media_type') ?? '').trim()
    const file = formData.get('file')

    if (!propertyId || !isMediaType(mediaTypeRaw) || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'Dati upload mancanti o non validi' },
        { status: 400 },
      )
    }

    if (mediaTypeRaw === 'image' && !file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Il file selezionato non è una immagine valida' },
        { status: 400 },
      )
    }

    if (
      mediaTypeRaw === 'plan' &&
      file.type !== 'application/pdf' &&
      !file.type.startsWith('image/')
    ) {
      return NextResponse.json(
        { error: 'La planimetria deve essere un PDF o una immagine' },
        { status: 400 },
      )
    }

    const supabase = createServiceClient()

    const bucketName = mediaTypeRaw === 'image' ? 'property-media' : 'property-plans'
    const extension = safeExtension(file.name, mediaTypeRaw)
    const fileName = `${mediaTypeRaw}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${extension}`

    const filePath = `properties/${propertyId}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || undefined,
      })

    if (uploadError) {
      console.error('Errore upload admin media:', uploadError)

      return NextResponse.json(
        { error: uploadError.message || 'Errore upload file' },
        { status: 500 },
      )
    }

    const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath)

    return NextResponse.json({
      ok: true,
      publicUrl: data.publicUrl,
      bucketName,
      filePath,
    })
  } catch (error) {
    console.error('Errore API upload media admin:', error)

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Errore interno durante upload media',
      },
      { status: 500 },
    )
  }
}
