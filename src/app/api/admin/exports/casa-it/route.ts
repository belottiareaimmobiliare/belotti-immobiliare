import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { normalizeExportProperty } from '@/lib/exports/properties-export'

export const dynamic = 'force-dynamic'

function todayIt() {
  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Europe/Rome',
  })
    .format(new Date())
    .replaceAll('/', '-')
}

function safeFilePart(value: unknown) {
  return String(value || 'immobile')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!process.env.EXPORT_TOKEN || token !== process.env.EXPORT_TOKEN) {
    return NextResponse.json({ error: 'Token export non valido.' }, { status: 401 })
  }

  const propertyId = searchParams.get('id')

  const service = createServiceClient()

  let query = service
    .from('properties')
    .select(`
      *,
      property_media (*)
    `)
    .eq('status', 'published')
    .eq('export_casa_it', true)
    .order('updated_at', { ascending: false })

  if (propertyId) {
    query = query.eq('id', propertyId)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const properties = (data || []).map(normalizeExportProperty)

  const body = {
    provider: 'casa.it',
    generated_at: new Date().toISOString(),
    count: properties.length,
    properties,
  }

  const first = properties[0]
  const fileBase = propertyId && first
    ? `export_${safeFilePart(first.reference_code || first.id)}_casa-it_${todayIt()}.json`
    : `export_feed_casa-it_${todayIt()}.json`

  return new NextResponse(JSON.stringify(body, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'Content-Disposition': `attachment; filename="${fileBase}"`,
    },
  })
}
