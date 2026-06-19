import { NextResponse } from 'next/server'
import { requireAdminProfile } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { canUseAIOS, jsonError } from '@/lib/ai-os'

export const dynamic = 'force-dynamic'

function cleanText(value: unknown) {
  const cleaned = String(value ?? '').trim()
  return cleaned.length > 0 ? cleaned : null
}

function slugify(value: unknown) {
  const cleaned = String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)

  return cleaned || `check-${Date.now()}`
}

async function requireAIOS() {
  const profile = await requireAdminProfile()

  if (!canUseAIOS(profile)) {
    throw new Error('Non autorizzato')
  }

  return profile
}

export async function GET() {
  try {
    await requireAIOS()
    const supabase = createServiceClient()

    const [{ data: sections, error: sectionsError }, { data: items, error: itemsError }] =
      await Promise.all([
        supabase
          .from('ai_os_check_sections')
          .select('*')
          .order('sort_order', { ascending: true })
          .order('title', { ascending: true }),

        supabase
          .from('ai_os_check_items')
          .select('*')
          .order('section_key', { ascending: true })
          .order('sort_order', { ascending: true })
          .order('item_label', { ascending: true }),
      ])

    if (sectionsError) {
      return NextResponse.json({ error: sectionsError.message }, { status: 500 })
    }

    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 500 })
    }

    return NextResponse.json({
      sections: sections ?? [],
      items: items ?? [],
    })
  } catch (error) {
    return NextResponse.json(
      { error: jsonError(error, 'Errore caricamento configurazione check') },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    await requireAIOS()
    const supabase = createServiceClient()
    const body = await request.json().catch(() => null)

    const sectionKey = cleanText(body?.sectionKey)
    const itemLabel = cleanText(body?.itemLabel)
    const groupLabel = cleanText(body?.groupLabel)
    const itemKey = slugify(body?.itemKey || itemLabel)

    if (!sectionKey) {
      return NextResponse.json({ error: 'Sezione mancante' }, { status: 400 })
    }

    if (!itemLabel) {
      return NextResponse.json({ error: 'Nome check mancante' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('ai_os_check_items')
      .insert({
        section_key: sectionKey,
        item_key: itemKey,
        item_label: itemLabel,
        group_label: groupLabel,
        is_required: body?.isRequired === true,
        sort_order: Number(body?.sortOrder ?? 999),
        is_active: body?.isActive !== false,
      })
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ item: data })
  } catch (error) {
    return NextResponse.json(
      { error: jsonError(error, 'Errore creazione check') },
      { status: 500 },
    )
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAIOS()
    const supabase = createServiceClient()
    const body = await request.json().catch(() => null)

    const id = cleanText(body?.id)
    const itemLabel = cleanText(body?.itemLabel)

    if (!id) {
      return NextResponse.json({ error: 'ID check mancante' }, { status: 400 })
    }

    if (!itemLabel) {
      return NextResponse.json({ error: 'Nome check mancante' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('ai_os_check_items')
      .update({
        item_label: itemLabel,
        group_label: cleanText(body?.groupLabel),
        is_required: body?.isRequired === true,
        is_active: body?.isActive === true,
        sort_order: Number(body?.sortOrder ?? 0),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ item: data })
  } catch (error) {
    return NextResponse.json(
      { error: jsonError(error, 'Errore aggiornamento check') },
      { status: 500 },
    )
  }
}
