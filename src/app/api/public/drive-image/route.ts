import { createServiceClient } from '@/lib/supabase/service'
import { jsonError } from '@/lib/ai-os'

async function callDriveScript(input: {
  action: string
  fileId: string
}) {
  const scriptUrl = process.env.AIOS_DRIVE_APP_SCRIPT_URL
  const token = process.env.AIOS_DRIVE_APP_SCRIPT_TOKEN

  if (!scriptUrl || !token) {
    throw new Error('Connettore Drive non configurato')
  }

  const response = await fetch(scriptUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify({
      token,
      action: input.action,
      fileId: input.fileId,
    }),
  })

  const text = await response.text()
  let payload: any = null

  try {
    payload = JSON.parse(text)
  } catch {
    throw new Error(`Risposta Drive non valida: ${text.slice(0, 180)}`)
  }

  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error || 'Errore lettura immagine Drive')
  }

  return payload
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const fileId = String(searchParams.get('fileId') || '').trim()

    if (!fileId) {
      return new Response('fileId mancante', { status: 400 })
    }

    const imageUrl = `/api/public/drive-image?fileId=${encodeURIComponent(fileId)}`
    const supabase = createServiceClient()

    const { data: mediaRows, error: mediaError } = await supabase
      .from('property_media')
      .select('id, property_id')
      .eq('file_url', imageUrl)
      .limit(1)

    if (mediaError) {
      throw new Error(mediaError.message || 'Errore controllo galleria pubblica')
    }

    if (!mediaRows || mediaRows.length === 0) {
      return new Response('Immagine non registrata nella galleria pubblica', {
        status: 404,
      })
    }

    const payload = await callDriveScript({
      action: 'imageFile',
      fileId,
    })

    const mimeType = String(payload.mimeType || 'image/jpeg')
    const rawBase64 = String(payload.base64Data || '')
      .replace(/^data:[^;]+;base64,/, '')
      .trim()

    if (!rawBase64) {
      return new Response('Immagine vuota', { status: 404 })
    }

    const bytes = Buffer.from(rawBase64, 'base64')

    return new Response(bytes, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=86400',
      },
    })
  } catch (error) {
    console.error('Public Drive image exception:', error)

    return new Response(jsonError(error, 'Errore immagine Drive pubblica'), {
      status: 500,
    })
  }
}
