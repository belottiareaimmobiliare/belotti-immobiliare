import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import * as cheerio from 'cheerio'

const args = Object.fromEntries(
  process.argv
    .slice(2)
    .filter((arg) => arg.startsWith('--'))
    .map((arg) => {
      const [key, ...valueParts] = arg.replace(/^--/, '').split('=')
      return [key, valueParts.join('=') || 'true']
    }),
)

const MAX_PROPERTIES = Number(args['max-properties'] || 0)
const DELAY_MS = Number(args['delay-ms'] || 700)

const OUT_DIR = path.join(process.cwd(), 'data', 'imports')
const OUT_JSON = path.join(OUT_DIR, 'areaimmobiliare-wayback-properties.json')
const OUT_CSV = path.join(OUT_DIR, 'areaimmobiliare-wayback-properties.csv')

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/147 Safari/537.36'

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function uniq(items) {
  return [...new Set(items.filter(Boolean))]
}

function cleanText(value) {
  return String(value || '')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t\r\n]+/g, ' ')
    .replace(/\s+([.,;:!?])/g, '$1')
    .trim()
}

function decodeHtml(value) {
  return String(value || '')
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#039;', "'")
}

function absoluteUrl(value, currentUrl = 'https://www.areaimmobiliare.com/') {
  if (!value) return null

  const raw = String(value)
    .trim()
    .replace(/^['"]|['"]$/g, '')

  if (!raw || raw.startsWith('data:') || raw.startsWith('mailto:') || raw.startsWith('tel:')) {
    return null
  }

  try {
    return new URL(raw, currentUrl).toString().replace(/#.*$/, '')
  } catch {
    return null
  }
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

function normalizePropertyUrl(url) {
  const absolute = absoluteUrl(url)
  if (!absolute) return null

  try {
    let parsed = new URL(absolute)

    if (parsed.hostname === 'web.archive.org') {
      const match = parsed.pathname.match(/\/web\/\d+(?:[a-z_]+)?\/(https?:\/\/.+)$/)
      if (match?.[1]) parsed = new URL(match[1])
    }

    if (!parsed.hostname.includes('areaimmobiliare.com')) return null
    if (!parsed.pathname.startsWith('/property/')) return null

    const parts = parsed.pathname.split('/').filter(Boolean)
    if (parts.length !== 2) return null

    return `https://www.areaimmobiliare.com/property/${parts[1]}/`
  } catch {
    return null
  }
}

async function fetchText(url) {
  await sleep(DELAY_MS)

  const response = await fetch(url, {
    headers: {
      'user-agent': USER_AGENT,
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'accept-language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
    },
    redirect: 'follow',
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`)
  }

  return await response.text()
}

async function discoverWaybackProperties() {
  const cdxUrl =
    'https://web.archive.org/cdx?url=www.areaimmobiliare.com/property/*&output=json&fl=timestamp,original,statuscode,mimetype,digest&filter=statuscode:200&collapse=digest&limit=20000'

  console.log(`CDX: ${cdxUrl}`)

  const text = await fetchText(cdxUrl)
  const data = JSON.parse(text)

  if (!Array.isArray(data) || data.length <= 1) {
    return []
  }

  const rows = data.slice(1)
  const byUrl = new Map()

  for (const row of rows) {
    const [timestamp, original, statuscode, mimetype, digest] = row
    const normalized = normalizePropertyUrl(original)

    if (!normalized) continue

    const previous = byUrl.get(normalized)

    if (!previous || String(timestamp) > String(previous.timestamp)) {
      byUrl.set(normalized, {
        timestamp,
        original_url: normalized,
        source_original: original,
        statuscode,
        mimetype,
        digest,
        wayback_url: `https://web.archive.org/web/${timestamp}id_/${normalized}`,
      })
    }
  }

  return [...byUrl.values()].sort((a, b) => a.original_url.localeCompare(b.original_url))
}

function parseItalianPrice(priceText) {
  const raw = cleanText(priceText)
  if (!raw) return null

  const digits = raw.replace(/[^\d]/g, '')
  if (!digits) return null

  const value = Number(digits)
  return Number.isFinite(value) && value > 0 ? value : null
}

function findPrice(bodyText) {
  const patterns = [
    /€\s*[\d.\s]+(?:,\d{2})?/i,
    /[\d.\s]+(?:,\d{2})?\s*euro/i,
    /(?:vendita|affitto)\s+€?\s*[\d.\s]+(?:,\d{2})?/i,
  ]

  for (const pattern of patterns) {
    const match = bodyText.match(pattern)
    if (match?.[0]) return cleanText(match[0])
  }

  return null
}

function inferContractType(text, title, url) {
  const haystack = `${title} ${url} ${text}`.toLowerCase()

  if (/\baffitt|locazion|canone\b/i.test(haystack)) return 'affitto'
  if (/\bvend|vendesi|vendita|acquist/i.test(haystack)) return 'vendita'

  return null
}

function inferPropertyType(text, title, url) {
  const haystack = `${title} ${url} ${text}`.toLowerCase()

  if (haystack.includes('ufficio')) return 'ufficio'
  if (haystack.includes('negozio')) return 'negozio'
  if (haystack.includes('villa')) return 'villa'
  if (haystack.includes('attico')) return 'attico'
  if (haystack.includes('quadrilocale')) return 'quadrilocale'
  if (haystack.includes('trilocale')) return 'trilocale'
  if (haystack.includes('bilocale')) return 'bilocale'
  if (haystack.includes('monolocale')) return 'monolocale'
  if (haystack.includes('box') || haystack.includes('garage')) return 'box'
  if (haystack.includes('appartamento')) return 'appartamento'

  return null
}

function firstNumberFromPatterns(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match?.[1]) {
      const value = Number(String(match[1]).replace(',', '.'))
      if (Number.isFinite(value)) return value
    }
  }

  return null
}

