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
    .eq('export_casa_it', true)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const result = (data || []).map(p => ({
    codice: p.id,
    titolo: p.title,
    prezzo: p.price,
    superficie: p.surface,
    localita: p.comune,
    provincia: p.province,
    tipologia: p.property_type,
    contratto: p.contract_type,
    descrizione: p.description
  }))

  return NextResponse.json({
    provider: "casa.it",
    count: result.length,
    properties: result
  })
}
