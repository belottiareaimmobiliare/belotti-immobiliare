import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import * as cheerio from 'cheerio'

const OUT_DIR = path.join(process.cwd(), 'data', 'imports')
const OUT_FILE = path.join(OUT_DIR, 'areaimmobiliare-active-candidates.json')
const CLEAN_IMPORT_FILE = path.join(OUT_DIR, 'areaimmobiliare-clean-import.json')
const ACTIVE_IMPORT_FILE = path.join(OUT_DIR, 'areaimmobiliare-active-import.json')

const DELAY_MS = Number(process.argv.find((arg) => arg.startsWith('--delay-ms='))?.split('=')[1] || 500)

const seeds = [
  'https://www.areaimmobiliare.com/',
  'https://www.areaimmobiliare.com/ricerca-avanzata/',
  'https://www.areaimmobiliare.com/property-status/vendita/',
  'https://www.areaimmobiliare.com/property-status/affitto/',
  'https://www.areaimmobiliare.com/property-city/bergamo/',
  'https://www.areaimmobiliare.com/property-type/appartamenti/',
  'https://www.areaimmobiliare.com/property-type/attici/',
  'https://www.areaimmobiliare.com/property-type/ville/',
  'https://www.areaimmobiliare.com/property-type/uffici-e-negozi/',
]

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
    .trim()
}

function normalizePropertyUrl(url) {
  if (!url) return null

  try {
    let raw = String(url).trim()

    if (raw.startsWith('//')) raw = `https:${raw}`

    let parsed = new URL(raw, 'https://www.areaimmobiliare.com/')

    if (parsed.hostname === 'web.archive.org') {
      const match = parsed.pathname.match(/\/web\/\d+(?:[a-z_]+)?\/(https?:\/\/.+)$/)
      if (match?.[1]) parsed = new URL(match[1])
    }

    if (!parsed.hostname.includes('areaimmobiliare.com')) return null
    if (!parsed.pathname.startsWith('/property/')) return null

    const parts = parsed.pathname.split('/').filter(Boolean)
    if (parts.length !== 2) return null

    const slug = parts[1]
    if (!slug || slug === 'page') return null

    return `https://www.areaimmobiliare.com/property/${slug}/`
  } catch {
    return null
  }
}

