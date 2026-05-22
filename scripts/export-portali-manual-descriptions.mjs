import fs from 'node:fs/promises'
import path from 'node:path'

const OUT_DIR = 'tmp/area-portali-audit'
const PLAN_JSON = path.join(OUT_DIR, 'piano-import-immobili-portali.json')
const DETAIL_JSON = path.join(OUT_DIR, 'descrizioni-portali-dettaglio-per-ref.json')
const OUT_CSV = path.join(OUT_DIR, 'descrizioni-manuali-portali.csv')
const OUT_MD = path.join(OUT_DIR, 'descrizioni-manuali-portali.md')

function compact(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
}

function walk(value, out = []) {
  if (!value) return out
  if (Array.isArray(value)) {
    value.forEach((item) => walk(item, out))
    return out
  }
  if (typeof value === 'object') {
    out.push(value)
    Object.values(value).forEach((item) => walk(item, out))
  }
  return out
}

function pick(obj, keys) {
  for (const key of keys) {
    if (obj && obj[key] != null) return obj[key]
  }
  return ''
}

function csvEscape(value) {
  const s = String(value ?? '')
  return `"${s.replace(/"/g, '""')}"`
}

async function readJsonSafe(file) {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'))
  } catch {
    return null
  }
}

function parsePlanRows(json) {
  const rows = []
  const seen = new Set()

  for (const obj of walk(json)) {
    const ref = compact(pick(obj, ['reference_code', 'referenceCode', 'ref', 'REF']))
    const title = compact(pick(obj, ['title', 'immobile', 'property_title', 'propertyTitle']))
    const action = compact(pick(obj, ['action', 'azione']))
    const contract = compact(pick(obj, ['contract_type', 'contractType', 'contract', 'contratto'])).toLowerCase()
    const price = compact(pick(obj, ['price', 'prezzo', 'formatted_price', 'formattedPrice']))
    const portals = compact(pick(obj, ['portals', 'portal', 'portali', 'source_portals', 'sourcePortals']))

    if (!/^IM\d{4}AA$/.test(ref)) continue
    if (!title) continue
    if (seen.has(ref)) continue

    // Solo quelli davvero importati in automatico: CREARE DRAFT + vendita/affitto.
    if (action && action !== 'CREARE DRAFT') continue
    if (!['vendita', 'affitto'].includes(contract)) continue

    seen.add(ref)
    rows.push({ ref, title, contract, price, portals })
  }

  return rows.sort((a, b) => a.ref.localeCompare(b.ref))
}

function parseUrls(json) {
  const map = new Map()

  for (const obj of walk(json)) {
    const ref = compact(pick(obj, ['reference_code', 'referenceCode', 'ref', 'REF']))
    const url = compact(pick(obj, ['url', 'source_url', 'sourceUrl', 'portal_url', 'portalUrl', 'annuncio_url', 'annuncioUrl']))
    if (/^IM\d{4}AA$/.test(ref) && /^https?:\/\//i.test(url)) {
      map.set(ref, url)
    }
  }

  return map
}

async function main() {
  const planJson = await readJsonSafe(PLAN_JSON)
  if (!planJson) throw new Error(`Manca o non leggo ${PLAN_JSON}`)

  const detailJson = await readJsonSafe(DETAIL_JSON)
  const urlMap = detailJson ? parseUrls(detailJson) : new Map()

  const rows = parsePlanRows(planJson)

  const csvLines = []
  csvLines.push([
    'REF',
    'Titolo',
    'Contratto',
    'Prezzo',
    'Portali',
    'URL annuncio',
    'Descrizione da incollare qui',
  ].map(csvEscape).join(','))

  for (const row of rows) {
    csvLines.push([
      row.ref,
      row.title,
      row.contract,
      row.price,
      row.portals,
      urlMap.get(row.ref) || '',
      '',
    ].map(csvEscape).join(','))
  }

  await fs.writeFile(OUT_CSV, csvLines.join('\n') + '\n', 'utf8')

  const md = []
  md.push('# Descrizioni manuali portali')
  md.push('')
  md.push(`Generato: ${new Date().toLocaleString('it-IT')}`)
  md.push('')
  md.push(`REF esportati: **${rows.length}**`)
  md.push('')
  md.push('Compila il CSV qui:')
  md.push('')
  md.push(`\`${OUT_CSV}\``)
  md.push('')
  md.push('## Link rapidi')
  md.push('')
  md.push('| REF | Titolo | URL |')
  md.push('|---|---|---|')

  for (const row of rows) {
    const url = urlMap.get(row.ref) || ''
    md.push(`| ${row.ref} | ${row.title.replace(/\|/g, '\\|')} | ${url ? `[apri annuncio](${url})` : '-'} |`)
  }

  await fs.writeFile(OUT_MD, md.join('\n') + '\n', 'utf8')

  console.log('=== EXPORT DESCRIZIONI MANUALI CREATO ===')
  console.log(OUT_CSV)
  console.log(OUT_MD)
  console.log('')
  console.log(`REF esportati: ${rows.length}`)
  console.log('')
  console.log('Apri il CSV, incolla solo le descrizioni vere nella colonna finale, poi useremo lo script apply.')
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
