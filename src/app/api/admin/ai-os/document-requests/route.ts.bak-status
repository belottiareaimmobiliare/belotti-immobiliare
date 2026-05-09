import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const REQUEST_TYPE_LABELS: Record<string, string> = {
  cadastral_property: 'Visura catastale immobile',
  cadastral_subject: 'Visura catastale soggetto',
  chamber_company: 'Visura camerale società',
  mortgage: 'Visura ipotecaria / ipocatastale',
  cadastral_plan: 'Planimetria catastale',
  floor_plan_elaboration: 'Elaborato planimetrico',
}

function jsonError(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message || fallback
  if (typeof error === 'string') return error || fallback
  return fallback
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
      .from('property_document_requests')
      .select('*')
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('AI-OS document requests GET error:', error)
      return NextResponse.json(
        { error: error.message || 'Errore caricamento richieste documenti' },
        { status: 500 },
      )
    }

    return NextResponse.json({ requests: data ?? [] })
  } catch (error) {
    console.error('AI-OS document requests GET exception:', error)
    return NextResponse.json(
      { error: jsonError(error, 'Errore caricamento richieste documenti') },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json().catch(() => null)

    const propertyId = String(body?.propertyId || '')
    const requestType = String(body?.requestType || '')
    const notes = typeof body?.notes === 'string' ? body.notes : null

    if (!propertyId) {
      return NextResponse.json({ error: 'ID immobile mancante' }, { status: 400 })
    }

    if (!requestType || !REQUEST_TYPE_LABELS[requestType]) {
      return NextResponse.json({ error: 'Tipo documento non valido' }, { status: 400 })
    }

    const { data: userData } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('property_document_requests')
      .insert({
        property_id: propertyId,
        request_type: requestType,
        title: REQUEST_TYPE_LABELS[requestType],
        status: 'todo',
        notes,
        requested_by: userData?.user?.id ?? null,
      })
      .select('*')
      .single()

    if (error) {
      console.error('AI-OS document requests POST error:', error)
      return NextResponse.json(
        { error: error.message || 'Errore creazione richiesta documento' },
        { status: 500 },
      )
    }

    return NextResponse.json({ request: data })
  } catch (error) {
    console.error('AI-OS document requests POST exception:', error)
    return NextResponse.json(
      { error: jsonError(error, 'Errore creazione richiesta documento') },
      { status: 500 },
    )
  }
}
