import fs from 'node:fs/promises'
import path from 'node:path'

const ROOT = process.cwd()
const OUT_DIR = path.join(ROOT, 'tmp', 'area-portali-audit')
const FOOTER_FILE = path.join(ROOT, 'src', 'components', 'public', 'Footer.tsx')

const DEFAULT_PORTALS = [
  {
    id: 'immobiliare-it',
    label: 'immobiliare.it',
    urls: [
      'https://www.immobiliare.it/agenzie-immobiliari/23950/area-bergamo/',
      'https://www.immobiliare.it/agenzie-immobiliari/23950/area-bergamo/?pag=2',
    ],
  },
  {
    id: 'casa-it',
    label: 'casa.it',
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
    urls: [
      'https://www.idealista.it/pro/area-immobiliare-bergamo/',
    ],
  },
]

function decodeHtml(value) {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&euro;/g, '€')
    .replace(/&#8364;/g, '€')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&agrave;/g, 'à')
    .replace(/&egrave;/g, 'è')
    .replace(/&eacute;/g, 'é')
    .replace(/&igrave;/g, 'ì')
    .replace(/&ograve;/g, 'ò')
    .replace(/&ugrave;/g, 'ù')
}

function htmlToText(html) {
  return decodeHtml(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, '\n')
      .replace(/<style[\s\S]*?<\/style>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(a|p|div|li|h1|h2|h3|h4|article|section|header|footer|span)>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\r/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n[ \t]+/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  )
}

function compact(value) {
  return value.replace(/\s+/g, ' ').trim()
}

function safeCell(value) {
  return compact(String(value || '')).replace(/\|/g, '/')
}

