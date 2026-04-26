import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdminProfile } from '@/lib/admin-auth'

export async function GET() {
  await requireAdminProfile()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('status', 'published')
    .eq('export_idealista', true)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const result = (data || []).map(p => ({
    id: p.id,
    titolo: p.title,
    prezzo: p.price,
    mq: p.surface,
    comune: p.comune,
    provincia: p.province,
    contratto: p.contract_type,
    tipo: p.property_type,
    descrizione: p.description,
    lat: p.latitude,
    lng: p.longitude
  }))

  return NextResponse.json({
    provider: "idealista",
    count: result.length,
    properties: result
  })
}
