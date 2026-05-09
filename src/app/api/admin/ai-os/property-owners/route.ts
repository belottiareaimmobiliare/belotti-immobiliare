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

function cleanBoolean(value: unknown) {
  return value === true
}

async function unsetOtherPrimaryOwners(propertyId: string, ownerId?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('property_owners')
    .update({ is_primary: false })
    .eq('property_id', propertyId)

  if (ownerId) {
    query = query.neq('id', ownerId)
  }

  const { error } = await query

  if (error) {
    throw new Error(error.message || 'Errore aggiornamento proprietario principale')
  }
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
      .from('property_owners')
      .select('*')
      .eq('property_id', propertyId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true })

    if (error) {
      console.error('AI-OS property owners GET error:', error)
      return NextResponse.json(
        { error: error.message || 'Errore caricamento proprietari' },
        { status: 500 },
      )
    }

    return NextResponse.json({ owners: data ?? [] })
  } catch (error) {
    console.error('AI-OS property owners GET exception:', error)
    return NextResponse.json(
      { error: jsonError(error, 'Errore caricamento proprietari') },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json().catch(() => null)

    const propertyId = String(body?.propertyId || '')
    const fullName = cleanText(body?.fullName)
    const isPrimary = cleanBoolean(body?.isPrimary)

    if (!propertyId) {
      return NextResponse.json({ error: 'ID immobile mancante' }, { status: 400 })
    }

    if (!fullName) {
      return NextResponse.json({ error: 'Nome proprietario obbligatorio' }, { status: 400 })
    }

    if (isPrimary) {
      await unsetOtherPrimaryOwners(propertyId)
    }

    const { data, error } = await supabase
      .from('property_owners')
      .insert({
        property_id: propertyId,
        owner_type: cleanText(body?.ownerType) || 'person',
        role: cleanText(body?.role) || 'owner',
        full_name: fullName,
        email: cleanText(body?.email),
        phone: cleanText(body?.phone),
        tax_code: cleanText(body?.taxCode),
        vat_number: cleanText(body?.vatNumber),
        address: cleanText(body?.address),
        city: cleanText(body?.city),
        province: cleanText(body?.province),
        notes: cleanText(body?.notes),
        is_primary: isPrimary,
      })
      .select('*')
      .single()

    if (error) {
      console.error('AI-OS property owners POST error:', error)
      return NextResponse.json(
        { error: error.message || 'Errore creazione proprietario' },
        { status: 500 },
      )
    }

    return NextResponse.json({ owner: data })
  } catch (error) {
    console.error('AI-OS property owners POST exception:', error)
    return NextResponse.json(
      { error: jsonError(error, 'Errore creazione proprietario') },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json().catch(() => null)

    const ownerId = String(body?.ownerId || '')
    const propertyId = String(body?.propertyId || '')
    const fullName = cleanText(body?.fullName)
    const isPrimary = cleanBoolean(body?.isPrimary)

    if (!ownerId) {
      return NextResponse.json({ error: 'ID proprietario mancante' }, { status: 400 })
    }

    if (!propertyId) {
      return NextResponse.json({ error: 'ID immobile mancante' }, { status: 400 })
    }

    if (!fullName) {
      return NextResponse.json({ error: 'Nome proprietario obbligatorio' }, { status: 400 })
    }

    if (isPrimary) {
      await unsetOtherPrimaryOwners(propertyId, ownerId)
    }

    const { data, error } = await supabase
      .from('property_owners')
      .update({
        owner_type: cleanText(body?.ownerType) || 'person',
        role: cleanText(body?.role) || 'owner',
        full_name: fullName,
        email: cleanText(body?.email),
        phone: cleanText(body?.phone),
        tax_code: cleanText(body?.taxCode),
        vat_number: cleanText(body?.vatNumber),
        address: cleanText(body?.address),
        city: cleanText(body?.city),
        province: cleanText(body?.province),
        notes: cleanText(body?.notes),
        is_primary: isPrimary,
      })
      .eq('id', ownerId)
      .eq('property_id', propertyId)
      .select('*')
      .single()

    if (error) {
      console.error('AI-OS property owners PATCH error:', error)
      return NextResponse.json(
        { error: error.message || 'Errore aggiornamento proprietario' },
        { status: 500 },
      )
    }

    return NextResponse.json({ owner: data })
  } catch (error) {
    console.error('AI-OS property owners PATCH exception:', error)
    return NextResponse.json(
      { error: jsonError(error, 'Errore aggiornamento proprietario') },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json().catch(() => null)

    const ownerId = String(body?.ownerId || '')
    const propertyId = String(body?.propertyId || '')

    if (!ownerId) {
      return NextResponse.json({ error: 'ID proprietario mancante' }, { status: 400 })
    }

    if (!propertyId) {
      return NextResponse.json({ error: 'ID immobile mancante' }, { status: 400 })
    }

    const { error } = await supabase
      .from('property_owners')
      .delete()
      .eq('id', ownerId)
      .eq('property_id', propertyId)

    if (error) {
      console.error('AI-OS property owners DELETE error:', error)
      return NextResponse.json(
        { error: error.message || 'Errore eliminazione proprietario' },
        { status: 500 },
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('AI-OS property owners DELETE exception:', error)
    return NextResponse.json(
      { error: jsonError(error, 'Errore eliminazione proprietario') },
      { status: 500 },
    )
  }
}
