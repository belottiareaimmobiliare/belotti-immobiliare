import fs from 'node:fs/promises'
import path from 'node:path'

const ROOT = process.cwd()
const OUT_DIR = path.join(ROOT, 'tmp', 'area-portali-audit')
const PLAN_JSON = path.join(OUT_DIR, 'piano-import-immobili-portali.json')
const REPORT_MD = path.join(OUT_DIR, 'descrizioni-browser-portali-per-ref.md')
const REPORT_JSON = path.join(OUT_DIR, 'descrizioni-browser-portali-per-ref.json')
const DETAIL_URLS_JSON = path.join(OUT_DIR, 'descrizioni-portali-dettaglio-per-ref.json')

function compact(value = '') {
  return String(value || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function pick(row, keys, fallback = '') {
  for (const key of keys) {
    if (row?.[key] !== undefined && row?.[key] !== null && compact(row[key]) !== '') return row[key]
  }
  return fallback
}

function safeCell(value = '') {
  return compact(value).replace(/\|/g, '/').slice(0, 260)
}

function decodeEntities(value = '') {
  return String(value || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#34;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#x27;/gi, "'")
}

function normalize(value = '') {
  return compact(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function tokens(value = '') {
  const stop = new Set([
    'in', 'via', 'viale', 'piazza', 'largo', 'san', 'santa', 'santo',
    'centro', 'bergamo', 'citta', 'alta', 'stazione', 'studio',
    'ufficio', 'locale', 'commerciale', 'trilocale', 'bilocale',
    'quadrilocale', 'appartamento', 'villa', 'garage', 'box',
    'vendita', 'affitto', 'nuovo', 'ottimo', 'buono', 'stato',
    'piano', 'primo', 'secondo', 'terzo', 'quarto',
  ])

  return normalize(value)
    .split(' ')
    .filter((token) => token.length >= 4 && !stop.has(token))
}

function titleScore(a = '', b = '') {
  const ta = new Set(tokens(a))
  const tb = new Set(tokens(b))
  if (!ta.size || !tb.size) return 0

  let hit = 0
  for (const token of ta) {
    if (tb.has(token)) hit += 1
  }

  return hit / Math.max(ta.size, 1)
}

function priceKey(value = '') {
  const raw = compact(value)
  const nums = raw.match(/\d[\d.\s]*/g)
  if (!nums) return ''
  return nums.join('').replace(/\D/g, '')
}

function normalizeContract(contract = '') {
  const c = compact(contract).toLowerCase()
  if (c.includes('affitto') || c.includes('locazione') || c.includes('rent')) return 'affitto'
  if (c.includes('vendita') || c.includes('sale')) return 'vendita'
  return c || 'non chiaro'
}


function collectObjects(value, out = []) {
  if (!value) return out

  if (Array.isArray(value)) {
    for (const item of value) collectObjects(item, out)
    return out
  }

  if (typeof value === 'object') {
    out.push(value)
    for (const child of Object.values(value)) collectObjects(child, out)
  }

  return out
}

async function loadFallbackUrlMap() {
  const map = new Map()

  try {
    const raw = await fs.readFile(DETAIL_URLS_JSON, 'utf8')
    const json = JSON.parse(raw)
    const objects = collectObjects(json)

    for (const obj of objects) {
      const ref = compact(pick(obj, [
        'reference_code',
        'referenceCode',
        'ref',
        'REF',
      ], ''))

      const url = compact(pick(obj, [
        'url',
        'source_url',
        'sourceUrl',
        'portal_url',
        'portalUrl',
        'annuncio_url',
        'annuncioUrl',
      ], ''))

      if (ref && /^https?:\/\//i.test(url)) {
        map.set(ref, url)
      }
    }
  } catch {
    // Nessun fallback disponibile: lo script continuerà e segnalerà NO_URL.
  }

  return map
}

function getRowUrl(row) {
  return compact(pick(row, [
    'url',
    'source_url',
    'sourceUrl',
    'portal_url',
    'portalUrl',
    'annuncio_url',
    'annuncioUrl',
  ], ''))
}

function shouldAnalyze(row) {
  const action = compact(pick(row, ['action', 'azione'], ''))
  const contract = normalizeContract(pick(row, ['contract_type', 'contractType', 'contract', 'contratto'], ''))
  return action === 'CREARE DRAFT' && ['vendita', 'affitto'].includes(contract)
}

function cleanDescription(value = '') {
  let text = decodeEntities(value)

  text = text
    .replace(/\s+/g, ' ')
    .replace(/\bEspandi\b/gi, ' ')
    .replace(/\bContatta\b/gi, ' ')
    .replace(/\bSalva\b/gi, ' ')
    .replace(/\bChiama\b/gi, ' ')
    .replace(/\bInvia\b/gi, ' ')
    .replace(/\bTi interessa\?\b/gi, ' ')
    .replace(/\bAREA IMMOBILIARE SAS DI BELOTTI G\.?/gi, ' ')
    .replace(/\bArea Immobiliare S\.a\.s\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return text
}

function looksBad(text = '') {
  const value = compact(text)
  if (!value) return true
  if (value.length < 80) return true

  const bad = [
    /"urls"\s*:/i,
    /"caption"\s*:/i,
    /"uuid"\s*:/i,
    /"realEstate"\s*:/i,
    /pwm\.im-cdn\.it/i,
    /pic\.im-cdn\.it/i,
    /annunci residenziali di affitto e vendita/i,
    /pubblicati da di Bergamo/i,
    /privacy policy/i,
    /cookie/i,
    /javascript/i,
    /access denied/i,
    /forbidden/i,
    /captcha/i,
    /cloudflare/i,
  ]

  return bad.some((regex) => regex.test(value))
}

function scoreCandidate({ description, title, price, pageTitle, h1, url }) {
  const clean = compact(description)
  if (looksBad(clean)) return -100

  let score = 0

  const pageMatch = Math.max(
    titleScore(title, pageTitle),
    titleScore(title, h1),
  )

  const descMatch = titleScore(title, clean)
  const p = priceKey(price)
  const priceHit = p && clean.replace(/\D/g, '').includes(p)

  if (clean.length >= 150) score += 25
  if (clean.length >= 300) score += 20
  if (clean.length >= 600) score += 10

  score += Math.round(pageMatch * 40)
  score += Math.round(descMatch * 20)

  if (priceHit) score += 10
  if (/immobiliare\.it|casa\.it|idealista\.it/i.test(url)) score += 5

  if (pageMatch < 0.35 && descMatch < 0.35 && !priceHit) return -50

  return score
}

async function getPlaywright() {
  try {
    return await import('playwright')
  } catch {
    console.error('')
    console.error('Playwright non è installato.')
    console.error('Esegui prima: npm i -D playwright && npx playwright install chromium')
    console.error('')
    process.exit(1)
  }
}

async function safeText(page, selector) {
  try {
    const loc = page.locator(selector).first()
    if (await loc.count()) return compact(await loc.innerText({ timeout: 2500 }))
  } catch {}
  return ''
}

async function collectJsonLd(page) {
  try {
    return await page.$$eval('script[type="application/ld+json"]', (nodes) => {
      const out = []

      function walk(value) {
        if (!value) return
        if (typeof value === 'string') return

        if (Array.isArray(value)) {
          value.forEach(walk)
          return
        }

        if (typeof value === 'object') {
          if (typeof value.description === 'string') out.push(value.description)
          Object.values(value).forEach(walk)
        }
      }

      for (const node of nodes) {
        try {
          walk(JSON.parse(node.textContent || ''))
        } catch {}
      }

      return out
    })
  } catch {
    return []
  }
}

async function analyzePage(page, row) {
  const title = row.title
  const price = row.price
  const url = row.url

  const result = {
    reference_code: row.reference_code,
    title,
    price,
    url,
    status: 'MISSING',
    score: -100,
    pageTitle: '',
    h1: '',
    description: '',
    source: '',
    error: '',
  }

  if (!url) {
    result.status = 'NO_URL'
    result.error = 'URL dettaglio assente nel piano import'
    return result
  }

  try {
    const response = await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 45000,
    })

    await page.waitForTimeout(2500)

    const status = response?.status?.() || 0
    const pageTitle = compact(await page.title().catch(() => ''))
    const h1 = await safeText(page, 'h1')

    result.pageTitle = pageTitle
    result.h1 = h1

    if (status >= 400) {
      result.status = 'FETCH_FAIL'
      result.error = `HTTP ${status}`
      return result
    }

    const candidates = []

    const jsonLdDescriptions = await collectJsonLd(page)
    for (const text of jsonLdDescriptions) {
      candidates.push({
        source: 'json-ld',
        description: cleanDescription(text),
      })
    }

    const metaDescription = await page
      .$eval('meta[name="description"]', (el) => el.getAttribute('content') || '')
      .catch(() => '')

    const ogDescription = await page
      .$eval('meta[property="og:description"]', (el) => el.getAttribute('content') || '')
      .catch(() => '')

    if (metaDescription) candidates.push({ source: 'meta-description', description: cleanDescription(metaDescription) })
    if (ogDescription) candidates.push({ source: 'og-description', description: cleanDescription(ogDescription) })

    const selectors = [
      '[data-cy="adPageAdDescription"]',
      '[data-testid="description"]',
      '[data-testid="real-estate-description"]',
      'section:has-text("Descrizione")',
      'div[class*="description"]',
      'div[class*="Description"]',
      'article',
      'main',
    ]

    for (const selector of selectors) {
      const text = await safeText(page, selector)
      if (text) {
        let cleaned = cleanDescription(text)

        const descIndex = cleaned.toLowerCase().indexOf('descrizione')
        if (descIndex >= 0) cleaned = cleaned.slice(descIndex).replace(/^descrizione\s*/i, '').trim()

        const cutMarkers = [
          'Caratteristiche',
          'Prezzo',
          'Mappa',
          'Annunci simili',
          'Mutuo',
          'Calcola rata',
        ]

        for (const marker of cutMarkers) {
          const idx = cleaned.indexOf(marker)
          if (idx > 120) cleaned = cleaned.slice(0, idx).trim()
        }

        candidates.push({
          source: `selector:${selector}`,
          description: cleaned,
        })
      }
    }

    const ranked = candidates
      .map((candidate) => ({
        ...candidate,
        description: cleanDescription(candidate.description),
        score: scoreCandidate({
          description: candidate.description,
          title,
          price,
          pageTitle,
          h1,
          url,
        }),
      }))
      .filter((candidate) => candidate.score > -100)
      .sort((a, b) => b.score - a.score || b.description.length - a.description.length)

    const best = ranked[0]

    if (!best) {
      result.status = 'MISSING'
      result.error = 'Nessuna descrizione pulita trovata'
      return result
    }

    result.score = best.score
    result.source = best.source
    result.description = best.description

    if (best.score >= 70) result.status = 'OK'
    else if (best.score >= 35) result.status = 'REVIEW'
    else result.status = 'REJECT'

    return result
  } catch (error) {
    result.status = 'FETCH_FAIL'
    result.error = error.message
    return result
  }
}

async function main() {
  const { chromium } = await getPlaywright()

  const plan = JSON.parse(await fs.readFile(PLAN_JSON, 'utf8'))
  const planRows = Array.isArray(plan.importRows) ? plan.importRows : []

  const fallbackUrlMap = await loadFallbackUrlMap()

  const rows = planRows
    .filter(shouldAnalyze)
    .map((row) => {
      const reference_code = compact(pick(row, ['reference_code', 'referenceCode', 'ref'], ''))

      return {
        original: row,
        reference_code,
        title: compact(pick(row, ['title', 'immobile'], '')),
        price: compact(pick(row, ['price', 'prezzo', 'price_label', 'priceLabel'], '')),
        url: getRowUrl(row) || fallbackUrlMap.get(reference_code) || '',
      }
    })
    .filter((row) => row.reference_code && row.title)

  console.log('=== AUDIT DESCRIZIONI DA BROWSER ===')
  console.log(`Immobili da analizzare: ${rows.length}`)
  console.log('Non scrive nulla in Supabase.')
  console.log('')

  const browser = await chromium.launch({
    headless: true,
  })

  const context = await browser.newContext({
    locale: 'it-IT',
    viewport: { width: 1440, height: 1200 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  })

  const page = await context.newPage()
  const results = []

  for (const row of rows) {
    const result = await analyzePage(page, row)
    results.push(result)
    console.log(`${result.status} ${row.reference_code} | score ${result.score} | ${row.title}${result.error ? ` | ${result.error}` : ''}`)
  }

  await browser.close()

  const counts = {
    analyzed: results.length,
    ok: results.filter((row) => row.status === 'OK').length,
    review: results.filter((row) => row.status === 'REVIEW').length,
    reject: results.filter((row) => row.status === 'REJECT').length,
    missing: results.filter((row) => row.status === 'MISSING').length,
    fetchFail: results.filter((row) => row.status === 'FETCH_FAIL').length,
    noUrl: results.filter((row) => row.status === 'NO_URL').length,
  }

  const md = [
    '# Descrizioni reali da browser portali',
    '',
    `Generato: ${new Date().toLocaleString('it-IT')}`,
    '',
    '## Riepilogo',
    '',
    `- Immobili analizzati: **${counts.analyzed}**`,
    `- OK: **${counts.ok}**`,
    `- REVIEW: **${counts.review}**`,
    `- REJECT: **${counts.reject}**`,
    `- MISSING: **${counts.missing}**`,
    `- FETCH_FAIL: **${counts.fetchFail}**`,
    `- NO_URL: **${counts.noUrl}**`,
    '',
    '## Tabella compatta',
    '',
    '| REF | Stato | Score | Fonte | Immobile | Anteprima descrizione / errore |',
    '|---|---|---:|---|---|---|',
    ...results.map((row) => `| ${safeCell(row.reference_code)} | ${row.status} | ${row.score} | ${safeCell(row.source || '-')} | ${safeCell(row.title)} | ${safeCell(row.description || row.error || '-')} |`),
    '',
    '## Descrizioni trovate',
    '',
    ...results.map((row) => [
      `### ${row.reference_code} — ${row.title}`,
      '',
      `Stato: ${row.status}`,
      '',
      `Score: ${row.score}`,
      '',
      `URL: ${row.url || '-'}`,
      '',
      `Titolo pagina: ${row.pageTitle || '-'}`,
      '',
      `H1: ${row.h1 || '-'}`,
      '',
      `Fonte: ${row.source || '-'}`,
      '',
      row.error ? `Errore: ${row.error}\n` : '',
      '```',
      row.description || 'Descrizione non trovata.',
      '```',
      '',
    ].join('\n')),
    '',
    '## Nota',
    '',
    'Questo audit usa un browser locale e non aggiorna il database. Applicheremo solo eventuali descrizioni OK dopo controllo del report.',
    '',
  ].join('\n')

  await fs.writeFile(REPORT_MD, md, 'utf8')
  await fs.writeFile(REPORT_JSON, JSON.stringify({
    generatedAt: new Date().toISOString(),
    counts,
    rows: results,
  }, null, 2), 'utf8')

  console.log('')
  console.log('=== REPORT CREATO ===')
  console.log('tmp/area-portali-audit/descrizioni-browser-portali-per-ref.md')
  console.log('tmp/area-portali-audit/descrizioni-browser-portali-per-ref.json')
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
