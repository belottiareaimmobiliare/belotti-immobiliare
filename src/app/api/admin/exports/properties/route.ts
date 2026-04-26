import { NextResponse } from 'next/server'
import { requireAdminProfile } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { normalizeExportProperty } from '@/lib/exports/properties-export'

export const dynamic = 'force-dynamic'

export async function GET() {
  const profile = await requireAdminProfile()

  if (
    profile.role !== 'owner' &&
    !profile.can_manage_properties
  ) {
    return NextResponse.json(
      { error: 'Non autorizzato.' },
      { status: 403 }
    )
  }

  const service = createServiceClient()

  const { data, error } = await service
    .from('properties')
    .select(`
      *,
      property_media (*)
    `)
    .eq('status', 'published')
    .order('updated_at', { ascending: false })

  if (error) {
    return NextResponse.json(
      { error: 'Errore generazione export immobili.' },
      { status: 500 }
    )
  }

  const properties = (data || []).map(normalizeExportProperty)

  const immobiliareIt = properties.filter(
    (property) => property.export_targets.immobiliare_it
  )
  const idealista = properties.filter(
    (property) => property.export_targets.idealista
  )
  const casaIt = properties.filter(
    (property) => property.export_targets.casa_it
  )

  return NextResponse.json({
    generated_at: new Date().toISOString(),
    total: properties.length,
    partners: {
      immobiliare_it: {
        folder: '/exports/immobiliare-it',
        status: 'mapping da completare su specifiche ufficiali',
        total: immobiliareIt.length,
      },
      idealista: {
        folder: '/exports/idealista',
        status: 'in attesa formato richiesto dal portale',
        total: idealista.length,
      },
      casa_it: {
        folder: '/exports/casa-it',
        status: 'in attesa formato richiesto dal portale',
        total: casaIt.length,
      },
    },
    properties,
    by_partner: {
      immobiliare_it: immobiliareIt,
      idealista,
      casa_it: casaIt,
    },
  })
}
