import fs from 'node:fs'
import path from 'node:path'

const SOURCE_FILE = path.join(
  process.cwd(),
  'data',
  'imports',
  'areaimmobiliare-wayback-properties.json',
)

const OUT_FILE = path.join(
  process.cwd(),
  'data',
  'imports',
  'areaimmobiliare-clean-import.json',
)

function cleanText(value) {
  return String(value || '')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t\r\n]+/g, ' ')
    .replace(/\s+([.,;:!?])/g, '$1')
    .trim()
}

function slugify(value) {
  return cleanText(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90)
}

function inferContractTypeSafe(property) {
  const title = cleanText(property.title).toLowerCase()
  const url = cleanText(property.old_source_url).toLowerCase()

  // Priorità al titolo: è più affidabile dello slug storico.
  if (
    title.includes('vendesi') ||
    title.includes('vendita') ||
    title.includes('in vendita')
  ) {
    return 'vendita'
  }

  if (
    title.includes('affitto') ||
    title.includes('affittasi') ||
    title.includes('in affitto')
  ) {
    return 'affitto'
  }

  if (
    url.includes('vendesi') ||
    url.includes('vendita')
  ) {
    return 'vendita'
  }

  if (
    url.includes('affitto') ||
    url.includes('affittasi')
  ) {
    return 'affitto'
  }

  return null
}

function inferPropertyTypeSafe(property) {
  const title = cleanText(property.title).toLowerCase()
  const url = cleanText(property.old_source_url).toLowerCase()
  const haystack = `${title} ${url}`

  if (haystack.includes('ufficio')) return 'ufficio'
  if (haystack.includes('negozio')) return 'negozio'
  if (haystack.includes('box')) return 'box'
  if (haystack.includes('garage')) return 'box'

  // Prima taglio dell'immobile, poi contesto tipo "in villa".
  if (haystack.includes('monolocale')) return 'monolocale'
  if (haystack.includes('bilocale')) return 'bilocale'
  if (haystack.includes('trilocale')) return 'trilocale'
  if (haystack.includes('quadrilocale')) return 'quadrilocale'
  if (haystack.includes('pentalocale')) return 'pentalocale'

  if (haystack.includes('attico')) return 'attico'
  if (haystack.includes('appartamento')) return 'appartamento'
  if (haystack.includes('villetta')) return 'villa'
  if (haystack.includes('villa')) return 'villa'
  if (haystack.includes('rustico')) return 'rustico'
  if (haystack.includes('casale')) return 'rustico'
  if (haystack.includes('terreno')) return 'terreno'
  if (haystack.includes('area edificabile')) return 'terreno'
  if (haystack.includes('palazzo')) return 'palazzo'
  if (haystack.includes('magazzino')) return 'magazzino'

  return null
}

function isBadTitle(title) {
  const normalized = cleanText(title).toLowerCase()
  return !normalized || normalized === 'home'
}

const source = JSON.parse(fs.readFileSync(SOURCE_FILE, 'utf8'))

const cleaned = source.properties
  .filter((property) => !isBadTitle(property.title))
  .map((property, index) => {
    const title = cleanText(property.title)
    const baseSlug = slugify(title || `immobile-importato-${index + 1}`)

    return {
      source_tag: 'old_site_import',
      import_source: 'wayback',
      is_demo: false,
      needs_review: true,
      status: 'draft',

      old_source_url: property.old_source_url,
      wayback_url: property.wayback_url,
      wayback_timestamp: property.wayback_timestamp,

      title,
      slug: baseSlug,
      price: property.price || null,
      price_text: cleanText(property.price_text),

      contract_type: inferContractTypeSafe(property),
      property_type: inferPropertyTypeSafe(property),

      // Questi li lasciamo volutamente null perché lo scan grezzo prendeva numeri sporchi dal layout.
      surface: null,
      rooms: null,
      bathrooms: null,
      garages: null,

      description_text: cleanText(property.description_text),
      description_html: property.description_html || '',

      has_garage: Boolean(property.has_garage),
      has_garden: Boolean(property.has_garden),
      has_elevator: Boolean(property.has_elevator),
      has_parking: Boolean(property.has_parking),

      images: Array.isArray(property.images) ? property.images : [],
      image_count: Array.isArray(property.images) ? property.images.length : 0,

      original_scan: {
        surface: property.surface,
        rooms: property.rooms,
        bathrooms: property.bathrooms,
        garages: property.garages,
        contract_type: property.contract_type,
        property_type: property.property_type,
        features_detected: property.features_detected || [],
      },
    }
  })

const summary = {
  source_properties: source.properties.length,
  clean_properties: cleaned.length,
  skipped_bad_title: source.properties.length - cleaned.length,
  with_price: cleaned.filter((p) => p.price).length,
  with_contract_type: cleaned.filter((p) => p.contract_type).length,
  with_property_type: cleaned.filter((p) => p.property_type).length,
  with_images: cleaned.filter((p) => p.image_count > 0).length,
  total_images: cleaned.reduce((sum, p) => sum + p.image_count, 0),
}

const result = {
  prepared_at: new Date().toISOString(),
  summary,
  properties: cleaned,
}

fs.writeFileSync(OUT_FILE, JSON.stringify(result, null, 2) + '\n')

console.log('')
console.log('=== CLEAN IMPORT PREPARATO ===')
console.log(summary)
console.log('')
console.log(`File: ${OUT_FILE}`)
console.log('')

console.log('=== PRIME 10 SCHEDE PULITE ===')
for (const property of cleaned.slice(0, 10)) {
  console.log({
    title: property.title,
    price: property.price,
    contract_type: property.contract_type,
    property_type: property.property_type,
    surface: property.surface,
    rooms: property.rooms,
    bathrooms: property.bathrooms,
    images: property.image_count,
    old_source_url: property.old_source_url,
  })
}
