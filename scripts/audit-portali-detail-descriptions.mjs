import fs from 'node:fs/promises'
import path from 'node:path'

const ROOT = process.cwd()
const OUT_DIR = path.join(ROOT, 'tmp', 'area-portali-audit')
const DETAIL_DIR = path.join(OUT_DIR, 'detail-pages')
const PLAN_JSON = path.join(OUT_DIR, 'piano-import-immobili-portali.json')
const OUT_MD = path.join(OUT_DIR, 'descrizioni-portali-dettaglio-per-ref.md')
const OUT_JSON = path.join(OUT_DIR, 'descrizioni-portali-dettaglio-per-ref.json')

function compact(value = '') {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function decodeHtml(value = '') {
  return String(value || '')
    .replace(/\\u002F/g, '/')
    .replace(/\\\//g, '/')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&agrave;/g, 'à')
    .replace(/&egrave;/g, 'è')
    .replace(/&eacute;/g, 'é')
    .replace(/&igrave;/g, 'ì')
    .replace(/&ograve;/g, 'ò')
    .replace(/&ugrave;/g, 'ù')
    .replace(/&nbsp;/g, ' ')
}

function decodeJsonString(value = '') {
  try {
    return JSON.parse(`"${value.replace(/\n/g, '\\n')}"`)
  } catch {
    return decodeHtml(value)
  }
}

function stripHtml(value = '') {
  return decodeHtml(value)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalize(value = '') {
  return compact(decodeHtml(value))
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, ' ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function safeCell(value = '') {
  return compact(value).replace(/\|/g, '/').slice(0, 300)
}

function escapeRegex(value = '') {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function cleanPortalUrl(url = '') {
  let u = decodeHtml(url).trim()
  if (!u) return ''

  if (u.startsWith('//')) u = `https:${u}`
  if (u.startsWith('/')) u = `https://www.casa.it${u}`

  u = u.replace('https://www. /', 'https://www.immobiliare.it/')
  u = u.replace('https://www./', 'https://www.immobiliare.it/')

  return u
}

function isLikelyPortalDetailUrl(url = '') {
  const u = cleanPortalUrl(url)
  return (
    /^https:\/\/www\.immobiliare\.it\/annunci\/\d+/i.test(u) ||
    /^https:\/\/www\.casa\.it\/immobili\//i.test(u) ||
    /^https:\/\/www\.casa\.it\/immobile\//i.test(u) ||
    /^https:\/\/www\.casa\.it\/annunci\//i.test(u)
  )
}

async function walk(dir) {
  const out = []
  const entries = await fs.readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...await walk(full))
    else out.push(full)
  }

  return out
}

async function loadListHtmlFiles() {
  const files = (await walk(OUT_DIR))
    .filter((file) => /\.html$/i.test(file))
    .filter((file) => !file.includes(`${path.sep}detail-pages${path.sep}`))

  const out = []

  for (const file of files) {
    const html = await fs.readFile(file, 'utf8')
    out.push({
      file: path.relative(ROOT, file),
      html,
      plain: stripHtml(html),
      norm: normalize(html),
    })
  }

  return out
}

function extractSeoLinks(html = '') {
  const links = []
  const re = /"seo"\s*:\s*\{\s*"anchor"\s*:\s*"((?:\\.|[^"\\])*)"\s*,\s*"url"\s*:\s*"((?:\\.|[^"\\])*)"/g

  for (const match of html.matchAll(re)) {
    const title = decodeJsonString(match[1])
    const url = cleanPortalUrl(decodeJsonString(match[2]))

    if (title && isLikelyPortalDetailUrl(url)) {
      links.push({ title, url, source: 'seo-json' })
    }
  }

  return links
}

function extractHrefLinks(html = '') {
  const links = []
  const re = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]{0,900}?)<\/a>/gi

  for (const match of html.matchAll(re)) {
    const url = cleanPortalUrl(match[1])
    const text = stripHtml(match[2])

    if (text && isLikelyPortalDetailUrl(url)) {
      links.push({ title: text, url, source: 'href' })
    }
  }

  return links
}

function titleScore(a = '', b = '') {
  const aa = normalize(a).split(' ').filter((x) => x.length > 2)
  const bb = new Set(normalize(b).split(' ').filter((x) => x.length > 2))

  if (!aa.length || !bb.size) return 0

  let hits = 0
  for (const token of aa) {
    if (bb.has(token)) hits += 1
  }

  return hits / Math.max(aa.length, bb.size)
}

function findBestDetailUrl(row, htmlFiles) {
  const candidates = []

  for (const htmlFile of htmlFiles) {
    const links = [
      ...extractSeoLinks(htmlFile.html),
      ...extractHrefLinks(htmlFile.html),
    ]

    for (const link of links) {
      const score = titleScore(row.title, link.title)
      if (score < 0.45) continue

      candidates.push({
        ...link,
        score,
        file: htmlFile.file,
      })
    }
  }

  candidates.sort((a, b) => b.score - a.score)

  return candidates[0] || null
}

async function fetchWithCache(ref, url) {
  await fs.mkdir(DETAIL_DIR, { recursive: true })

  const file = path.join(DETAIL_DIR, `${ref}.html`)

  try {
    const existing = await fs.readFile(file, 'utf8')
    if (existing && existing.length > 1000) {
      return { html: existing, fromCache: true }
    }
  } catch {}

  const response = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0 AreaImmobiliareAudit/1.0',
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'accept-language': 'it-IT,it;q=0.9,en;q=0.7',
    },
  })

  const html = await response.text()

  await fs.writeFile(file, html, 'utf8')

  if (!response.ok || html.length < 1000) {
    throw new Error(`HTTP ${response.status}, html ${html.length} bytes`)
  }

  return { html, fromCache: false }
}