function extractDetails(text) {
  const normalized = cleanText(text)

  const surface = firstNumberFromPatterns(normalized, [
    /(?:superficie|area|dimensione|mq|m²)\s*:?\s*(\d{1,5}(?:[.,]\d+)?)\s*(?:mq|m²)?/i,
    /(\d{2,5}(?:[.,]\d+)?)\s*(?:mq|m²)\b/i,
  ])

  const rooms = firstNumberFromPatterns(normalized, [
    /(?:camere|camera|locali|locali totali)\s*:?\s*(\d{1,2})/i,
    /(\d{1,2})\s*(?:camere|camera|locali)\b/i,
  ])

  const bathrooms = firstNumberFromPatterns(normalized, [
    /(?:bagni|bagno)\s*:?\s*(\d{1,2})/i,
    /(\d{1,2})\s*(?:bagni|bagno)\b/i,
  ])

  const garages = firstNumberFromPatterns(normalized, [
    /(?:garage|box)\s*:?\s*(\d{1,2})/i,
    /(\d{1,2})\s*(?:garage|box)\b/i,
  ])

  return {
    surface,
    rooms,
    bathrooms,
    garages,
    has_garage: garages ? true : /\bgarage\b|\bbox\b/i.test(normalized),
    has_garden: /\bgiardino\b/i.test(normalized),
    has_elevator: /\bascensore\b/i.test(normalized),
    has_parking: /\bposto auto\b|\bposti auto\b|\bparcheggio\b/i.test(normalized),
  }
}

function chooseDescription($) {
  const candidates = [
    '.property-description',
    '.rh_property__content',
    '.rh_content',
    '.entry-content',
    '.property-content',
    '.single-property-content',
    'article',
    'main',
  ]

  for (const selector of candidates) {
    const node = $(selector).first()
    const text = cleanText(node.text())

    if (text.length > 180) {
      return {
        text,
        html: cleanText(node.html() || ''),
      }
    }
  }

  const paragraphs = []

  $('p').each((_, element) => {
    const text = cleanText($(element).text())

    if (
      text.length > 80 &&
      !/cookie|privacy|contatti|pec:|p\.iva|telefono|whatsapp|area immobiliare sas/i.test(text)
    ) {
      paragraphs.push(text)
    }
  })

  return {
    text: cleanText(paragraphs.join('\n\n')),
    html: '',
  }
}

function waybackOriginalFromUrl(url) {
  if (!url) return null

  try {
    const parsed = new URL(url)

    if (parsed.hostname !== 'web.archive.org') return url

    const match = parsed.pathname.match(/\/web\/\d+(?:[a-z_]+)?\/(https?:\/\/.+)$/)
    if (!match?.[1]) return url

    return match[1]
  } catch {
    return url
  }
}

