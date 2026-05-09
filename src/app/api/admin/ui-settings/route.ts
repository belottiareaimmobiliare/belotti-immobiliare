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

const ALLOWED_ROLES = new Set(['owner', 'secretary', 'agent', 'editor'])

function normalizeHiddenSections(value: unknown) {
  if (!Array.isArray(value)) return []

  return value
    .map((item) => String(item || '').trim())
    .filter((item) => ALLOWED_SECTION_IDS.has(item))
}

function normalizeHiddenSectionsByRole(value: unknown) {
  const result: Record<string, string[]> = {
    owner: [],
    secretary: [],
    agent: [],
    editor: [],
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return result
  }

  for (const [role, sections] of Object.entries(value as Record<string, unknown>)) {
    if (!ALLOWED_ROLES.has(role)) continue
    result[role] = normalizeHiddenSections(sections)
  }

  return result
}

export async function GET() {
  const profile = await requireAdminProfile()
  const service = createServiceClient()

  const { data, error } = await service
    .from('admin_ui_settings')
    .select('hidden_sections, hidden_sections_by_role')
    .eq('key', SETTINGS_KEY)
    .maybeSingle()

  if (error) {
    console.error('Errore lettura admin_ui_settings:', error)

    return NextResponse.json({
      hiddenSections: [],
      hiddenSectionsByRole: {
        owner: [],
        secretary: [],
        agent: [],
        editor: [],
      },
    })
  }

  const hiddenSectionsByRole = normalizeHiddenSectionsByRole(
    data?.hidden_sections_by_role,
  )

  const role = String(profile.role)

  return NextResponse.json({
    hiddenSections:
      role === 'administrator'
        ? []
        : hiddenSectionsByRole[role] || normalizeHiddenSections(data?.hidden_sections),
    hiddenSectionsByRole,
  })
}

export async function POST(request: Request) {
  const profile = await requireAdminProfile()

  if (String(profile.role) !== 'administrator') {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const hiddenSectionsByRole = normalizeHiddenSectionsByRole(
    body?.hiddenSectionsByRole,
  )

  const service = createServiceClient()

  const { error } = await service.from('admin_ui_settings').upsert({
    key: SETTINGS_KEY,
    hidden_sections: [],
    hidden_sections_by_role: hiddenSectionsByRole,
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
    hiddenSectionsByRole,
  })
}