function extractMetaDescriptions(html = '') {
  const out = []

  const patterns = [
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/gi,
    /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["'][^>]*>/gi,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["'][^>]*>/gi,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["'][^>]*>/gi,
  ]

  for (const re of patterns) {
    for (const match of html.matchAll(re)) {
      out.push({
        source: 'meta',
        text: stripHtml(match[1]),
      })
    }
  }

  return out
}

function extractJsonLdDescriptions(html = '') {
  const out = []
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi

  for (const match of html.matchAll(re)) {
    const raw = stripHtml(match[1])
    try {
      const parsed = JSON.parse(raw)
      const items = Array.isArray(parsed) ? parsed : [parsed]

      for (const item of items) {
        if (item?.description) {
          out.push({
            source: 'jsonld',
            text: stripHtml(item.description),
          })
        }

        if (item?.['@graph']) {
          for (const graphItem of item['@graph']) {
            if (graphItem?.description) {
              out.push({
                source: 'jsonld-graph',
                text: stripHtml(graphItem.description),
              })
            }
          }
        }
      }
    } catch {}
  }

  return out
}

function extractJsonDescriptionFields(html = '') {
  const out = []
  const fields = [
    'description',
    'descriptionText',
    'text',
  ]

  for (const field of fields) {
    const re = new RegExp(`"${field}"\\s*:\\s*"((?:\\\\.|[^"\\\\]){80,3000})"`, 'g')

    for (const match of html.matchAll(re)) {
      out.push({
        source: `json-${field}`,
        text: stripHtml(decodeJsonString(match[1])),
      })
    }
  }

  return out
}