function archivedAssetUrl(originalUrl, timestamp) {
  const original = waybackOriginalFromUrl(originalUrl)
  if (!original) return null

  try {
    const parsed = new URL(original)
    if (!parsed.hostname.includes('areaimmobiliare.com')) return null
    if (!parsed.pathname.includes('/wp-content/uploads/')) return null

    return {
      original_url: original,
      archived_url: `https://web.archive.org/web/${timestamp}im_/${original}`,
    }
  } catch {
    return null
  }
}

function extractImages($, currentUrl, timestamp) {
  const images = []

  const add = (value) => {
    const absolute = absoluteUrl(value, currentUrl)
    if (!absolute) return

    const lower = absolute.toLowerCase()

    if (!/\.(jpe?g|png|webp)(\?|$)/i.test(lower)) return
    if (!lower.includes('/wp-content/uploads/')) return
    if (
      /logo|favicon|cropped|icon|placeholder|banner|avatar|profile|whatsapp|facebook|instagram/i.test(
        lower,
      )
    ) {
      return
    }

    const pair = archivedAssetUrl(absolute, timestamp)
    if (pair) images.push(pair)
  }

  add($('meta[property="og:image"]').attr('content'))
  add($('meta[name="twitter:image"]').attr('content'))

  $('img').each((_, element) => {
    const node = $(element)

    for (const attr of [
      'src',
      'data-src',
      'data-lazy-src',
      'data-original',
      'data-full-url',
      'data-large_image',
    ]) {
      add(node.attr(attr))
    }

    const srcset = node.attr('srcset') || node.attr('data-srcset')
    if (srcset) {
      for (const part of srcset.split(',')) {
        add(part.trim().split(/\s+/)[0])
      }
    }
  })

  $('[style]').each((_, element) => {
    const style = $(element).attr('style') || ''
    const matches = style.matchAll(/url\(([^)]+)\)/gi)

    for (const match of matches) {
      add(match[1])
    }
  })

  $('a[href]').each((_, element) => {
    add($(element).attr('href'))
  })

  const seen = new Set()

  return images.filter((image) => {
    if (seen.has(image.original_url)) return false
    seen.add(image.original_url)
    return true
  })
}

function extractFeatures(text) {
  const featureWords = [
    'ascensore',
    'balcone',
    'balconi',
    'terrazzo',
    'terrazzi',
    'giardino',
    'box',
    'garage',
    'posto auto',
    'cantina',
    'mansarda',
    'taverna',
    'riscaldamento autonomo',
    'riscaldamento centralizzato',
    'aria condizionata',
    'porta blindata',
    'doppi vetri',
    'arredato',
    'non arredato',
    'nuova costruzione',
    'ristrutturato',
  ]

  const lower = text.toLowerCase()
  return featureWords.filter((word) => lower.includes(word))
}

function parsePropertyHtml(snapshot, html) {
  const $ = cheerio.load(html)

  $('script, style, noscript, svg').remove()

  const rawTitle =
    $('h1').first().text() ||
    $('meta[property="og:title"]').attr('content') ||
    $('title').first().text() ||
    ''

  const title = cleanText(
    rawTitle
      .replace(/\s*[-|]\s*Area Immobiliare\s*$/i, '')
      .replace(/^Area Immobiliare\s*[-|]\s*/i, ''),
  )

  const bodyText = cleanText($('body').text())
  const metaDescription = cleanText(
    $('meta[property="og:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') ||
      '',
  )

  const description = chooseDescription($)
  const priceText = findPrice(bodyText)
  const details = extractDetails(bodyText)
  const images = extractImages($, snapshot.wayback_url, snapshot.timestamp)

  return {
    source_tag: 'old_site_import',
    import_source: 'wayback',
    is_demo: false,
    needs_review: true,

    old_source_url: snapshot.original_url,
    wayback_url: snapshot.wayback_url,
    wayback_timestamp: snapshot.timestamp,
    imported_at: null,

    title,
    slug_suggestion: slugify(title),
    price_text: priceText,
    price: parseItalianPrice(priceText),
    contract_type: inferContractType(bodyText, title, snapshot.original_url),
    property_type: inferPropertyType(bodyText, title, snapshot.original_url),

    description_text: description.text || metaDescription,
    description_html: description.html,

    surface: details.surface,
    rooms: details.rooms,
    bathrooms: details.bathrooms,
    garages: details.garages,
    has_garage: details.has_garage,
    has_garden: details.has_garden,
    has_elevator: details.has_elevator,
    has_parking: details.has_parking,

    features_detected: extractFeatures(bodyText),

    images,
    image_count: images.length,

    scan_quality: {
      has_title: Boolean(title),
      has_price: Boolean(priceText),
      has_description: Boolean(description.text || metaDescription),
      has_images: images.length > 0,
      body_text_length: bodyText.length,
      html_length: html.length,
    },
  }
}

