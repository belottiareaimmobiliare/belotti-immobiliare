import { NextResponse } from 'next/server'
import { requireAdminProfile } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { normalizeExportProperty } from '@/lib/exports/properties-export'

export const dynamic = 'force-dynamic'

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

function propertyToXml(property: any) {
  const imageXml = (property.images || [])
    .map((image: any, index: number) => {
      return `
        <image>
          ${tag('url', image.url)}
          ${tag('caption', image.label)}
          ${tag('order', image.sort_order ?? index + 1)}
          ${boolTag('cover', Boolean(image.is_cover))}
        </image>`
    })
    .join('')

  const planXml = (property.plans || [])
    .map((plan: any, index: number) => {
      return `
        <plan>
          ${tag('url', plan.url)}
          ${tag('caption', plan.label)}
          ${tag('order', plan.sort_order ?? index + 1)}
        </plan>`
    })
    .join('')

  return `
    <property>
      ${tag('unique-id', property.reference_code || property.id)}
      ${tag('management-id', property.id)}
      ${tag('title', property.title)}
      ${tag('description', property.description)}
      ${tag('contract-type', property.contract_type)}
      ${tag('property-type', property.property_type)}
      ${tag('condition', property.condition)}
      ${tag('availability', property.availability)}
      ${tag('price', property.price)}
      ${tag('surface', property.surface)}
      ${tag('rooms', property.rooms)}
      ${tag('bedrooms', property.bedrooms)}
      ${tag('bathrooms', property.bathrooms)}
      ${tag('floor', property.floor)}
      ${tag('total-floors', property.total_floors)}
      ${tag('energy-class', property.energy_class)}
      ${tag('energy-epgl', property.energy_epgl)}
      ${tag('heating-type', property.heating_type)}
      ${tag('heating-source', property.heating_source)}
      ${tag('furnished-status', property.furnished_status)}
      ${tag('condo-fees-amount', property.condo_fees_amount)}
      ${tag('condo-fees-period', property.condo_fees_period)}
      ${tag('condo-fees-note', property.condo_fees_note)}

      <location>
        ${tag('province', property.province)}
        ${tag('city', property.comune)}
        ${tag('area', property.frazione)}
        ${tag('address', property.address)}
        ${tag('latitude', property.latitude)}
        ${tag('longitude', property.longitude)}
      </location>

      <features>
        ${boolTag('garage', property.has_garage)}
        ${boolTag('parking', property.has_parking)}
        ${boolTag('garden', property.has_garden)}
        ${boolTag('elevator', property.has_elevator)}
        ${boolTag('auction', property.is_auction)}
      </features>

      <media>
        <images>${imageXml}
        </images>
        <plans>${planXml}
        </plans>
      </media>
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
  <source>Belotti Immobiliare</source>
  <generated-at>${new Date().toISOString()}</generated-at>
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