function cleanupDescription(text = '') {
  let t = stripHtml(text)

  t = t
    .replace(/\bAREA IMMOBILIARE SAS DI BELOTTI G\.?\b/gi, ' ')
    .replace(/\bAREA IMMOBILIARE SAS DI BELOTTI\b/gi, ' ')
    .replace(/\bContatta\b/gi, ' ')
    .replace(/\bSalva\b/gi, ' ')
    .replace(/\bEspandi\b/gi, ' ')
    .replace(/\bTi interessa\?\b/gi, ' ')
    .replace(/\bChiama\b/gi, ' ')
    .replace(/\bInvia\b/gi, ' ')
    .replace(/\bGold\b/gi, ' ')
    .replace(/\bPlatinum\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return t
}

function isBadDescription(text = '') {
  const t = text
  const n = normalize(t)

  if (t.length < 80) return true
  if (t.length > 5000) return true

  const bad = [
    'pwm.im-cdn.it',
    'pic.im-cdn.it',
    '"urls"',
    'dataType',
    'realEstate',
    'ga4',
    'uuid',
    'seo',
    'idGeoHash',
    'featureList',
    'lbl_',
    'csaSrpcard',
    'nd-icon',
    'application/ld+json',
    'cookie',
    'privacy policy',
    'start_a_new_search',
    'keywords_filter',
  ]

  for (const item of bad) {
    if (t.includes(item)) return true
  }

  if ((t.match(/\{|\}|\[|\]|":/g) || []).length > 4) return true
  if (n.includes('pubblica annuncio') || n.includes('inizia una nuova ricerca')) return true

  return false
}

function scoreDescription(row, candidate) {
  const text = cleanupDescription(candidate.text)
  let score = 0

  if (isBadDescription(text)) score -= 100
  if (text.length >= 120) score += 20
  if (text.length >= 250) score += 15
  if (text.length >= 500) score += 5

  const titleTokens = normalize(row.title).split(' ').filter((x) => x.length > 3)
  const textNorm = normalize(text)

  let titleHits = 0
  for (const token of titleTokens) {
    if (textNorm.includes(token)) titleHits += 1
  }

  if (titleHits >= 2) score += 15

  const price = String(row.price_number || '').trim()
  if (price && text.replace(/\D/g, '').includes(price.replace(/\D/g, ''))) {
    score += 10
  }

  if (candidate.source === 'jsonld') score += 5
  if (candidate.source === 'meta') score += 3

  return {
    ...candidate,
    text,
    score,
    titleHits,
    bad: isBadDescription(text),
  }
}

function extractBestDescription(row, html = '') {
  const candidates = [
    ...extractMetaDescriptions(html),
    ...extractJsonLdDescriptions(html),
    ...extractJsonDescriptionFields(html),
  ]
    .map((candidate) => scoreDescription(row, candidate))
    .filter((candidate) => candidate.text)

  candidates.sort((a, b) => b.score - a.score)

  return candidates[0] || {
    source: '',
    text: '',
    score: -999,
    titleHits: 0,
    bad: true,
  }
}

function buildFinalDescription(row, candidate) {
  const parts = []

  if (!candidate.bad && candidate.text.length >= 80) {
    parts.push(candidate.text)
  }

  parts.push('Bozza importata da audit portali Area Immobiliare.')
  parts.push(`Fonte portali: ${row.portals}.`)
  parts.push(`REF import: ${row.reference_code}.`)

  return parts.join('\n\n')
}

async function main() {
  const plan = JSON.parse(await fs.readFile(PLAN_JSON, 'utf8'))
  const htmlFiles = await loadListHtmlFiles()

  const rowsToAnalyze = (plan.importRows || [])
    .filter((row) => row.action === 'CREARE DRAFT')
    .filter((row) => ['vendita', 'affitto'].includes(compact(row.contract_type).toLowerCase()))

  const rows = []

  console.log('=== AUDIT DESCRIZIONI DA PAGINE DETTAGLIO ===')
  console.log(`Immobili da analizzare: ${rowsToAnalyze.length}`)
  console.log('')

  for (const row of rowsToAnalyze) {
    const detail = findBestDetailUrl(row, htmlFiles)

    if (!detail) {
      const finalDescription = buildFinalDescription(row, { bad: true, text: '' })
      rows.push({
        reference_code: row.reference_code,
        title: row.title,
        portals: row.portals,
        url: '',
        status: 'NO_URL',
        source: '',
        score: -999,
        description: '',
        final_description: finalDescription,
        error: 'URL dettaglio non trovato',
      })
      console.log(`NO_URL ${row.reference_code} | ${row.title}`)
      continue
    }

    try {
      const { html, fromCache } = await fetchWithCache(row.reference_code, detail.url)
      const best = extractBestDescription(row, html)
      const status = !best.bad && best.score >= 20 ? 'OK' : 'REVIEW'
      const finalDescription = buildFinalDescription(row, best)

      rows.push({
        reference_code: row.reference_code,
        title: row.title,
        portals: row.portals,
        url: detail.url,
        url_score: detail.score,
        url_source: detail.source,
        url_file: detail.file,
        from_cache: fromCache,
        status,
        source: best.source,
        score: best.score,
        title_hits: best.titleHits,
        description: best.text,
        final_description: finalDescription,
        error: '',
      })

      console.log(`${status} ${row.reference_code} | score ${best.score} | ${best.text.length} caratteri | ${row.title}`)
    } catch (error) {
      const finalDescription = buildFinalDescription(row, { bad: true, text: '' })
      rows.push({
        reference_code: row.reference_code,
        title: row.title,
        portals: row.portals,
        url: detail.url,
        status: 'FETCH_FAIL',
        source: '',
        score: -999,
        description: '',
        final_description: finalDescription,
        error: error.message,
      })

      console.log(`FETCH_FAIL ${row.reference_code} | ${error.message}`)
    }
  }

  const ok = rows.filter((row) => row.status === 'OK')
  const review = rows.filter((row) => row.status !== 'OK')

  const md = [
    '# Descrizioni portali da pagine dettaglio',
    '',
    `Generato: ${new Date().toLocaleString('it-IT')}`,
    '',
    '## Riepilogo',
    '',
    `- Immobili analizzati: **${rows.length}**`,
    `- Descrizioni pulite OK: **${ok.length}**`,
    `- Da verificare / non trovate: **${review.length}**`,
    '',
    '## Tabella compatta',
    '',
    '| REF | Stato | Score | Sorgente | URL | Immobile | Anteprima descrizione |',
    '|---|---|---:|---|---|---|---|',
    ...rows.map((row) => `| ${safeCell(row.reference_code)} | ${safeCell(row.status)} | ${row.score} | ${safeCell(row.source || '-')} | ${row.url ? 'sì' : 'no'} | ${safeCell(row.title)} | ${safeCell(row.description || row.error)} |`),
    '',
    '## Descrizioni complete candidate',
    '',
    ...rows.map((row) => [
      `### ${row.reference_code} — ${row.title}`,
      '',
      `Stato: ${row.status}`,
      '',
      row.url ? `URL: ${row.url}` : 'URL: -',
      '',
      '```',
      row.final_description,
      '```',
      '',
    ].join('\n')),
  ].join('\n')

  await fs.writeFile(OUT_MD, md, 'utf8')
  await fs.writeFile(OUT_JSON, JSON.stringify({
    generatedAt: new Date().toISOString(),
    counts: {
      rows: rows.length,
      ok: ok.length,
      review: review.length,
    },
    rows,
  }, null, 2), 'utf8')

  console.log('')
  console.log('=== REPORT CREATO ===')
  console.log('tmp/area-portali-audit/descrizioni-portali-dettaglio-per-ref.md')
  console.log('tmp/area-portali-audit/descrizioni-portali-dettaglio-per-ref.json')
  console.log('')
  console.log(md.split('\n').slice(0, 120).join('\n'))
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