function toCsvValue(value) {
  if (value === null || value === undefined) return ''

  const text = Array.isArray(value)
    ? value
        .map((item) => {
          if (typeof item === 'string') return item
          if (item?.original_url) return item.original_url
          return JSON.stringify(item)
        })
        .join(' | ')
    : String(value)

  return `"${text.replaceAll('"', '""')}"`
}

function writeCsv(properties) {
  const headers = [
    'title',
    'old_source_url',
    'wayback_timestamp',
    'price_text',
    'price',
    'contract_type',
    'property_type',
    'surface',
    'rooms',
    'bathrooms',
    'garages',
    'image_count',
    'features_detected',
  ]

  const rows = [
    headers.join(','),
    ...properties.map((property) =>
      headers.map((header) => toCsvValue(property[header])).join(','),
    ),
  ]

  fs.writeFileSync(OUT_CSV, rows.join('\n') + '\n')
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })

  console.log('')
  console.log('=== SCAN AREAIMMOBILIARE DA WAYBACK ===')
  console.log(`Max properties: ${MAX_PROPERTIES || 'no limit'}`)
  console.log('')

  let snapshots = await discoverWaybackProperties()
  const totalDiscoveredWaybackProperties = snapshots.length

  console.log(`Schede property trovate su Wayback: ${totalDiscoveredWaybackProperties}`)

  if (MAX_PROPERTIES > 0) {
    snapshots = snapshots.slice(0, MAX_PROPERTIES)
  }

  console.log(`Schede da leggere ora: ${snapshots.length}`)
  console.log('')

  const properties = []
  const errors = []

  for (let index = 0; index < snapshots.length; index += 1) {
    const snapshot = snapshots[index]

    try {
      const html = await fetchText(snapshot.wayback_url)
      const property = parsePropertyHtml(snapshot, html)
      properties.push(property)

      console.log(
        `PROPERTY ${index + 1}/${snapshots.length}: ${property.title || 'SENZA TITOLO'} | immagini: ${property.image_count} | testo: ${property.scan_quality.body_text_length} | ${snapshot.original_url}`,
      )
    } catch (error) {
      errors.push({
        old_source_url: snapshot.original_url,
        wayback_url: snapshot.wayback_url,
        error: error.message,
      })

      console.log(
        `ERROR ${index + 1}/${snapshots.length}: ${snapshot.original_url} -> ${error.message}`,
      )
    }
  }

  const result = {
    scanned_at: new Date().toISOString(),
    source: 'wayback',
    summary: {
      discovered_wayback_properties: totalDiscoveredWaybackProperties,
      selected_for_scan: snapshots.length,
      scanned_properties: properties.length,
      errors: errors.length,
      with_title: properties.filter((p) => p.scan_quality.has_title).length,
      with_price: properties.filter((p) => p.scan_quality.has_price).length,
      with_description: properties.filter((p) => p.scan_quality.has_description).length,
      with_images: properties.filter((p) => p.scan_quality.has_images).length,
      total_images_found: properties.reduce((sum, p) => sum + p.image_count, 0),
    },
    properties,
    errors,
  }

  fs.writeFileSync(OUT_JSON, JSON.stringify(result, null, 2) + '\n')
  writeCsv(properties)

  console.log('')
  console.log('=== RISULTATO WAYBACK SCAN ===')
  console.log(JSON.stringify(result.summary, null, 2))
  console.log('')
  console.log(`JSON: ${OUT_JSON}`)
  console.log(`CSV:  ${OUT_CSV}`)
  console.log('')
}

main().catch((error) => {
  console.error('')
  console.error('WAYBACK SCAN FALLITO:')
  console.error(error)
  process.exit(1)
})
