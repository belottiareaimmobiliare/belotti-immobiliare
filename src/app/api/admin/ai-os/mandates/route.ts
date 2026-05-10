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

function cleanNumber(value: unknown) {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
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
      .from('property_mandates')
      .select('*')
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('AI-OS mandates GET error:', error)
      return NextResponse.json(
        { error: error.message || 'Errore caricamento incarichi' },
        { status: 500 },
      )
    }

    return NextResponse.json({ mandates: data ?? [] })
  } catch (error) {
    console.error('AI-OS mandates GET exception:', error)
    return NextResponse.json(
      { error: jsonError(error, 'Errore caricamento incarichi') },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json().catch(() => null)

    const propertyId = String(body?.propertyId || '')
    const ownerName = cleanText(body?.ownerName)

    if (!propertyId) {
      return NextResponse.json({ error: 'ID immobile mancante' }, { status: 400 })
    }

    if (!ownerName) {
      return NextResponse.json({ error: 'Nome proprietario obbligatorio' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('property_mandates')
      .insert({
        property_id: propertyId,
        owner_name: ownerName,
        mandate_type: cleanText(body?.mandateType) || 'sale',
        assignment_type: cleanText(body?.assignmentType) || 'exclusive',
        status: cleanText(body?.status) || 'draft',
        start_date: cleanText(body?.startDate),
        end_date: cleanText(body?.endDate),
        asking_price: cleanNumber(body?.askingPrice),
        commission_rate: cleanNumber(body?.commissionRate),
        flat_fee: cleanNumber(body?.flatFee),
        notes: cleanText(body?.notes),
      })
      .select('*')
      .single()

    if (error) {
      console.error('AI-OS mandates POST error:', error)
      return NextResponse.json(
        { error: error.message || 'Errore creazione incarico' },
        { status: 500 },
      )
    }

    return NextResponse.json({ mandate: data })
  } catch (error) {
    console.error('AI-OS mandates POST exception:', error)
    return NextResponse.json(
      { error: jsonError(error, 'Errore creazione incarico') },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json().catch(() => null)

    const mandateId = String(body?.mandateId || '')
    const propertyId = String(body?.propertyId || '')
    const ownerName = cleanText(body?.ownerName)

    if (!mandateId) {
      return NextResponse.json({ error: 'ID incarico mancante' }, { status: 400 })
    }

    if (!propertyId) {
      return NextResponse.json({ error: 'ID immobile mancante' }, { status: 400 })
    }

    if (!ownerName) {
      return NextResponse.json({ error: 'Nome proprietario obbligatorio' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('property_mandates')
      .update({
        owner_name: ownerName,
        mandate_type: cleanText(body?.mandateType) || 'sale',
        assignment_type: cleanText(body?.assignmentType) || 'exclusive',
        status: cleanText(body?.status) || 'draft',
        start_date: cleanText(body?.startDate),
        end_date: cleanText(body?.endDate),
        asking_price: cleanNumber(body?.askingPrice),
        commission_rate: cleanNumber(body?.commissionRate),
        flat_fee: cleanNumber(body?.flatFee),
        notes: cleanText(body?.notes),
      })
      .eq('id', mandateId)
      .eq('property_id', propertyId)
      .select('*')
      .single()

    if (error) {
      console.error('AI-OS mandates PATCH error:', error)
      return NextResponse.json(
        { error: error.message || 'Errore aggiornamento incarico' },
        { status: 500 },
      )
    }

    return NextResponse.json({ mandate: data })
  } catch (error) {
    console.error('AI-OS mandates PATCH exception:', error)
    return NextResponse.json(
      { error: jsonError(error, 'Errore aggiornamento incarico') },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json().catch(() => null)

    const mandateId = String(body?.mandateId || '')
    const propertyId = String(body?.propertyId || '')

    if (!mandateId) {
      return NextResponse.json({ error: 'ID incarico mancante' }, { status: 400 })
    }

    if (!propertyId) {
      return NextResponse.json({ error: 'ID immobile mancante' }, { status: 400 })
    }

    const { error } = await supabase
      .from('property_mandates')
      .delete()
      .eq('id', mandateId)
      .eq('property_id', propertyId)

    if (error) {
      console.error('AI-OS mandates DELETE error:', error)
      return NextResponse.json(
        { error: error.message || 'Errore eliminazione incarico' },
        { status: 500 },
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('AI-OS mandates DELETE exception:', error)
    return NextResponse.json(
      { error: jsonError(error, 'Errore eliminazione incarico') },
      { status: 500 },
    )
  }
}
