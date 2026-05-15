import fs from 'node:fs'
import path from 'node:path'

const ACTIVE_IMPORT_FILE = path.join(
  process.cwd(),
  'data',
  'imports',
  'areaimmobiliare-active-import.json',
)

const OUT_FILE = path.join(
  process.cwd(),
  'data',
  'imports',
  'areaimmobiliare-active-strict-import.json',
)

const MIN_TIMESTAMP = '20260101000000'

const allowedSourceFragments = [
  '/property-status/vendita/',
  '/property-status/affitto/',
  '/property-city/bergamo/',
]

function hasStrictRecentSource(property) {
  const sources = Array.isArray(property.active_candidate_sources)
    ? property.active_candidate_sources
    : []

  return sources.some((source) => {
    const page = String(source.page || '')
    const timestamp = String(source.timestamp || '')

    return (
      timestamp >= MIN_TIMESTAMP &&
      allowedSourceFragments.some((fragment) => page.includes(fragment))
    )
  })
}

function sourceLabel(property) {
  const sources = Array.isArray(property.active_candidate_sources)
    ? property.active_candidate_sources
    : []

  return sources
    .filter((source) => String(source.timestamp || '') >= MIN_TIMESTAMP)
    .map((source) => `${source.timestamp} ${source.page}`)
    .join(' | ')
}

const input = JSON.parse(fs.readFileSync(ACTIVE_IMPORT_FILE, 'utf8'))

const strictProperties = input.properties.filter(hasStrictRecentSource)

const result = {
  prepared_at: new Date().toISOString(),
  source: 'wayback_active_listing_candidates_strict_2026',
  summary: {
    original_active_candidates: input.properties.length,
    strict_active_properties: strictProperties.length,
    total_images: strictProperties.reduce((sum, property) => sum + property.image_count, 0),
    min_timestamp: MIN_TIMESTAMP,
    allowed_sources: allowedSourceFragments,
  },
  properties: strictProperties,
}

fs.writeFileSync(OUT_FILE, JSON.stringify(result, null, 2) + '\n')

console.log('')
console.log('=== ACTIVE STRICT IMPORT PREPARATO ===')
console.log(result.summary)

console.log('')
console.log('=== LISTA STRICT ===')
for (const property of strictProperties) {
  console.log(`- ${property.title} | €${property.price} | immagini ${property.image_count}`)
  console.log(`  ${property.old_source_url}`)
  console.log(`  fonti: ${sourceLabel(property)}`)
}

console.log('')
console.log(`File strict: ${OUT_FILE}`)
console.log('')
