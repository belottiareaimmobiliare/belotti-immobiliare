import fs from 'node:fs/promises'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

const ROOT = process.cwd()
const OUT_DIR = path.join(ROOT, 'tmp', 'area-portali-audit')
const FOOTER_FILE = path.join(ROOT, 'src', 'components', 'public', 'Footer.tsx')

const PORTALS = [
  {
    id: 'immobiliare-it',
    label: 'immobiliare.it',
    base: 'https://www.immobiliare.it',
    urls: [
      'https://www.immobiliare.it/agenzie-immobiliari/23950/area-bergamo/',
      'https://www.immobiliare.it/agenzie-immobiliari/23950/area-bergamo/?pag=2',
    ],
  },
  {
    id: 'casa-it',
    label: 'casa.it',
    base: 'https://www.casa.it',
    urls: [
      'https://www.casa.it/agenzie/area-immobiliare-sas-di-belotti-g-72711/',
      'https://www.casa.it/agenzie/area-immobiliare-sas-di-belotti-g-72711/?page=2',
      'https://www.casa.it/agenzie/area-immobiliare-sas-di-belotti-g-72711/?page=3',
      'https://www.casa.it/agenzie/area-immobiliare-sas-di-belotti-g-72711/?page=4',
    ],
  },
  {
    id: 'idealista',
    label: 'idealista',
    base: 'https://www.idealista.it',
    urls: [
      'https://www.idealista.it/pro/area-immobiliare-bergamo/',
      'https://www.idealista.it/pro/area-immobiliare-bergamo/affitto-case/',
      'https://www.idealista.it/pro/area-immobiliare-bergamo/vendita-uffici/',
      'https://www.idealista.it/pro/area-immobiliare-bergamo/affitto-uffici/',
      'https://www.idealista.it/pro/area-immobiliare-bergamo/vendita-negozi/',
      'https://www.idealista.it/pro/area-immobiliare-bergamo/affitto-negozi/',
      'https://www.idealista.it/pro/area-immobiliare-bergamo/vendita-garage/',
      'https://www.idealista.it/pro/area-immobiliare-bergamo/vendita-terreni/',
    ],
  },
]

const TITLE_RE = /\b(appartamento|bilocale|trilocale|quadrilocale|pentalocale|villa|villetta|ufficio|studio|locale commerciale|negozio|rustico|casale|cascina|garage|box|posto auto|terreno|casa colonica)\b/i
const BAD_TITLE_RE = /\b(area immobiliare|privacy|cookie|contatta|chiama|salva|accedi|pubblica|agenzie|mutui|prezzi immobili|valuta casa|ufficio stampa|lavora con noi|condizioni|regole|servizi ai|uso dei cookie|facebook|instagram|linkedin|telegram|youtube|sito web|come ordiniamo|mappa|filtra|rilevanza|precedente|successiva|messaggio|visita|premium)\b/i
const LISTING_HREF_RE = /(\/annunci\/|\/immobile\/|\/immobili\/|\/in-vendita\/|\/in-affitto\/)/i
const PRICE_EXACT_RE = /(Prezzo su richiesta|Trattativa riservata|€\s*\d{1,3}(?:\.\d{3})*(?:,\d+)?(?:\s*\/\s*mese)?|\d{1,3}(?:\.\d{3})*(?:,\d+)?\s*€(?:\s*\/\s*mese)?)/i

function decodeHtml(value = '') {
  return String(value)
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&euro;/g, '€')
    .replace(/&#8364;/g, '€')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&agrave;/g, 'à')
    .replace(/&egrave;/g, 'è')
    .replace(/&eacute;/g, 'é')
    .replace(/&igrave;/g, 'ì')
    .replace(/&ograve;/g, 'ò')
    .replace(/&ugrave;/g, 'ù')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
}

function compact(value = '') {
  return decodeHtml(value)
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t\r]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim()
}

