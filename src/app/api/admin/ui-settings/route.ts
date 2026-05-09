import { NextResponse } from 'next/server'
import { requireAdminProfile } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'

const SETTINGS_KEY = 'global'

const ALLOWED_SECTION_IDS = new Set([
  'dashboard',
  'immobili',
  'news',
  'autori',
  'leads',
  'ricerche-salvate',
  'contenuti',
  'utenti',
  'kpi',
  'exports',
  'logs',
  'privacy',
])

function normalizeHiddenSections(value: unknown) {
  if (!Array.isArray(value)) return []

  return value
    .map((item) => String(item || '').trim())
    .filter((item) => ALLOWED_SECTION_IDS.has(item))
}

export async function GET() {
  await requireAdminProfile()

  const service = createServiceClient()

  const { data, error } = await service
    .from('admin_ui_settings')
    .select('hidden_sections')
    .eq('key', SETTINGS_KEY)
    .maybeSingle()

  if (error) {
    console.error('Errore lettura admin_ui_settings:', error)

    return NextResponse.json({
      hiddenSections: [],
    })
  }

  return NextResponse.json({
    hiddenSections: Array.isArray(data?.hidden_sections)
      ? data.hidden_sections
      : [],
  })
}

export async function POST(request: Request) {
  const profile = await requireAdminProfile()

  if (String(profile.role) !== 'administrator') {
    return NextResponse.json(
      { error: 'Non autorizzato' },
      { status: 403 },
    )
  }

  const body = await request.json().catch(() => null)
  const hiddenSections = normalizeHiddenSections(body?.hiddenSections)

  const service = createServiceClient()

  const { error } = await service
    .from('admin_ui_settings')
    .upsert({
      key: SETTINGS_KEY,
      hidden_sections: hiddenSections,
      updated_at: new Date().toISOString(),
      updated_by: profile.id,
    })

  if (error) {
    console.error('Errore salvataggio admin_ui_settings:', error)

    return NextResponse.json(
      { error: error.message || 'Errore salvataggio impostazioni admin' },
      { status: 500 },
    )
  }

  return NextResponse.json({
    ok: true,
    hiddenSections,
  })
}
