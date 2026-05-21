import fs from 'node:fs/promises'
import path from 'node:path'

const ROOT = process.cwd()
const OUT_DIR = path.join(ROOT, 'tmp', 'area-portali-audit')
const COMPARE_JSON = path.join(OUT_DIR, 'confronto-portali-sito.json')
const FEATURES_JSON = path.join(OUT_DIR, 'caratteristiche-portali.json')
const OUT_MD = path.join(OUT_DIR, 'piano-import-immobili-portali.md')
const OUT_JSON = path.join(OUT_DIR, 'piano-import-immobili-portali.json')
const OUT_CSV = path.join(OUT_DIR, 'piano-import-immobili-portali.csv')

const REF_PREFIX = 'IM'
const REF_SUFFIX = 'AA'

function compact(value = '') {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function normalize(value = '') {
  return compact(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, ' ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function safeCell(value = '') {
  return compact(value).replace(/\|/g, '/')
}

function parsePrice(value = '') {
  const text = compact(value)
  if (!text || /richiesta|riservata|non chiaro/i.test(text)) return null

  const match = text.match(/(\d{1,3}(?:\.\d{3})+|\d{4,}|\d{1,3})(?:,\d+)?/)
  if (!match) return null

  return Number(match[1].replace(/\./g, ''))
}

function priceLabel(value) {
  const parsed = parsePrice(value)
  if (!parsed) return compact(value)

  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(parsed)
}

function inferPropertyType(title = '') {
  const n = normalize(title)

  if (n.includes('bilocale')) return 'bilocale'
  if (n.includes('trilocale')) return 'trilocale'
  if (n.includes('quadrilocale')) return 'quadrilocale'
  if (n.includes('appartamento')) return 'appartamento'
  if (n.includes('villa')) return 'villa'
  if (n.includes('ufficio') || n.includes('studio')) return 'ufficio'
  if (n.includes('locale commerciale') || n.includes('negozio')) return 'commerciale'
  if (n.includes('garage') || n.includes('box')) return 'box'
  if (n.includes('terreno')) return 'terreno'
  if (n.includes('rustico') || n.includes('cascina') || n.includes('casa colonica')) return 'rustico'
  return ''
}

function inferCity(title = '') {
  const n = normalize(title)

  const known = [
    'Bergamo',
    'Brembate di Sopra',
    'Chiusi',
    'Redona',
    'Bianzano',
    'Treviolo',
    'Bedulita',
    'Gorle',
    'Strozza',
    'Bottanuco',
  ]

  for (const city of known) {
    if (n.includes(normalize(city))) return city
  }

  return ''
}

function slugify(value = '') {
  return normalize(value)
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90)
}

function makeRef(index) {
  return `${REF_PREFIX}${String(index).padStart(4, '0')}${REF_SUFFIX}`
}

function featureKey(title = '', price = '') {
  return `${normalize(title)}|${normalize(price)}`
}

function buildFeatureMap(featuresData) {
  const map = new Map()

  for (const row of featuresData.rows || []) {
    const key = featureKey(row.title, row.prices)
    map.set(key, {
      high: row.high || [],
      medium: row.medium || [],
      evidence: row.evidence || [],
    })
  }

  return map
}

function getFeaturesFor(row, featureMap) {
  const key = featureKey(row.portalTitle, row.portalPrice)
  return featureMap.get(key) || {
    high: [],
    medium: [],
    evidence: [],
  }
}

function actionFor(row) {
  const score = Number(row.score || 0)
  const siteTitle = compact(row.siteTitle)

  if (!siteTitle) return 'CREARE DRAFT'
  if (score >= 0.30) return 'VERIFICARE PRIMA DI CREARE'
  return 'CREARE DRAFT, possibile falso match'
}

function toCsv(rows) {
  const header = [
    'reference_code',
    'azione',
    'titolo',
    'contratto',
    'prezzo',
    'prezzo_numero',
    'tipo',
    'citta',
    'portali',
    'match_sito',
    'score',
    'caratteristiche_alta_confidenza',
    'caratteristiche_da_verificare',
  ]

  const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`

  return [
    header.join(';'),
    ...rows.map((row) => [
      row.reference_code,
      row.action,
      row.title,
      row.contract_type,
      row.price_label,
      row.price_number ?? '',
      row.property_type,
      row.city,
      row.portals,
      row.possible_site_match,
      row.score,
      row.features_high.join(', '),
      row.features_review.join(', '),
    ].map(escape).join(';')),
  ].join('\n')
}

async function main() {
  const compare = JSON.parse(await fs.readFile(COMPARE_JSON, 'utf8'))
  const features = JSON.parse(await fs.readFile(FEATURES_JSON, 'utf8'))
  const featureMap = buildFeatureMap(features)

  const missing = compare.missing || []
  const contractConflicts = compare.contractConflicts || []

  let index = 1

  const importRows = missing.map((row) => {
    const detected = getFeaturesFor(row, featureMap)
    const referenceCode = makeRef(index)
    index += 1

    const priceNumber = parsePrice(row.portalPrice)
    const title = compact(row.portalTitle)
    const contract = compact(row.portalDeal || 'non chiaro')

    return {
      reference_code: referenceCode,
      action: actionFor(row),
      title,
      slug: slugify(`${referenceCode} ${title}`),
      status: 'draft',
      contract_type: contract,
      property_type: inferPropertyType(title),
      city: inferCity(title),
      price_label: priceLabel(row.portalPrice),
      price_number: priceNumber,
      portals: compact(row.portalPortals),
      possible_site_match: compact(row.siteTitle),
      score: Number(row.score || 0),
      match_reason: compact(row.reason),
      features_high: detected.high || [],
      features_review: detected.medium || [],
      feature_evidence: detected.evidence || [],
      source: 'area_portali_audit',
      source_batch: REF_SUFFIX,
    }
  })

  const conflictRows = contractConflicts.map((row) => ({
    title: compact(row.portalTitle),
    contract_type: compact(row.portalDeal),
    price_label: priceLabel(row.portalPrice),
    possible_site_match: compact(row.siteTitle),
    site_contract: compact(row.siteDeal),
    site_price: compact(row.sitePrice),
    score: Number(row.score || 0),
    match_reason: compact(row.reason),
  }))

  const createNow = importRows.filter((row) => row.action.startsWith('CREARE DRAFT'))
  const reviewFirst = importRows.filter((row) => row.action.startsWith('VERIFICARE'))

  const md = [
    '# Piano import immobili dai portali',
    '',
    `Generato: ${new Date().toLocaleString('it-IT')}`,
    '',
    '## Regola REF',
    '',
    `Formato scelto: **${REF_PREFIX}0001${REF_SUFFIX}**`,
    '',
    '| Parte | Significato |',
    '|---|---|',
    `| ${REF_PREFIX} | Immobile importato |`,
    '| 0001 | Progressivo a 4 cifre |',
    `| ${REF_SUFFIX} | Batch audit Area / import portali |`,
    '',
    '## Riepilogo',
    '',
    `- Candidati import da portali: **${importRows.length}**`,
    `- Creabili come draft: **${createNow.length}**`,
    `- Da verificare prima di creare: **${reviewFirst.length}**`,
    `- Possibili stesso indirizzo ma contratto diverso: **${conflictRows.length}**`,
    '',
    '## Candidati import con REF',
    '',
    '| REF | Azione | Immobile | Contratto | Prezzo | Tipo | Città | Portali | Match sito | Caratteristiche portale |',
    '|---|---|---|---|---:|---|---|---|---|---|',
    ...importRows.map((row) => {
      const features = [
        ...row.features_high.map((item) => `${item} rilevato`),
        ...row.features_review.map((item) => `${item} da verificare`),
      ].join(', ')

      return `| ${safeCell(row.reference_code)} | ${safeCell(row.action)} | ${safeCell(row.title)} | ${safeCell(row.contract_type)} | ${safeCell(row.price_label)} | ${safeCell(row.property_type)} | ${safeCell(row.city)} | ${safeCell(row.portals)} | ${safeCell(row.possible_site_match || '-')} | ${safeCell(features || '-')} |`
    }),
    '',
    '## Possibile stesso indirizzo ma contratto diverso',
    '',
    '| Immobile portale | Contratto portale | Prezzo portale | Match sito | Contratto sito | Prezzo sito | Azione consigliata |',
    '|---|---|---:|---|---|---:|---|',
    ...conflictRows.map((row) => {
      return `| ${safeCell(row.title)} | ${safeCell(row.contract_type)} | ${safeCell(row.price_label)} | ${safeCell(row.possible_site_match)} | ${safeCell(row.site_contract)} | ${safeCell(row.site_price)} | verificare e creare scheda separata solo se confermato |`
    }),
    '',
    '## Nota operativa',
    '',
    '- Questo file non scrive nulla in Supabase.',
    '- I REF sono proposti per gli immobili importati dai portali.',
    '- Gli immobili con possibile match sito vanno controllati prima per evitare duplicati.',
    '- Le caratteristiche da portale non vanno trasformate automaticamente in falso/vero: quelle dubbie devono restare da verificare in admin.',
    '',
  ].join('\n')

  const json = {
    generatedAt: new Date().toISOString(),
    referenceRule: {
      prefix: REF_PREFIX,
      numericLength: 4,
      suffix: REF_SUFFIX,
      example: `${REF_PREFIX}0001${REF_SUFFIX}`,
    },
    counts: {
      importCandidates: importRows.length,
      createNow: createNow.length,
      reviewFirst: reviewFirst.length,
      contractConflicts: conflictRows.length,
    },
    importRows,
    contractConflicts: conflictRows,
  }

  await fs.writeFile(OUT_MD, md, 'utf8')
  await fs.writeFile(OUT_JSON, JSON.stringify(json, null, 2), 'utf8')
  await fs.writeFile(OUT_CSV, toCsv(importRows), 'utf8')

  console.log('=== PIANO IMPORT CREATO ===')
  console.log('tmp/area-portali-audit/piano-import-immobili-portali.md')
  console.log('tmp/area-portali-audit/piano-import-immobili-portali.json')
  console.log('tmp/area-portali-audit/piano-import-immobili-portali.csv')
  console.log('')
  console.log(md.split('\n').slice(0, 240).join('\n'))
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