async function fetchText(url) {
  await sleep(DELAY_MS)

  const response = await fetch(url, {
    headers: {
      'user-agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/147 Safari/537.36',
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'accept-language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
    },
    redirect: 'follow',
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  return await response.text()
}

async function latestSnapshotUrl(originalUrl) {
  const cdxUrl = `https://web.archive.org/cdx?url=${encodeURIComponent(originalUrl)}&output=json&fl=timestamp,original,statuscode,mimetype,digest&filter=statuscode:200&collapse=digest&limit=20`

  const text = await fetchText(cdxUrl)
  const data = JSON.parse(text)

  if (!Array.isArray(data) || data.length <= 1) return null

  const rows = data
    .slice(1)
    .filter((row) => {
      const mimetype = String(row[3] || '').toLowerCase()
      return mimetype.includes('text/html') || mimetype.includes('warc/revisit') || !mimetype
    })
    .sort((a, b) => String(b[0]).localeCompare(String(a[0])))

  const row = rows[0]
  if (!row) return null

  const timestamp = row[0]

  return {
    originalUrl,
    timestamp,
    waybackUrl: `https://web.archive.org/web/${timestamp}id_/${originalUrl}`,
  }
}

function extractPropertyLinks(html, baseUrl) {
  const $ = cheerio.load(html)
  const links = []

  $('a[href]').each((_, element) => {
    const href = $(element).attr('href')
    const normalized = normalizePropertyUrl(href)

    if (normalized) links.push(normalized)
  })

  const regexMatches = String(html).matchAll(/https?:\/\/(?:www\.)?areaimmobiliare\.com\/property\/[^"' <)]+|\/property\/[^"' <)]+/gi)

  for (const match of regexMatches) {
    const normalized = normalizePropertyUrl(match[0])
    if (normalized) links.push(normalized)
  }

  return uniq(links)
}

function extractPaginationLinks(html, currentOriginalUrl, currentTimestamp) {
  const $ = cheerio.load(html)
  const links = []

  $('a[href]').each((_, element) => {
    const href = $(element).attr('href')
    if (!href) return

    let original = null

    try {
      const parsed = new URL(href, currentOriginalUrl)

      if (parsed.hostname === 'web.archive.org') {
        const match = parsed.pathname.match(/\/web\/\d+(?:[a-z_]+)?\/(https?:\/\/.+)$/)
        if (match?.[1]) original = match[1]
      } else if (parsed.hostname.includes('areaimmobiliare.com')) {
        original = parsed.toString()
      }
    } catch {
      return
    }

    if (!original) return

    try {
      const parsedOriginal = new URL(original)

      if (
        parsedOriginal.hostname.includes('areaimmobiliare.com') &&
        /\/page\/\d+\/?$/.test(parsedOriginal.pathname)
      ) {
        links.push({
          originalUrl: parsedOriginal.toString(),
          timestamp: currentTimestamp,
          waybackUrl: `https://web.archive.org/web/${currentTimestamp}id_/${parsedOriginal.toString()}`,
        })
      }
    } catch {
      // ignore
    }
  })

  return uniq(links.map((item) => JSON.stringify(item))).map((item) => JSON.parse(item))
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })

  console.log('')
  console.log('=== SCAN IMMOBILI ATTIVI PROBABILI DA ULTIME PAGINE WAYBACK ===')
  console.log('')

  const queue = []
  const seenPages = new Set()
  const sourcePages = []
  const propertySources = new Map()

  for (const seed of seeds) {
    try {
      const snapshot = await latestSnapshotUrl(seed)

      if (!snapshot) {
        console.log(`NO SNAPSHOT: ${seed}`)
        continue
      }

      queue.push(snapshot)
      console.log(`SEED OK: ${seed} -> ${snapshot.timestamp}`)
    } catch (error) {
      console.log(`SEED ERROR: ${seed} -> ${error.message}`)
    }
  }

  while (queue.length > 0 && seenPages.size < 80) {
    const page = queue.shift()
    if (!page || seenPages.has(page.waybackUrl)) continue

    seenPages.add(page.waybackUrl)

    try {
      const html = await fetchText(page.waybackUrl)
      const text = cheerio.load(html)('body').text()

      const propertyLinks = extractPropertyLinks(html, page.originalUrl)
      const paginationLinks = extractPaginationLinks(html, page.originalUrl, page.timestamp)

      sourcePages.push({
        originalUrl: page.originalUrl,
        waybackUrl: page.waybackUrl,
        timestamp: page.timestamp,
        bodyTextLength: cleanText(text).length,
        propertyLinksCount: propertyLinks.length,
        paginationLinksCount: paginationLinks.length,
      })

      for (const propertyUrl of propertyLinks) {
        if (!propertySources.has(propertyUrl)) {
          propertySources.set(propertyUrl, [])
        }

        propertySources.get(propertyUrl).push({
          page: page.originalUrl,
          timestamp: page.timestamp,
        })
      }

      for (const nextPage of paginationLinks) {
        if (!seenPages.has(nextPage.waybackUrl)) {
          queue.push(nextPage)
        }
      }

      console.log(
        `PAGE ${seenPages.size}: ${page.originalUrl} | ${page.timestamp} | properties: ${propertyLinks.length} | pagination: ${paginationLinks.length}`,
      )
    } catch (error) {
      console.log(`PAGE ERROR: ${page.originalUrl} -> ${error.message}`)
    }
  }

  const activeUrls = [...propertySources.keys()].sort()

  const fullCleanImport = JSON.parse(fs.readFileSync(CLEAN_IMPORT_FILE, 'utf8'))
  const cleanByUrl = new Map(fullCleanImport.properties.map((property) => [property.old_source_url, property]))

  const activeProperties = activeUrls
    .map((url) => cleanByUrl.get(url))
    .filter(Boolean)
    .map((property) => ({
      ...property,
      active_candidate: true,
      active_candidate_sources: propertySources.get(property.old_source_url) || [],
    }))

  const missingFromCleanImport = activeUrls.filter((url) => !cleanByUrl.has(url))

  const result = {
    scanned_at: new Date().toISOString(),
    summary: {
      sourcePages: sourcePages.length,
      activeCandidateUrls: activeUrls.length,
      activePropertiesMatchedInCleanImport: activeProperties.length,
      missingFromCleanImport: missingFromCleanImport.length,
    },
    sourcePages,
    activeUrls,
    missingFromCleanImport,
    activePropertiesPreview: activeProperties.map((property) => ({
      title: property.title,
      price: property.price,
      contract_type: property.contract_type,
      property_type: property.property_type,
      image_count: property.image_count,
      old_source_url: property.old_source_url,
    })),
  }

  fs.writeFileSync(OUT_FILE, JSON.stringify(result, null, 2) + '\n')

  fs.writeFileSync(
    ACTIVE_IMPORT_FILE,
    JSON.stringify(
      {
        prepared_at: new Date().toISOString(),
        source: 'wayback_active_listing_candidates',
        summary: {
          active_properties: activeProperties.length,
          total_images: activeProperties.reduce((sum, property) => sum + property.image_count, 0),
        },
        properties: activeProperties,
      },
      null,
      2,
    ) + '\n',
  )

  console.log('')
  console.log('=== RISULTATO ATTIVI PROBABILI ===')
  console.log(result.summary)

  console.log('')
  console.log('=== ANTEPRIMA IMMOBILI ATTIVI PROBABILI ===')
  for (const property of activeProperties.slice(0, 80)) {
    console.log(`- ${property.title} | €${property.price} | ${property.old_source_url}`)
  }

  console.log('')
  console.log(`Candidati: ${OUT_FILE}`)
  console.log(`Import attivi: ${ACTIVE_IMPORT_FILE}`)
  console.log('')
}

main().catch((error) => {
  console.error('')
  console.error('SCAN ATTIVI FALLITO:')
  console.error(error)
  process.exit(1)
})
