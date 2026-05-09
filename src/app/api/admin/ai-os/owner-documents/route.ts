import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ALLOWED_STATUSES = ['missing', 'received', 'verified', 'not_needed']

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
      .from('property_owner_documents')
      .select('*')
      .eq('property_id', propertyId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('AI-OS owner documents GET error:', error)
      return NextResponse.json(
        { error: error.message || 'Errore caricamento documenti proprietario' },
        { status: 500 },
      )
    }

    return NextResponse.json({ documents: data ?? [] })
  } catch (error) {
    console.error('AI-OS owner documents GET exception:', error)
    return NextResponse.json(
      { error: jsonError(error, 'Errore caricamento documenti proprietario') },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json().catch(() => null)

    const propertyId = String(body?.propertyId || '')
    const documentKey = String(body?.documentKey || '')
    const label = cleanText(body?.label)
    const status = String(body?.status || '')
    const notes = cleanText(body?.notes)

    if (!propertyId) {
      return NextResponse.json({ error: 'ID immobile mancante' }, { status: 400 })
    }

    if (!documentKey) {
      return NextResponse.json({ error: 'Chiave documento mancante' }, { status: 400 })
    }

    if (!label) {
      return NextResponse.json({ error: 'Etichetta documento mancante' }, { status: 400 })
    }

    if (!ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Stato documento non valido' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('property_owner_documents')
      .upsert(
        {
          property_id: propertyId,
          document_key: documentKey,
          label,
          status,
          notes,
        },
        {
          onConflict: 'property_id,document_key',
        },
      )
      .select('*')
      .single()

    if (error) {
      console.error('AI-OS owner documents PATCH error:', error)
      return NextResponse.json(
        { error: error.message || 'Errore aggiornamento documento proprietario' },
        { status: 500 },
      )
    }

    return NextResponse.json({ document: data })
  } catch (error) {
    console.error('AI-OS owner documents PATCH exception:', error)
    return NextResponse.json(
      { error: jsonError(error, 'Errore aggiornamento documento proprietario') },
      { status: 500 },
    )
  }
}