function normalizeKey(value) {
  return compact(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

function extractCounts(text) {
  const patterns = [
    /(\d+)\s+annunci\b/i,
    /(\d+)\s+risultati\b/i,
    /(\d+)\s+immobili\b/i,
    /(\d+)\s+case e appartamenti\b/i,
    /vedi\s+(\d+)\s+annunci\b/i,
    /(\d+)\s*-\s*\d+\s+di\s+(\d+)\s+annunci\b/i,
  ]

  const found = []
  for (const pattern of patterns) {
    for (const match of text.matchAll(new RegExp(pattern, 'gi'))) {
      const value = match[2] || match[1]
      if (value) found.push(Number(value))
    }
  }

  return [...new Set(found)].filter(Number.isFinite)
}

function extractEntries(text, portalLabel, url) {
  const lines = text
    .split('\n')
    .map(compact)
    .filter(Boolean)
    .filter((line) => line.length >= 3)

  const titleRe = /\b(appartamento|bilocale|trilocale|quadrilocale|villa|villetta|ufficio|studio|locale commerciale|negozio|rustico|casale|cascina|box|garage|posto auto|terreno|casa colonica)\b/i
  const badRe = /\b(area immobiliare|privacy|cookie|pubblica|accedi|contatta|chiama|salva|servizi|agenzie|prezzi immobili|valuta casa|sito web|menu|facebook|instagram|youtube|linkedin|telegram|copyright|condizioni generali|come ordiniamo|vedi sulla mappa|filtra|rilevanza)\b/i
  const priceRe = /(€|euro|prezzo su richiesta|trattativa riservata|\b\d{1,3}(?:\.\d{3})+\s*€|\b\d{3,}\s*€)/i
  const detailRe = /(\bmq\b|\bm²\b|\bm2\b|\blocal[ie]\b|\bbagn[io]\b|\bpiano\b|\bascensore\b|\bbox\b|\bclasse\b)/i

  const entries = []
  const seen = new Set()

  for (let i = 0; i < lines.length; i += 1) {
    const title = lines[i]

    if (!titleRe.test(title)) continue
    if (badRe.test(title)) continue
    if (title.length > 160) continue

    const around = lines.slice(Math.max(0, i - 4), Math.min(lines.length, i + 9))
    const price = around.find((line) => priceRe.test(line)) || ''
    const details = around.find((line) => detailRe.test(line) && line !== title) || ''

    const key = normalizeKey(`${portalLabel} ${title}`)
    if (seen.has(key)) continue
    seen.add(key)

    entries.push({
      portal: portalLabel,
      title,
      price,
      details,
      url,
    })
  }

  return entries
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

async function fetchPage(url) {
  const response = await fetch(url, {
    headers: {
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'accept-language': 'it-IT,it;q=0.9,en;q=0.6',
      'cache-control': 'no-cache',
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
    },
  })

  const html = await response.text()

  return {
    ok: response.ok,
    status: response.status,
    html,
    text: htmlToText(html),
  }
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true })

  const footerLinks = await readFooterLinks()
  const allEntries = []
  const summary = []

  console.log('\n=== LINK TROVATI NEL FOOTER ===')
  if (footerLinks.length) {
    for (const item of footerLinks) {
      console.log(`- ${item.label}: ${item.href}`)
    }
  } else {
    console.log('- Nessun link portale trovato nel footer, uso fallback noti.')
  }

  for (const portal of DEFAULT_PORTALS) {
    const portalEntries = []
    const portalCounts = []

    console.log(`\n=== ${portal.label.toUpperCase()} ===`)

    for (const url of portal.urls) {
      try {
        console.log(`Scarico: ${url}`)
        const page = await fetchPage(url)

        const slug = url
          .replace(/^https?:\/\//, '')
          .replace(/[^\w.-]+/g, '_')
          .replace(/_+$/g, '')

        await fs.writeFile(path.join(OUT_DIR, `${slug}.html`), page.html, 'utf8')
        await fs.writeFile(path.join(OUT_DIR, `${slug}.txt`), page.text, 'utf8')

        const counts = extractCounts(page.text)
        portalCounts.push(...counts)

        const entries = extractEntries(page.text, portal.label, url)
        portalEntries.push(...entries)

        console.log(`HTTP ${page.status} - conteggi letti: ${counts.length ? counts.join(', ') : 'n/d'} - righe immobili: ${entries.length}`)
      } catch (error) {
        console.log(`ERRORE su ${url}: ${error.message}`)
      }
    }

    const deduped = []
    const seen = new Set()

    for (const entry of portalEntries) {
      const key = normalizeKey(entry.title)
      if (seen.has(key)) continue
      seen.add(key)
      deduped.push(entry)
    }

    allEntries.push(...deduped)

    const maxCount = portalCounts.length ? Math.max(...portalCounts) : null
    summary.push({
      portal: portal.label,
      publicCount: maxCount,
      extractedCount: deduped.length,
    })

    console.log(`Totale estratto ${portal.label}: ${deduped.length}`)
  }

  const globalSeen = new Map()
  for (const entry of allEntries) {
    const key = normalizeKey(entry.title)
    if (!globalSeen.has(key)) {
      globalSeen.set(key, {
        title: entry.title,
        portals: new Set(),
        prices: new Set(),
        details: new Set(),
      })
    }

    const item = globalSeen.get(key)
    item.portals.add(entry.portal)
    if (entry.price) item.prices.add(entry.price)
    if (entry.details) item.details.add(entry.details)
  }

  const uniqueRows = [...globalSeen.values()].sort((a, b) => a.title.localeCompare(b.title, 'it'))

  const md = [
    '# Audit portali Area Immobiliare',
    '',
    `Generato: ${new Date().toLocaleString('it-IT')}`,
    '',
    '## Riepilogo',
    '',
    '| Portale | Conteggio pubblico letto | Righe immobili estratte dallo script |',
    '|---|---:|---:|',
    ...summary.map((item) => `| ${safeCell(item.portal)} | ${item.publicCount ?? 'n/d'} | ${item.extractedCount} |`),
    '',
    '## Immobili unificati estratti',
    '',
    '| Immobile | Portali | Prezzi letti | Dettagli letti |',
    '|---|---|---|---|',
    ...uniqueRows.map((item) => {
      return `| ${safeCell(item.title)} | ${safeCell([...item.portals].join(', '))} | ${safeCell([...item.prices].join(' / '))} | ${safeCell([...item.details].join(' / '))} |`
    }),
    '',
    '## Nota',
    '',
    'Questo audit usa solo pagine pubbliche. Per una sincronizzazione perfetta servono feed ufficiali, export XML, FTP/API o accesso al gestionale/portale usato dall’agenzia.',
    '',
  ].join('\n')

  const json = {
    generatedAt: new Date().toISOString(),
    summary,
    entries: allEntries,
    unique: uniqueRows.map((item) => ({
      title: item.title,
      portals: [...item.portals],
      prices: [...item.prices],
      details: [...item.details],
    })),
  }

  await fs.writeFile(path.join(OUT_DIR, 'area-portali-audit.md'), md, 'utf8')
  await fs.writeFile(path.join(OUT_DIR, 'area-portali-audit.json'), JSON.stringify(json, null, 2), 'utf8')

  console.log('\n=== FILE CREATI ===')
  console.log('tmp/area-portali-audit/area-portali-audit.md')
  console.log('tmp/area-portali-audit/area-portali-audit.json')
  console.log('\n=== ANTEPRIMA ===')
  console.log(md.split('\n').slice(0, 80).join('\n'))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
