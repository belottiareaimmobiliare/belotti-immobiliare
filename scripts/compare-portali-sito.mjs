import fs from 'node:fs/promises'
import path from 'node:path'

const ROOT = process.cwd()
const OUT_DIR = path.join(ROOT, 'tmp', 'area-portali-audit')
const AUDIT_JSON = path.join(OUT_DIR, 'area-portali-audit.json')
const OUT_MD = path.join(OUT_DIR, 'confronto-portali-sito.md')
const OUT_JSON = path.join(OUT_DIR, 'confronto-portali-sito.json')

const STOP = new Set([
  'appartamento', 'bilocale', 'trilocale', 'quadrilocale', 'pentalocale',
  'villa', 'villetta', 'ufficio', 'studio', 'locale', 'commerciale',
  'negozio', 'garage', 'box', 'terreno', 'rustico', 'casale', 'cascina',
  'casa', 'colonica', 'vendita', 'vendesi', 'affitto', 'affittasi',
  'locazione', 'nuovo', 'nuova', 'ottimo', 'buono', 'stato',
  'ristrutturato', 'ristrutturata', 'piano', 'terra', 'primo', 'secondo',
  'terzo', 'quarto', 'ultimo', 'centro', 'bergamo', 'san', 'santa',
  'santo', 'via', 'viale', 'piazza', 'largo', 'vicolo', 'zona', 'classe',
  'energetica', 'con', 'senza', 'mq', 'm2', 'm²', 'locali', 'bagni',
  'camera', 'camere', 'alta', 'bassa', 'del', 'della', 'dello', 'dei',
  'degli', 'delle', 'di', 'da', 'in', 'giovanni', 'luigi', 'battista',
  'papa'
])

const IMPORTANT_PHRASES = [
  'conca fiorita',
  'piazza angelini',
  'vittorio emanuele',
  'guglielmo d alzano',
  'giovanni battista rampinelli',
  'rampinelli',
  'san giorgio',
  'san bernardino',
  'torquato tasso',
  'daste spalenga',
  'giulio cesare',
  'via roma',
  'porta nuova',
  'bottanuco',
  'strozza',
  'bianzano',
  'bedulita',
  'redona',
  'corridoni',
  'finardi',
  'valtesse',
  'canovine',
  'colli',
  'loreto',
  'gorle',
  'treviolo',
  'masone',
  'garibaldi',
  'paglia',
  'pitentino',
  'quarenghi',
  'palazzolo'
]

