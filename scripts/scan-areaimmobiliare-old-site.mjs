import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import * as cheerio from 'cheerio'

const DEFAULT_BASE_URL = 'https://www.areaimmobiliare.com'

const args = Object.fromEntries(
  process.argv
    .slice(2)
    .filter((arg) => arg.startsWith('--'))
    .map((arg) => {
      const [key, ...valueParts] = arg.replace(/^--/, '').split('=')
      return [key, valueParts.join('=') || 'true']
    }),
)

const BASE_URL = String(args.base || DEFAULT_BASE_URL).replace(/\/+$/, '')
const MAX_PROPERTIES = Number(args['max-properties'] || 0)
const MAX_ARCHIVE_PAGES = Number(args['max-archive-pages'] || 80)
const DELAY_MS = Number(args['delay-ms'] || 350)

const OUT_DIR = path.join(process.cwd(), 'data', 'imports')
const OUT_JSON = path.join(OUT_DIR, 'areaimmobiliare-old-site-properties.json')
const OUT_CSV = path.join(OUT_DIR, 'areaimmobiliare-old-site-properties.csv')

const USER_AGENT =
  'Mozilla/5.0 (compatible; BelottiImportScanner/1.0; +https://belotti-immobiliare.vercel.app)'

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

function absoluteUrl(value, currentUrl = BASE_URL) {
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

function decodeHtml(value) {
  return String(value || '')
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#039;', "'")
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
    const parsed = new URL(absolute)
    if (!parsed.hostname.includes('areaimmobiliare.com')) return null
    if (!parsed.pathname.startsWith('/property/')) return null

    const parts = parsed.pathname.split('/').filter(Boolean)
    if (parts.length !== 2) return null

    return `${BASE_URL}/property/${parts[1]}/`
  } catch {
    return null
  }
}

function extractPropertyLinksFromHtml(html) {
  const links = []

  const hrefMatches = String(html).matchAll(/href=["']([^"']*\/property\/[^"']+)["']/gi)
  for (const match of hrefMatches) {
    const normalized = normalizePropertyUrl(decodeHtml(match[1]))
    if (normalized) links.push(normalized)
  }

  return uniq(links)
}

function extractSitemapUrls(xml) {
  const urls = []
  const matches = String(xml).matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)
  for (const match of matches) {
    const url = decodeHtml(match[1]).trim()
    if (url) urls.push(url)
  }
  return uniq(urls)
}

