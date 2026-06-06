import { NextResponse } from 'next/server'
import { getCurrentAdminProfile } from '@/lib/admin-auth'
import { createClient } from '@/lib/supabase/server'

const allowedSectionKeys = new Set([
  'property-edit',
  'drive-share',
  'lead-note',
  'social-card',
  'documents',
  'fillable-modules',
  'agency-practices',
  'visure',
])

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 })
}

export async function GET(request: Request) {
  const profile = await getCurrentAdminProfile()

  if (!profile || !profile.is_active) {
    return NextResponse.json({ error: 'Non autorizzato.' }, { status: 401 })
  }

  const url = new URL(request.url)
  const propertyId = url.searchParams.get('propertyId')?.trim()

  if (!propertyId) {
    return badRequest('propertyId mancante.')
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('ai_os_operational_checks')
    .select('section_key, is_ok, checked_by, checked_at, notes, updated_at')
    .eq('property_id', propertyId)
    .order('section_key', { ascending: true })

  if (error) {
    console.error('Errore lettura check operativi AI-OS:', error)
    return NextResponse.json({ error: 'Errore lettura check operativi.' }, { status: 500 })
  }

  return NextResponse.json({ checks: data ?? [] })
}

export async function POST(request: Request) {
  const profile = await getCurrentAdminProfile()

  if (!profile || !profile.is_active) {
    return NextResponse.json({ error: 'Non autorizzato.' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)

  const propertyId = String(body?.propertyId ?? '').trim()
  const sectionKey = String(body?.sectionKey ?? '').trim()
  const isOk = body?.isOk === true

  if (!propertyId) {
    return badRequest('propertyId mancante.')
  }

  if (!allowedSectionKeys.has(sectionKey)) {
    return badRequest('Sezione operativa non valida.')
  }

  const supabase = await createClient()
  const now = new Date().toISOString()
  const checkedBy = profile.full_name || profile.username || 'Admin'

  const { data, error } = await supabase
    .from('ai_os_operational_checks')
    .upsert(
      {
        property_id: propertyId,
        section_key: sectionKey,
        is_ok: isOk,
        checked_by: isOk ? checkedBy : null,
        checked_at: isOk ? now : null,
        updated_at: now,
      },
      {
        onConflict: 'property_id,section_key',
      }
    )
    .select('section_key, is_ok, checked_by, checked_at, notes, updated_at')
    .single()

  if (error) {
    console.error('Errore salvataggio check operativo AI-OS:', error)
    return NextResponse.json({ error: 'Errore salvataggio check operativo.' }, { status: 500 })
  }

  return NextResponse.json({ check: data })
}