function oneLine(value = '') {
  return decodeHtml(value)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function htmlToText(html = '') {
  return decodeHtml(html)
    .replace(/<script[\s\S]*?<\/script>/gi, '\n')
    .replace(/<style[\s\S]*?<\/style>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(a|p|div|li|h1|h2|h3|h4|article|section|header|footer|span)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .split('\n')
    .map((line) => line.replace(/[ \t\r]+/g, ' ').trim())
    .filter(Boolean)
    .join('\n')
}

function normalizeKey(value = '') {
  return compact(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

function safeCell(value = '') {
  return compact(String(value || '')).replace(/\|/g, '/')
}

function absoluteUrl(href, base) {
  try {
    return new URL(decodeHtml(href), base).toString()
  } catch {
    return href
  }
}

function extractCounts(text) {
  const found = []
  const patterns = [
    /(\d+)\s+annunci\b/gi,
    /(\d+)\s+risultati\b/gi,
    /(\d+)\s+immobili\b/gi,
    /(\d+)\s+case e appartamenti\b/gi,
    /vedi\s+(\d+)\s+annunci\b/gi,
    /1\s*-\s*\d+\s+di\s+(\d+)\s+annunci\b/gi,
  ]

  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      if (match[1]) found.push(Number(match[1]))
    }
  }

  return [...new Set(found)].filter(Number.isFinite)
}

function cleanTitle(title = '') {
  return compact(title)
    .replace(/^nuovo\s+/i, '')
    .replace(/^premium\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function isGoodTitle(title, href = '') {
  const clean = cleanTitle(title)

  if (!clean) return false
  if (clean.length < 3 || clean.length > 180) return false
  if (!TITLE_RE.test(clean)) return false
  if (BAD_TITLE_RE.test(clean)) return false

  return LISTING_HREF_RE.test(href) || TITLE_RE.test(clean)
}

function normalizePrice(value = '') {
  const match = String(value).match(PRICE_EXACT_RE)
  if (!match) return ''
  return compact(match[1])
    .replace(/\s*\/\s*/g, '/')
    .replace(/\s+/g, ' ')
}

function extractPriceNearTitle(context, title) {
  const text = oneLine(context)
  const titleKey = cleanTitle(title)
  const titleIndex = text.toLowerCase().indexOf(titleKey.toLowerCase())

  if (titleIndex < 0) return normalizePrice(text)

  const before = text.slice(Math.max(0, titleIndex - 220), titleIndex)
  const after = text.slice(titleIndex + titleKey.length, titleIndex + titleKey.length + 220)

  const beforeMatches = [...before.matchAll(new RegExp(PRICE_EXACT_RE, 'gi'))]
  if (beforeMatches.length) {
    return normalizePrice(beforeMatches[beforeMatches.length - 1][0])
  }

  return normalizePrice(after)
}

function extractDetailsNearTitle(context, title) {
  const text = oneLine(context)
  const titleKey = cleanTitle(title)
  const titleIndex = text.toLowerCase().indexOf(titleKey.toLowerCase())
  const window = titleIndex >= 0
    ? text.slice(titleIndex, titleIndex + 420)
    : text.slice(0, 420)

  const details = []

  const patterns = [
    /\b\d+[.,]?\d*\s*(?:m²|m2|mq)\b/i,
    /\b\d+\s*local[ie]\b/i,
    /\b\d+\s*bagn[io]\b/i,
    /\b\d+°\s*piano\b/i,
    /\bpiano terra\b/i,
    /\bprimo piano\b/i,
    /\bsecondo piano\b/i,
    /\bterzo piano\b/i,
    /\bquarto piano\b/i,
    /\bultimo piano\b/i,
    /\bclasse energetica\s+[A-G][+\d]?\b/i,
  ]

  for (const pattern of patterns) {
    const match = window.match(pattern)
    if (match) details.push(compact(match[0]))
  }

  return [...new Set(details)].slice(0, 5).join(', ')
}

function extractLocationFromCasaCard(cardText, title, price) {
  const text = oneLine(cardText)
  const titleIndex = text.toLowerCase().indexOf(cleanTitle(title).toLowerCase())
  if (titleIndex < 0) return ''

  const start = titleIndex + cleanTitle(title).length
  const priceIndex = price ? text.indexOf(price, start) : -1
  const raw = text
    .slice(start, priceIndex > start ? priceIndex : start + 90)
    .replace(/\b(Gold|Silver|Platinum)\b/gi, '')
    .replace(/\b\d+\s*\/\s*\d+\b/g, '')
    .replace(/\bVai alla planimetria\b/gi, '')
    .trim()

  if (!raw || raw.length > 90) return ''
  return compact(raw)
}

function extractFromAnchors(html, portal) {
  const entries = []
  const anchorRe = /<a\b[^>]*href=(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi

  for (const match of html.matchAll(anchorRe)) {
    const index = match.index || 0
    const href = decodeHtml(match[2] || '')
    const title = cleanTitle(htmlToText(match[3] || ''))

    if (!isGoodTitle(title, href)) continue

    const context = html.slice(Math.max(0, index - 900), Math.min(html.length, index + 1400))
    const price = extractPriceNearTitle(context, title)
    const details = extractDetailsNearTitle(context, title)

    entries.push({
      portal: portal.label,
      title,
      location: '',
      price,
      details,
      url: absoluteUrl(href, portal.base),
      source: 'anchor',
    })
  }

  return entries
}

function extractCasaArticles(html, portal, pageUrl) {
  const entries = []
  const articleRe = /<div\b[^>]*role=(["'])article\1[\s\S]*?(?=<div\b[^>]*role=(["'])article\2|<\/body>|$)/gi

  for (const match of html.matchAll(articleRe)) {
    const card = match[0]
    const aria = card.match(/\baria-label=(["'])(.*?)\1/i)
    const title = cleanTitle(aria?.[2] || '')

    if (!isGoodTitle(title, '/immobili/')) continue

    const price = normalizePrice(oneLine(card))
    const details = extractDetailsNearTitle(card, title)
    const location = extractLocationFromCasaCard(card, title, price)

    entries.push({
      portal: portal.label,
      title,
      location,
      price,
      details,
      url: pageUrl,
      source: 'article',
    })
  }

  return entries
}

function dedupeEntries(entries) {
  const out = []
  const seen = new Set()

  for (const entry of entries) {
    const key = normalizeKey([
      entry.portal,
      entry.title,
      entry.price,
      entry.details,
      entry.location,
    ].join(' | '))

    if (seen.has(key)) continue
    seen.add(key)
    out.push(entry)
  }

  return out
}

async function fetchWithNode(url) {
  const response = await fetch(url, {
    headers: {
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'accept-language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
      'cache-control': 'no-cache',
      pragma: 'no-cache',
      'upgrade-insecure-requests': '1',
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    },
  })

  return {
    status: response.status,
    ok: response.ok,
    html: await response.text(),
    method: 'node-fetch',
  }
}

async function fetchWithCurl(url) {
  const { stdout } = await execFileAsync('curl', [
    '-L',
    '--compressed',
    '--http1.1',
    '--max-time',
    '35',
    '-A',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    '-H',
    'accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    '-H',
    'accept-language: it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
    '-H',
    'cache-control: no-cache',
    url,
  ], {
    maxBuffer: 25 * 1024 * 1024,
  })

  return {
    status: 200,
    ok: true,
    html: stdout,
    method: 'curl',
  }
}

async function fetchPage(url, portal) {
  let result = await fetchWithNode(url)
  let text = htmlToText(result.html)
  let entries = dedupeEntries([
    ...extractFromAnchors(result.html, portal),
    ...(portal.id === 'casa-it' ? extractCasaArticles(result.html, portal, url) : []),
  ])

  const shouldRetryWithCurl =
    !result.ok ||
    text.length < 1200 ||
    entries.length === 0 ||
    /captcha|access denied|robot|verifica che sei umano|enable cookies/i.test(text)

  if (shouldRetryWithCurl) {
    try {
      const curlResult = await fetchWithCurl(url)
      const curlText = htmlToText(curlResult.html)
      const curlEntries = dedupeEntries([
        ...extractFromAnchors(curlResult.html, portal),
        ...(portal.id === 'casa-it' ? extractCasaArticles(curlResult.html, portal, url) : []),
      ])

      if (curlEntries.length >= entries.length || curlText.length > text.length) {
        result = curlResult
        text = curlText
        entries = curlEntries
      }
    } catch (error) {
      console.log(`Fallback curl non riuscito per ${url}: ${error.message}`)
    }
  }

  return {
    ...result,
    text,
    entries,
    counts: extractCounts(text),
  }
}

async function readFooterLinks() {
  try {
    const footer = await fs.readFile(FOOTER_FILE, 'utf8')
    const matches = [...footer.matchAll(/label:\s*['"`]([^'"`]+)['"`][\s\S]*?href:\s*['"`]([^'"`]+)['"`]/g)]

    return matches
      .map((match) => ({
        label: match[1],
        href: match[2],
      }))
      .filter((item) => /immobiliare|casa|idealista/i.test(`${item.label} ${item.href}`))
  } catch {
    return []
  }
}

function toCsv(rows) {
  const header = ['portale', 'titolo', 'localita', 'prezzo', 'dettagli', 'url', 'sorgente']
  const escape = (value) => `"${String(value || '').replace(/"/g, '""')}"`
  return [
    header.join(';'),
    ...rows.map((row) => [
      row.portal,
      row.title,
      row.location,
      row.price,
      row.details,
      row.url,
      row.source,
    ].map(escape).join(';')),
  ].join('\n')
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true })

  const footerLinks = await readFooterLinks()
  console.log('\n=== LINK TROVATI NEL FOOTER ===')
  for (const item of footerLinks) {
    console.log(`- ${item.label}: ${item.href}`)
  }

  const allEntries = []
  const summary = []

  for (const portal of PORTALS) {
    console.log(`\n=== ${portal.label.toUpperCase()} ===`)

    const portalEntries = []
    const portalCounts = []

    for (const url of portal.urls) {
      console.log(`Scarico: ${url}`)

      try {
        const page = await fetchPage(url, portal)

        const slug = url
          .replace(/^https?:\/\//, '')
          .replace(/[^\w.-]+/g, '_')
          .replace(/_+$/g, '')

        await fs.writeFile(path.join(OUT_DIR, `${slug}.html`), page.html, 'utf8')
        await fs.writeFile(path.join(OUT_DIR, `${slug}.txt`), page.text, 'utf8')

        portalCounts.push(...page.counts)
        portalEntries.push(...page.entries)

        console.log(`HTTP ${page.status} via ${page.method} - conteggi: ${page.counts.length ? page.counts.join(', ') : 'n/d'} - immobili estratti: ${page.entries.length}`)
      } catch (error) {
        console.log(`ERRORE su ${url}: ${error.message}`)
      }
    }

    const deduped = dedupeEntries(portalEntries)
    const publicCount = portalCounts.length ? Math.max(...portalCounts) : null

    summary.push({
      portal: portal.label,
      publicCount,
      extractedCount: deduped.length,
    })

    allEntries.push(...deduped)
    console.log(`Totale pulito ${portal.label}: ${deduped.length}`)
  }

  const globalMap = new Map()

  for (const entry of allEntries) {
    const key = normalizeKey([
      entry.title,
      entry.location,
      entry.price,
      entry.details,
    ].join(' | '))

    if (!globalMap.has(key)) {
      globalMap.set(key, {
        title: entry.title,
        location: entry.location,
        prices: new Set(),
        details: new Set(),
        portals: new Set(),
        urls: new Set(),
      })
    }

    const item = globalMap.get(key)
    item.portals.add(entry.portal)
    if (entry.price) item.prices.add(entry.price)
    if (entry.details) item.details.add(entry.details)
    if (entry.url) item.urls.add(entry.url)
  }

  const uniqueRows = [...globalMap.values()].sort((a, b) => a.title.localeCompare(b.title, 'it'))

  const md = [
    '# Audit portali Area Immobiliare',
    '',
    `Generato: ${new Date().toLocaleString('it-IT')}`,
    '',
    '## Riepilogo',
    '',
    '| Portale | Conteggio pubblico letto | Immobili estratti dallo script |',
    '|---|---:|---:|',
    ...summary.map((item) => `| ${safeCell(item.portal)} | ${item.publicCount ?? 'n/d'} | ${item.extractedCount} |`),
    '',
    '## Immobili unificati estratti',
    '',
    '| Immobile | Località | Portali | Prezzi letti | Dettagli letti |',
    '|---|---|---|---|---|',
    ...uniqueRows.map((item) => {
      return `| ${safeCell(item.title)} | ${safeCell(item.location)} | ${safeCell([...item.portals].join(', '))} | ${safeCell([...item.prices].join(' / '))} | ${safeCell([...item.details].join(' / '))} |`
    }),
    '',
    '## Nota operativa',
    '',
    '- Immobiliare.it è leggibile via pagina pubblica e produce lo snapshot migliore.',
    '- Casa.it dichiara più annunci, ma via pagina pubblica lo script riesce a leggere in modo affidabile soprattutto la prima pagina.',
    '- Idealista può bloccare la lettura automatica da script locale: per lui resta preferibile feed/API/accesso gestionale.',
    '- Per sincronizzazione perfetta servono feed ufficiali, XML, FTP, API o accesso al gestionale/portale usato dall’agenzia.',
    '',
  ].join('\n')

  const json = {
    generatedAt: new Date().toISOString(),
    summary,
    entries: allEntries,
    unique: uniqueRows.map((item) => ({
      title: item.title,
      location: item.location,
      portals: [...item.portals],
      prices: [...item.prices],
      details: [...item.details],
      urls: [...item.urls],
    })),
  }

  await fs.writeFile(path.join(OUT_DIR, 'area-portali-audit.md'), md, 'utf8')
  await fs.writeFile(path.join(OUT_DIR, 'area-portali-audit.json'), JSON.stringify(json, null, 2), 'utf8')
  await fs.writeFile(path.join(OUT_DIR, 'area-portali-audit.csv'), toCsv(allEntries), 'utf8')

  console.log('\n=== FILE CREATI ===')
  console.log('tmp/area-portali-audit/area-portali-audit.md')
  console.log('tmp/area-portali-audit/area-portali-audit.json')
  console.log('tmp/area-portali-audit/area-portali-audit.csv')

  console.log('\n=== ANTEPRIMA ===')
  console.log(md.split('\n').slice(0, 140).join('\n'))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
