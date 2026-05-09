import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function jsonError(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message || fallback
  if (typeof error === 'string') return error || fallback
  return fallback
}

function cleanText(value: unknown) {
  if (typeof value !== 'string') return null
  const cleaned = value.trim()
  return cleaned.length > 0 ? cleaned : null
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')

    if (!propertyId) {
      return NextResponse.json({ error: 'ID immobile mancante' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('property_checklist_items')
      .select('*')
      .eq('property_id', propertyId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('AI-OS checklist GET error:', error)
      return NextResponse.json(
        { error: error.message || 'Errore caricamento checklist' },
        { status: 500 },
      )
    }

    return NextResponse.json({ items: data ?? [] })
  } catch (error) {
    console.error('AI-OS checklist GET exception:', error)
    return NextResponse.json(
      { error: jsonError(error, 'Errore caricamento checklist') },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json().catch(() => null)

    const propertyId = String(body?.propertyId || '')
    const itemKey = String(body?.itemKey || '')
    const label = cleanText(body?.label)
    const notes = cleanText(body?.notes)
    const isDone = body?.isDone === true

    if (!propertyId) {
      return NextResponse.json({ error: 'ID immobile mancante' }, { status: 400 })
    }

    if (!itemKey) {
      return NextResponse.json({ error: 'Chiave checklist mancante' }, { status: 400 })
    }

    if (!label) {
      return NextResponse.json({ error: 'Etichetta checklist mancante' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('property_checklist_items')
      .upsert(
        {
          property_id: propertyId,
          item_key: itemKey,
          label,
          is_done: isDone,
          notes,
        },
        {
          onConflict: 'property_id,item_key',
        },
      )
      .select('*')
      .single()

    if (error) {
      console.error('AI-OS checklist PATCH error:', error)
      return NextResponse.json(
        { error: error.message || 'Errore aggiornamento checklist' },
        { status: 500 },
      )
    }

    return NextResponse.json({ item: data })
  } catch (error) {
    console.error('AI-OS checklist PATCH exception:', error)
    return NextResponse.json(
      { error: jsonError(error, 'Errore aggiornamento checklist') },
      { status: 500 },
    )
  }
}
