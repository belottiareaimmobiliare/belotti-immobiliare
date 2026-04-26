import { NextResponse } from 'next/server'
import { requireAdminProfile } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { normalizeExportProperty } from '@/lib/exports/properties-export'

export const dynamic = 'force-dynamic'

const AGENCY_EMAIL = 'info@areaimmobiliare.com'
const AGENCY_NAME = 'Area Immobiliare'

function escapeXml(value: unknown) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function tag(name: string, value: unknown) {
  const clean = String(value ?? '').trim()
  if (!clean) return ''
  return `<${name}>${escapeXml(clean)}</${name}>`
}

function boolTag(name: string, value: boolean | null | undefined) {
  return `<${name}>${value ? 'true' : 'false'}</${name}>`
}

function mapContractType(value: string | null) {
  if (value === 'affitto') return 'rent'
  return 'sale'
}

function propertyToXml(property: any) {
  const pictures = (property.images || [])
    .map((image: any, index: number) => {
      return `
        <picture>
          ${tag('url', image.url)}
          ${tag('caption', image.label)}
          ${tag('order', image.sort_order ?? index + 1)}
        </picture>`
    })
    .join('')

  return `
    <property operation="write">
      ${tag('unique-id', property.reference_code || property.id)}
      ${tag('reference-code', property.reference_code || property.id)}

      <agent>
        ${tag('office-name', AGENCY_NAME)}
        ${tag('email', AGENCY_EMAIL)}
      </agent>

      <publish>
        <portal id="immobiliare.it" status="true" />
      </publish>

      ${tag('title', property.title)}
      ${tag('description', property.description)}

      <location>
        ${tag('province', property.province)}
        ${tag('city', property.comune)}
        ${tag('locality', property.frazione)}
        ${tag('address', property.address)}
        ${tag('latitude', property.latitude)}
        ${tag('longitude', property.longitude)}
      </location>

      <building>
        ${tag('category', property.property_type)}
        ${tag('typology', property.property_type)}
        ${tag('condition', property.condition)}
        ${tag('floor', property.floor)}
        ${tag('floors', property.total_floors)}
      </building>

      <features>
        ${tag('surface', property.surface)}
        ${tag('rooms', property.rooms)}
        ${tag('bedrooms', property.bedrooms)}
        ${tag('bathrooms', property.bathrooms)}
        ${boolTag('garage', property.has_garage)}
        ${boolTag('parking', property.has_parking)}
        ${boolTag('garden', property.has_garden)}
        ${boolTag('elevator', property.has_elevator)}
        ${tag('energy-class', property.energy_class)}
        ${tag('ipe', property.energy_epgl)}
        ${tag('heating', property.heating_type || property.heating_source)}
        ${tag('furnished', property.furnished_status)}
      </features>

      <transactions>
        <transaction>
          ${tag('type', mapContractType(property.contract_type))}
          <price currency="EUR" reserved="${property.price ? 'false' : 'true'}">${property.price || ''}</price>
          ${tag('condominium-expenses', property.condo_fees_amount)}
        </transaction>
      </transactions>

      <pictures>${pictures}
      </pictures>
    </property>`
}

export async function GET() {
  const profile = await requireAdminProfile()

  if (profile.role !== 'owner' && !profile.can_manage_properties) {
    return NextResponse.json({ error: 'Non autorizzato.' }, { status: 403 })
  }

  const service = createServiceClient()

  const { data, error } = await service
    .from('properties')
    .select(`
      *,
      property_media (*)
    `)
    .eq('status', 'published')
    .eq('export_immobiliare_it', true)
    .order('updated_at', { ascending: false })

  if (error) {
    return NextResponse.json(
      { error: 'Errore generazione export Immobiliare.it.' },
      { status: 500 }
    )
  }

  const properties = (data || []).map(normalizeExportProperty)

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed>
  <properties>
${properties.map(propertyToXml).join('\n')}
  </properties>
</feed>`

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}