function compact(value = '') {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function safeCell(value = '') {
  return compact(value).replace(/\|/g, '/')
}

function stripAccents(value = '') {
  return compact(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function normalize(value = '') {
  return stripAccents(value)
    .toLowerCase()
    .replace(/[’']/g, ' ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokenList(value = '') {
  return normalize(value).split(' ').filter((token) => token.length >= 3)
}

function significantTokens(value = '') {
  return tokenList(value)
    .filter((token) => !STOP.has(token))
    .filter((token) => !/^\d+$/.test(token) || token.length >= 3)
}

function intersection(a, b) {
  const bSet = new Set(b)
  return [...new Set(a)].filter((token) => bSet.has(token))
}

function parsePrice(value) {
  const text = compact(value)
  if (!text || /richiesta|riservata/i.test(text)) return null
  const match = text.match(/(\d{1,3}(?:\.\d{3})+|\d{4,}|\d{1,3})(?:,\d+)?/)
  if (!match) return null
  return Number(match[1].replace(/\./g, ''))
}

function pricesCompatible(portalPrice, sitePrice) {
  const p = parsePrice(portalPrice)
  const s = Number(sitePrice || 0)
  if (!p || !s) return true
  const diff = Math.abs(p - s)
  const tolerance = Math.max(5000, Math.round(s * 0.04))
  return diff <= tolerance
}

function hasExplicitPrice(value) {
  return parsePrice(value) !== null
}

function euro(value) {
  if (value === null || value === undefined || value === '') return ''
  const number = Number(value)
  if (!Number.isFinite(number) || number <= 0) return ''
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(number)
}

function inferDealFromText(text, priceText) {
  const norm = normalize(`${text} ${priceText}`)
  const price = parsePrice(priceText)

  if (/\bmese\b|affitto|affittasi|locazione/.test(norm)) return 'affitto'
  if (/\bvendesi\b|\bvendita\b|\bin vendita\b/.test(norm)) return 'vendita'
  if (price && price < 10000) return 'affitto'
  if (price && price >= 10000) return 'vendita'
  return 'non chiaro'
}

function dealsCompatible(portalDeal, siteDeal) {
  if (portalDeal === 'non chiaro' || siteDeal === 'non chiaro') return true
  return portalDeal === siteDeal
}

function loadEnvText(text) {
  const out = {}
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const index = line.indexOf('=')
    if (index < 0) continue
    const key = line.slice(0, index).trim()
    const value = line.slice(index + 1).trim().replace(/^['"]|['"]$/g, '')
    out[key] = value
  }
  return out
}

async function loadEnv() {
  const files = ['.env.local', '.env', '.env.development.local', '.env.production.local']
  const env = { ...process.env }

  for (const file of files) {
    try {
      const text = await fs.readFile(path.join(ROOT, file), 'utf8')
      Object.assign(env, loadEnvText(text))
    } catch {}
  }

  return env
}

async function fetchSiteProperties() {
  const env = await loadEnv()

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL
  const supabaseKey =
    env.SUPABASE_SERVICE_ROLE_KEY ||
    env.SUPABASE_SERVICE_KEY ||
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Variabili Supabase mancanti.')
  }

  const select = [
    'id', 'title', 'slug', 'reference_code', 'price', 'city', 'area',
    'address', 'comune', 'frazione', 'status', 'contract_type',
    'property_type', 'created_at', 'updated_at'
  ].join(',')

  const url = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/properties?select=${encodeURIComponent(select)}&order=updated_at.desc.nullslast`

  const response = await fetch(url, {
    headers: {
      apikey: supabaseKey,
      authorization: `Bearer ${supabaseKey}`,
      accept: 'application/json',
    },
  })

  const text = await response.text()

  if (!response.ok) {
    throw new Error(`Errore Supabase ${response.status}: ${text.slice(0, 500)}`)
  }

  return JSON.parse(text)
}

function cleanPortalTitle(title = '') {
  const t = compact(title)
  if (/^(villa|trilocale|bilocale|quadrilocale|appartamento|ufficio|locale commerciale)$/i.test(t)) {
    return ''
  }
  return t
}

function portalText(item) {
  return compact([
    item.title,
    item.location,
    Array.isArray(item.details) ? item.details.join(' ') : item.details,
    Array.isArray(item.portals) ? item.portals.join(' ') : '',
  ].join(' '))
}

function siteText(item) {
  return compact([
    item.reference_code,
    item.title,
    item.slug,
    item.city,
    item.comune,
    item.area,
    item.frazione,
    item.address,
    item.contract_type,
    item.property_type,
  ].join(' '))
}

function phraseBonus(portalNorm, siteNorm) {
  let score = 0
  const reasons = []

  for (const phrase of IMPORTANT_PHRASES) {
    if (portalNorm.includes(phrase) && siteNorm.includes(phrase)) {
      score += phrase.split(' ').length >= 2 ? 0.28 : 0.18
      reasons.push(phrase)
    }
  }

  return {
    score: Math.min(score, 0.42),
    reasons,
  }
}

function matchScore(portal, site) {
  const pText = portalText(portal)
  const sText = siteText(site)

  const pNorm = normalize(pText)
  const sNorm = normalize(sText)

  const pTokens = significantTokens(pText)
  const sTokens = significantTokens(sText)
  const matchedTokens = intersection(pTokens, sTokens)

  const pSet = new Set(pTokens)
  const sSet = new Set(sTokens)
  const minSize = Math.min(pSet.size, sSet.size)
  const unionSize = new Set([...pSet, ...sSet]).size

  const coverage = minSize ? matchedTokens.length / minSize : 0
  const jaccard = unionSize ? matchedTokens.length / unionSize : 0
  const phrase = phraseBonus(pNorm, sNorm)

  let score = 0
  const reasons = []

  if (matchedTokens.length > 0) {
    score += coverage * 0.5
    score += jaccard * 0.22
    reasons.push(`token: ${matchedTokens.slice(0, 5).join(', ')}`)
  }

  if (matchedTokens.length >= 2) score += 0.12
  if (matchedTokens.length >= 3) score += 0.08

  if (phrase.score > 0) {
    score += phrase.score
    reasons.push(`frase: ${phrase.reasons.slice(0, 3).join(', ')}`)
  }

  const portalPrice = Array.isArray(portal.prices) ? portal.prices[0] : ''
  const priceOk = pricesCompatible(portalPrice, site.price)

  if (hasExplicitPrice(portalPrice) && priceOk && (matchedTokens.length > 0 || phrase.score > 0)) {
    score += 0.14
    reasons.push('prezzo compatibile')
  }

  if (pNorm && sNorm.includes(pNorm) && pNorm.length >= 10) {
    score += 0.18
    reasons.push('titolo incluso')
  }

  if (!matchedTokens.length && !phrase.score) {
    score = 0
    reasons.length = 0
  }

  return {
    score: Math.min(Number(score.toFixed(3)), 1),
    reasons,
    priceOk,
  }
}

function bestMatchFor(portal, siteProperties) {
  let best = null

  for (const site of siteProperties) {
    const result = matchScore(portal, site)
    if (!best || result.score > best.score) {
      best = {
        site,
        score: result.score,
        reasons: result.reasons,
        priceOk: result.priceOk,
      }
    }
  }

  return best
}

function portalGroupKey(item) {
  const text = normalize(portalText(item))
  const price = parsePrice(Array.isArray(item.prices) ? item.prices.join(' ') : '')
  const deal = inferDealFromText(portalText(item), Array.isArray(item.prices) ? item.prices.join(' ') : '')

  let phrase = ''
  for (const p of IMPORTANT_PHRASES) {
    if (text.includes(p)) {
      phrase = p
      break
    }
  }

  const core = phrase || significantTokens(portalText(item)).slice(0, 5).join('-')
  const priceKey = price ? String(price) : 'no-price'
  return `${deal}|${core}|${priceKey}`
}

function mergePortalItems(items) {
  const map = new Map()

  for (const raw of items) {
    const title = cleanPortalTitle(raw.title)
    if (!title) continue

    const item = {
      ...raw,
      title,
      portals: Array.isArray(raw.portals) ? raw.portals : [],
      prices: Array.isArray(raw.prices) ? raw.prices : [],
      details: Array.isArray(raw.details) ? raw.details : [],
    }

    const key = portalGroupKey(item)

    if (!map.has(key)) {
      map.set(key, {
        ...item,
        titles: new Set([item.title]),
        portalsSet: new Set(item.portals),
        pricesSet: new Set(item.prices),
        detailsSet: new Set(item.details),
      })
      continue
    }

    const current = map.get(key)
    current.titles.add(item.title)
    item.portals.forEach((p) => current.portalsSet.add(p))
    item.prices.forEach((p) => current.pricesSet.add(p))
    item.details.forEach((d) => current.detailsSet.add(d))

    if (item.title.length > current.title.length) {
      current.title = item.title
    }

    if (!current.location && item.location) {
      current.location = item.location
    }
  }

  return [...map.values()].map((item) => ({
    ...item,
    portals: [...item.portalsSet],
    prices: [...item.pricesSet],
    details: [...item.detailsSet],
    mergedTitles: [...item.titles],
  }))
}

function makeRow(portal, best) {
  const portalPrice = Array.isArray(portal.prices) ? portal.prices.join(' / ') : ''
  const portalDeal = inferDealFromText(portalText(portal), portalPrice)
  const siteDeal = best?.site ? inferDealFromText(siteText(best.site), String(best.site.price || '')) : 'non chiaro'

  return {
    portalTitle: portal.title,
    portalPortals: (portal.portals || []).join(', '),
    portalPrice,
    portalDeal,
    siteTitle: best?.site?.title || '',
    siteStatus: best?.site?.status || '',
    sitePrice: euro(best?.site?.price),
    siteDeal,
    score: best ? best.score : 0,
    reason: best?.reasons?.join(' + ') || '',
    priceOk: best?.priceOk ?? true,
    siteSlug: best?.site?.slug || '',
    siteId: best?.site?.id || '',
  }
}

async function main() {
  const audit = JSON.parse(await fs.readFile(AUDIT_JSON, 'utf8'))
  const siteProperties = await fetchSiteProperties()
  const portalItems = mergePortalItems(audit.unique || [])

  const matched = []
  const review = []
  const missing = []
  const contractConflicts = []
  const usedSiteIds = new Set()

  for (const portal of portalItems) {
    const best = bestMatchFor(portal, siteProperties)
    const row = makeRow(portal, best)

    const dealOk = dealsCompatible(row.portalDeal, row.siteDeal)
    const priceHasProblem = hasExplicitPrice(row.portalPrice) && row.sitePrice && !row.priceOk

    if (best && best.score >= 0.5 && !dealOk) {
      contractConflicts.push(row)
      continue
    }

    if (best && best.score >= 0.62 && dealOk && !priceHasProblem) {
      matched.push(row)
      usedSiteIds.add(best.site.id)
      continue
    }

    if (best && best.score >= 0.38 && dealOk) {
      review.push(row)
      continue
    }

    missing.push({
      ...row,
      siteTitle: best && best.score >= 0.25 ? row.siteTitle : '',
      siteStatus: best && best.score >= 0.25 ? row.siteStatus : '',
      sitePrice: best && best.score >= 0.25 ? row.sitePrice : '',
      siteDeal: best && best.score >= 0.25 ? row.siteDeal : '',
    })
  }

  const siteNotFound = siteProperties
    .filter((item) => !usedSiteIds.has(item.id))
    .map((item) => ({
      title: item.title || '',
      status: item.status || '',
      price: euro(item.price),
      deal: inferDealFromText(siteText(item), String(item.price || '')),
      city: item.city || item.comune || '',
      slug: item.slug || '',
    }))

  const md = [
    '# Confronto portali vs sito Area Immobiliare',
    '',
    `Generato: ${new Date().toLocaleString('it-IT')}`,
    '',
    '## Riepilogo',
    '',
    `- Righe utili dai portali dopo pulizia e accorpamento: **${portalItems.length}**`,
    `- Immobili presenti nel database sito: **${siteProperties.length}**`,
    `- Probabili già presenti sul sito: **${matched.length}**`,
    `- Da verificare a mano: **${review.length}**`,
    `- Possibile stesso indirizzo ma contratto diverso: **${contractConflicts.length}**`,
    `- Probabili mancanti sul sito: **${missing.length}**`,
    `- Immobili del sito non agganciati con certezza ai portali: **${siteNotFound.length}**`,
    '',
    '## Probabili mancanti sul sito',
    '',
    '| Immobile portale | Contratto portale | Portali | Prezzo portale | Possibile match sito | Score | Motivo |',
    '|---|---|---|---:|---|---:|---|',
    ...missing.map((item) => `| ${safeCell(item.portalTitle)} | ${safeCell(item.portalDeal)} | ${safeCell(item.portalPortals)} | ${safeCell(item.portalPrice)} | ${safeCell(item.siteTitle || 'nessun match credibile')} | ${item.score} | ${safeCell(item.reason)} |`),
    '',
    '## Possibile stesso indirizzo ma contratto diverso',
    '',
    '| Immobile portale | Contratto portale | Prezzo portale | Possibile match sito | Contratto sito | Prezzo sito | Score | Motivo |',
    '|---|---|---:|---|---|---:|---:|---|',
    ...contractConflicts.map((item) => `| ${safeCell(item.portalTitle)} | ${safeCell(item.portalDeal)} | ${safeCell(item.portalPrice)} | ${safeCell(item.siteTitle)} | ${safeCell(item.siteDeal)} | ${safeCell(item.sitePrice)} | ${item.score} | ${safeCell(item.reason)} |`),
    '',
    '## Da verificare a mano',
    '',
    '| Immobile portale | Contratto portale | Portali | Prezzo portale | Possibile match sito | Stato sito | Prezzo sito | Score | Motivo |',
    '|---|---|---|---:|---|---|---:|---:|---|',
    ...review.map((item) => `| ${safeCell(item.portalTitle)} | ${safeCell(item.portalDeal)} | ${safeCell(item.portalPortals)} | ${safeCell(item.portalPrice)} | ${safeCell(item.siteTitle)} | ${safeCell(item.siteStatus)} | ${safeCell(item.sitePrice)} | ${item.score} | ${safeCell(item.reason)} |`),
    '',
    '## Probabili già presenti sul sito',
    '',
    '| Immobile portale | Contratto portale | Portali | Prezzo portale | Match sito | Stato sito | Prezzo sito | Score | Motivo |',
    '|---|---|---|---:|---|---|---:|---:|---|',
    ...matched.map((item) => `| ${safeCell(item.portalTitle)} | ${safeCell(item.portalDeal)} | ${safeCell(item.portalPortals)} | ${safeCell(item.portalPrice)} | ${safeCell(item.siteTitle)} | ${safeCell(item.siteStatus)} | ${safeCell(item.sitePrice)} | ${item.score} | ${safeCell(item.reason)} |`),
    '',
    '## Immobili nel sito non agganciati con certezza ai portali',
    '',
    '| Immobile sito | Stato | Contratto stimato | Prezzo | Località | Slug |',
    '|---|---|---|---:|---|---|',
    ...siteNotFound.map((item) => `| ${safeCell(item.title)} | ${safeCell(item.status)} | ${safeCell(item.deal)} | ${safeCell(item.price)} | ${safeCell(item.city)} | ${safeCell(item.slug)} |`),
    '',
    '## Nota',
    '',
    'Il confronto distingue vendita e affitto. Se due immobili hanno stesso indirizzo ma contratto diverso, finiscono nella sezione dedicata e non vengono considerati automaticamente già presenti.',
    '',
  ].join('\n')

  const json = {
    generatedAt: new Date().toISOString(),
    counts: {
      portalItems: portalItems.length,
      siteProperties: siteProperties.length,
      matched: matched.length,
      review: review.length,
      contractConflicts: contractConflicts.length,
      missing: missing.length,
      siteNotFound: siteNotFound.length,
    },
    missing,
    contractConflicts,
    review,
    matched,
    siteNotFound,
  }

  await fs.writeFile(OUT_MD, md, 'utf8')
  await fs.writeFile(OUT_JSON, JSON.stringify(json, null, 2), 'utf8')

  console.log('=== CONFRONTO CONTRATTI CREATO ===')
  console.log('tmp/area-portali-audit/confronto-portali-sito.md')
  console.log('tmp/area-portali-audit/confronto-portali-sito.json')
  console.log('')
  console.log(md.split('\n').slice(0, 260).join('\n'))
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