async function fetchText(url) {
  await sleep(DELAY_MS)

  const response = await fetch(url, {
    headers: {
      'user-agent': USER_AGENT,
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
    redirect: 'follow',
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`)
  }

  return await response.text()
}

async function tryFetchText(url) {
  try {
    return await fetchText(url)
  } catch (error) {
    console.log(`SKIP ${url} -> ${error.message}`)
    return null
  }
}

async function discoverFromSitemaps() {
  const discovered = new Set()
  const sitemapCandidates = [
    `${BASE_URL}/sitemap.xml`,
    `${BASE_URL}/sitemap_index.xml`,
    `${BASE_URL}/property-sitemap.xml`,
    `${BASE_URL}/property-sitemap1.xml`,
    `${BASE_URL}/wp-sitemap.xml`,
    `${BASE_URL}/wp-sitemap-posts-property-1.xml`,
    `${BASE_URL}/wp-sitemap-posts-property-2.xml`,
  ]

  const queue = [...sitemapCandidates]
  const seen = new Set()

  while (queue.length > 0 && seen.size < 30) {
    const sitemapUrl = queue.shift()
    if (!sitemapUrl || seen.has(sitemapUrl)) continue
    seen.add(sitemapUrl)

    const xml = await tryFetchText(sitemapUrl)
    if (!xml) continue

    const urls = extractSitemapUrls(xml)

    for (const url of urls) {
      const propertyUrl = normalizePropertyUrl(url)
      if (propertyUrl) discovered.add(propertyUrl)

      const lower = url.toLowerCase()
      if (
        lower.includes('sitemap') &&
        lower.includes('areaimmobiliare.com') &&
        !seen.has(url)
      ) {
        queue.push(url)
      }
    }

    const htmlLinks = extractPropertyLinksFromHtml(xml)
    for (const link of htmlLinks) discovered.add(link)
  }

  return [...discovered]
}

function getPaginationLinks(html, currentUrl) {
  const $ = cheerio.load(html)
  const links = []

  $('a[href]').each((_, element) => {
    const href = absoluteUrl($(element).attr('href'), currentUrl)
    if (!href) return

    try {
      const parsed = new URL(href)
      if (!parsed.hostname.includes('areaimmobiliare.com')) return
      if (!/\/page\/\d+\/?/.test(parsed.pathname)) return
      links.push(parsed.toString())
    } catch {
      // ignore
    }
  })

  return uniq(links)
}

async function discoverFromArchivePages() {
  const discovered = new Set()

  const seeds = [
    `${BASE_URL}/`,
    `${BASE_URL}/property-city/bergamo/`,
    `${BASE_URL}/property-status/vendita/`,
    `${BASE_URL}/property-status/affitto/`,
    `${BASE_URL}/property-type/residenziale/`,
    `${BASE_URL}/property-type/uffici-e-negozi/`,
    `${BASE_URL}/property-type/appartamenti/`,
    `${BASE_URL}/property-type/ville/`,
    `${BASE_URL}/property-type/attici/`,
  ]

  const queue = [...seeds]
  const seen = new Set()

  while (queue.length > 0 && seen.size < MAX_ARCHIVE_PAGES) {
    const url = queue.shift()
    if (!url || seen.has(url)) continue
    seen.add(url)

    const html = await tryFetchText(url)
    if (!html) continue

    const propertyLinks = extractPropertyLinksFromHtml(html)
    for (const link of propertyLinks) discovered.add(link)

    const paginationLinks = getPaginationLinks(html, url)
    for (const link of paginationLinks) {
      if (!seen.has(link) && queue.length < MAX_ARCHIVE_PAGES * 2) {
        queue.push(link)
      }
    }

    console.log(
      `ARCHIVE ${seen.size}/${MAX_ARCHIVE_PAGES}: ${url} -> property links totali: ${discovered.size}`,
    )
  }

  return [...discovered]
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
      !/cookie|privacy|contatti|pec:|p\.iva|telefono|whatsapp/i.test(text)
    ) {
      paragraphs.push(text)
    }
  })

  return {
    text: cleanText(paragraphs.join('\n\n')),
    html: '',
  }
}

function extractImages($, currentUrl) {
  const images = []

  const add = (value) => {
    const url = absoluteUrl(value, currentUrl)
    if (!url) return

    const lower = url.toLowerCase()

    if (!/\.(jpe?g|png|webp)(\?|$)/i.test(lower)) return
    if (!lower.includes('/wp-content/uploads/')) return
    if (
      /logo|favicon|cropped|icon|placeholder|banner|avatar|profile|whatsapp|facebook|instagram/i.test(
        lower,
      )
    ) {
      return
    }

    images.push(url)
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
    for (const match of matches) add(match[1])
  })

  $('a[href]').each((_, element) => {
    add($(element).attr('href'))
  })

  return uniq(images)
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

function parsePropertyHtml(url, html) {
  const $ = cheerio.load(html)

  $('script, style, noscript, svg').remove()

  const canonical = absoluteUrl($('link[rel="canonical"]').attr('href'), url) || url

  const rawTitle =
    $('h1').first().text() ||
    $('meta[property="og:title"]').attr('content') ||
    $('title').first().text() ||
    ''

  const title = cleanText(rawTitle.replace(/\s*[-|]\s*Area Immobiliare\s*$/i, ''))

  const bodyText = cleanText($('body').text())
  const metaDescription = cleanText(
    $('meta[property="og:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') ||
      '',
  )

  const description = chooseDescription($)
  const priceText = findPrice(bodyText)
  const details = extractDetails(bodyText)

  const contractType = inferContractType(bodyText, title, url)
  const propertyType = inferPropertyType(bodyText, title, url)
  const images = extractImages($, url)

  return {
    source_tag: 'old_site_import',
    is_demo: false,
    needs_review: true,
    old_source_url: canonical,
    imported_at: null,

    title,
    slug_suggestion: slugify(title),
    price_text: priceText,
    price: parseItalianPrice(priceText),
    contract_type: contractType,
    property_type: propertyType,

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
    },
  }
}

function toCsvValue(value) {
  if (value === null || value === undefined) return ''
  const text = Array.isArray(value) ? value.join(' | ') : String(value)
  return `"${text.replaceAll('"', '""')}"`
}

function writeCsv(properties) {
  const headers = [
    'title',
    'old_source_url',
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
  console.log('=== SCAN AREAIMMOBILIARE OLD SITE ===')
  console.log(`Base URL: ${BASE_URL}`)
  console.log(`Max properties: ${MAX_PROPERTIES || 'no limit'}`)
  console.log(`Max archive pages: ${MAX_ARCHIVE_PAGES}`)
  console.log('')

  const fromSitemaps = await discoverFromSitemaps()
  console.log(`Sitemap property links trovati: ${fromSitemaps.length}`)

  const fromArchives = await discoverFromArchivePages()
  console.log(`Archive property links trovati: ${fromArchives.length}`)

  let propertyUrls = uniq([...fromSitemaps, ...fromArchives]).sort()

  if (MAX_PROPERTIES > 0) {
    propertyUrls = propertyUrls.slice(0, MAX_PROPERTIES)
  }

  console.log('')
  console.log(`Totale schede immobile da leggere: ${propertyUrls.length}`)
  console.log('')

  const properties = []
  const errors = []

  for (let index = 0; index < propertyUrls.length; index += 1) {
    const url = propertyUrls[index]

    try {
      const html = await fetchText(url)
      const property = parsePropertyHtml(url, html)
      properties.push(property)

      console.log(
        `PROPERTY ${index + 1}/${propertyUrls.length}: ${property.title || 'SENZA TITOLO'} | immagini: ${property.image_count} | ${url}`,
      )
    } catch (error) {
      errors.push({
        url,
        error: error.message,
      })

      console.log(`ERROR ${index + 1}/${propertyUrls.length}: ${url} -> ${error.message}`)
    }
  }

  const result = {
    scanned_at: new Date().toISOString(),
    base_url: BASE_URL,
    summary: {
      discovered_from_sitemaps: fromSitemaps.length,
      discovered_from_archives: fromArchives.length,
      total_unique_property_urls: uniq([...fromSitemaps, ...fromArchives]).length,
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
  console.log('=== RISULTATO SCAN ===')
  console.log(JSON.stringify(result.summary, null, 2))
  console.log('')
  console.log(`JSON: ${OUT_JSON}`)
  console.log(`CSV:  ${OUT_CSV}`)
  console.log('')
}

main().catch((error) => {
  console.error('')
  console.error('SCAN FALLITO:')
  console.error(error)
  process.exit(1)
})
