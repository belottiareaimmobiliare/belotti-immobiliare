import fs from 'node:fs/promises'
import path from 'node:path'

const ROOT = process.cwd()
const OUT_DIR = path.join(ROOT, 'tmp', 'area-portali-audit')
const PLAN_JSON = path.join(OUT_DIR, 'piano-import-immobili-portali.json')
const REPORT_MD = path.join(OUT_DIR, 'descrizioni-pulite-generate.md')
const REPORT_JSON = path.join(OUT_DIR, 'descrizioni-pulite-generate.json')
const APPLY = process.argv.includes('--apply')

function compact(value = '') {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function pick(row, keys, fallback = '') {
  for (const key of keys) {
    if (row && row[key] !== undefined && row[key] !== null && compact(row[key]) !== '') {
      return row[key]
    }
  }
  return fallback
}

function safeCell(value = '') {
  return compact(value).replace(/\|/g, '/').slice(0, 260)
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

async function supabaseConfig() {
  const env = await loadEnv()
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL
  const supabaseKey =
    env.SUPABASE_SERVICE_ROLE_KEY ||
    env.SUPABASE_SERVICE_KEY ||
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Variabili Supabase mancanti.')
  }

  return {
    baseUrl: supabaseUrl.replace(/\/$/, ''),
    key: supabaseKey,
  }
}

async function supabaseFetch(url, options = {}) {
  const cfg = await supabaseConfig()

  const response = await fetch(`${cfg.baseUrl}${url}`, {
    ...options,
    headers: {
      apikey: cfg.key,
      authorization: `Bearer ${cfg.key}`,
      accept: 'application/json',
      'content-type': 'application/json',
      ...(options.headers || {}),
    },
  })

  const text = await response.text()

  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }

  if (!response.ok) {
    throw new Error(`Supabase ${response.status}: ${typeof data === 'string' ? data : JSON.stringify(data).slice(0, 900)}`)
  }

  return data
}

function normalizeContract(contract = '') {
  const c = compact(contract).toLowerCase()
  if (c.includes('affitto') || c.includes('locazione')) return 'affitto'
  if (c.includes('vendita') || c.includes('sale')) return 'vendita'
  return c || 'non indicato'
}

function contractPhrase(contract = '') {
  const c = normalizeContract(contract)
  if (c === 'affitto') return 'in affitto'
  if (c === 'vendita') return 'in vendita'
  return 'con contratto da verificare'
}

function prettyType(type = '', title = '') {
  const raw = compact(type || title).toLowerCase()

  if (raw.includes('garage') || raw.includes('box')) return 'box / garage'
  if (raw.includes('ufficio') || raw.includes('studio')) return 'ufficio'
  if (raw.includes('locale commerciale') || raw.includes('negozio') || raw.includes('commerciale')) return 'locale commerciale'
  if (raw.includes('terreno')) return 'terreno'
  if (raw.includes('rustico') || raw.includes('cascina') || raw.includes('colonica')) return 'rustico / cascina'
  if (raw.includes('villa')) return 'villa'
  if (raw.includes('quadrilocale')) return 'quadrilocale'
  if (raw.includes('trilocale')) return 'trilocale'
  if (raw.includes('bilocale')) return 'bilocale'
  if (raw.includes('appartamento')) return 'appartamento'

  return compact(type) || 'immobile'
}

function extractAreaFromTitle(title = '', city = '') {
  const cleanTitle = compact(title)
  const cleanCity = compact(city)

  if (!cleanTitle) return ''

  const parts = cleanTitle.split(',').map((x) => compact(x)).filter(Boolean)

  if (parts.length >= 2) {
    const maybeArea = parts.slice(1).join(', ')
    if (cleanCity && maybeArea.toLowerCase().includes(cleanCity.toLowerCase())) return maybeArea
    return maybeArea
  }

  return ''
}

function cleanFeatureLabel(value = '') {
  return compact(value)
    .replace(/\brilevato\b/gi, '')
    .replace(/\bda verificare\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function featuresFromRow(row) {
  const raw = pick(row, [
    'features',
    'features_text',
    'featuresText',
    'portal_features',
    'portalFeatures',
    'caratteristiche',
    'caratteristiche_portale',
    'caratteristichePortale',
  ], '')

  if (Array.isArray(raw)) {
    return raw.map(cleanFeatureLabel).filter(Boolean)
  }

  return String(raw || '')
    .split(/,|;|\//g)
    .map(cleanFeatureLabel)
    .filter(Boolean)
    .filter((item) => item !== '-')
}

function priceText(row) {
  const contract = normalizeContract(pick(row, ['contract_type', 'contractType', 'contract', 'contratto'], ''))
  const raw = compact(pick(row, ['price_label', 'priceLabel', 'price', 'prezzo'], ''))

  if (raw) {
    if (contract === 'affitto' && !/mese|\/\s*mese|mensil/i.test(raw)) {
      return `${raw} / mese`
    }
    return raw
  }

  const num = compact(pick(row, ['price_number', 'priceNumber'], ''))
  if (!num) return ''

  if (contract === 'affitto') return `${num} € / mese`
  return `${num} €`
}

function buildDescription(row) {
  const ref = compact(pick(row, ['reference_code', 'referenceCode', 'ref'], ''))
  const title = compact(pick(row, ['title', 'immobile'], ''))
  const portals = compact(pick(row, ['portals', 'portali'], ''))
  const city = compact(pick(row, ['city', 'citta', 'comune'], ''))
  const contract = normalizeContract(pick(row, ['contract_type', 'contractType', 'contract', 'contratto'], ''))
  const type = prettyType(pick(row, ['property_type', 'propertyType', 'type', 'tipo'], ''), title)
  const price = priceText(row)
  const features = featuresFromRow(row)
  const area = extractAreaFromTitle(title, city)

  const locationText = city
    ? `a ${city}${area && !area.toLowerCase().includes(city.toLowerCase()) ? `, zona ${area}` : ''}`
    : area
      ? `in zona ${area}`
      : 'in zona indicata nella scheda'

  const paragraphs = []

  paragraphs.push(
    `${capitalize(type)} ${contractPhrase(contract)} ${locationText}. La scheda è stata creata partendo dai dati pubblici rilevati sui portali collegati ad Area Immobiliare e deve essere verificata/rifinita prima della pubblicazione definitiva.`
  )

  if (price) {
    paragraphs.push(`Prezzo rilevato dai portali: ${price}.`)
  }

  if (features.length) {
    paragraphs.push(`Caratteristiche rilevate o da confermare in fase di revisione: ${features.join(', ')}.`)
  } else {
    paragraphs.push('I dettagli completi dell’immobile, comprese eventuali pertinenze, dotazioni, spese e caratteristiche tecniche, vanno completati in admin prima della pubblicazione.')
  }

  paragraphs.push(`Titolo origine portale: ${title}.`)
  paragraphs.push(`Fonte import: ${portals || 'portali Area Immobiliare'}. REF import: ${ref}.`)

  return paragraphs.join('\n\n')
}

function capitalize(value = '') {
  const text = compact(value)
  if (!text) return ''
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function shouldImportRow(row) {
  const action = compact(pick(row, ['action', 'azione'], ''))
  const contract = normalizeContract(pick(row, ['contract_type', 'contractType', 'contract', 'contratto'], ''))
  return action === 'CREARE DRAFT' && ['vendita', 'affitto'].includes(contract)
}

function isPlaceholderDescription(description = '') {
  const d = compact(description)
  if (!d) return true
  if (d.includes('Bozza importata da audit portali Area Immobiliare')) return true
  if (d.includes('REF import: IM')) return true
  return false
}

async function main() {
  const plan = JSON.parse(await fs.readFile(PLAN_JSON, 'utf8'))
  const planRows = Array.isArray(plan.importRows) ? plan.importRows : []

  const rows = planRows
    .filter(shouldImportRow)
    .map((row) => ({
      reference_code: compact(pick(row, ['reference_code', 'referenceCode', 'ref'], '')),
      title: compact(pick(row, ['title', 'immobile'], '')),
      contract_type: normalizeContract(pick(row, ['contract_type', 'contractType', 'contract', 'contratto'], '')),
      portals: compact(pick(row, ['portals', 'portali'], '')),
      clean_description: buildDescription(row),
    }))
    .filter((row) => row.reference_code)

  const refs = rows.map((row) => `"${row.reference_code}"`).join(',')
  const select = encodeURIComponent('id,title,reference_code,description,status')

  const properties = await supabaseFetch(`/rest/v1/properties?select=${select}&reference_code=in.(${refs})`)
  const byRef = new Map(properties.map((property) => [property.reference_code, property]))

  const reportRows = []

  for (const row of rows) {
    const property = byRef.get(row.reference_code)
    const currentDescription = property?.description || ''
    const canUpdate = Boolean(property) && isPlaceholderDescription(currentDescription)

    reportRows.push({
      ...row,
      found: Boolean(property),
      current_status: property?.status || '',
      can_update: canUpdate,
      current_description_preview: compact(currentDescription).slice(0, 160),
    })
  }

  const toUpdate = reportRows.filter((row) => row.can_update)
  const skipped = reportRows.filter((row) => !row.can_update)

  const md = [
    '# Descrizioni pulite generate per immobili importati',
    '',
    `Generato: ${new Date().toLocaleString('it-IT')}`,
    '',
    '## Riepilogo',
    '',
    `- Immobili candidati: **${reportRows.length}**`,
    `- Aggiornabili perché ancora placeholder: **${toUpdate.length}**`,
    `- Saltati: **${skipped.length}**`,
    `- Modalità: **${APPLY ? 'APPLY' : 'DRY RUN'}**`,
    '',
    '## Tabella compatta',
    '',
    '| REF | Azione | Stato sito | Immobile | Anteprima nuova descrizione |',
    '|---|---|---|---|---|',
    ...reportRows.map((row) => `| ${safeCell(row.reference_code)} | ${row.can_update ? 'UPDATE' : 'SKIP'} | ${safeCell(row.current_status || '-')} | ${safeCell(row.title)} | ${safeCell(row.clean_description)} |`),
    '',
    '## Descrizioni complete',
    '',
    ...reportRows.map((row) => [
      `### ${row.reference_code} — ${row.title}`,
      '',
      row.can_update ? 'Azione: UPDATE' : 'Azione: SKIP',
      '',
      '```',
      row.clean_description,
      '```',
      '',
    ].join('\n')),
  ].join('\n')

  await fs.writeFile(REPORT_MD, md, 'utf8')
  await fs.writeFile(REPORT_JSON, JSON.stringify({
    generatedAt: new Date().toISOString(),
    mode: APPLY ? 'apply' : 'dry-run',
    counts: {
      candidates: reportRows.length,
      updatable: toUpdate.length,
      skipped: skipped.length,
    },
    rows: reportRows,
  }, null, 2), 'utf8')

  console.log('=== DESCRIZIONI PULITE GENERATE ===')
  console.log(`Modalità: ${APPLY ? 'APPLY - scrive in Supabase' : 'DRY RUN - non scrive nulla'}`)
  console.log(`Immobili candidati: ${reportRows.length}`)
  console.log(`Aggiornabili: ${toUpdate.length}`)
  console.log(`Saltati: ${skipped.length}`)
  console.log('')

  for (const row of reportRows) {
    console.log(`${row.can_update ? 'UPDATE' : 'SKIP'} ${row.reference_code} | ${row.title}`)
  }

  console.log('')
  console.log('Report:')
  console.log('tmp/area-portali-audit/descrizioni-pulite-generate.md')
  console.log('tmp/area-portali-audit/descrizioni-pulite-generate.json')
  console.log('')
  console.log('=== ANTEPRIMA REPORT ===')
  console.log(md.split('\n').slice(0, 120).join('\n'))

  if (!APPLY) {
    console.log('')
    console.log('Dry-run completato. Per applicare esegui:')
    console.log('npm run audit:portali:clean-descriptions -- --apply')
    return
  }

  console.log('')
  console.log('=== UPDATE DESCRIZIONI IN SUPABASE ===')

  let updated = 0

  for (const row of toUpdate) {
    const property = byRef.get(row.reference_code)

    await supabaseFetch(`/rest/v1/properties?id=eq.${property.id}`, {
      method: 'PATCH',
      headers: {
        prefer: 'return=minimal',
      },
      body: JSON.stringify({
        description: row.clean_description,
      }),
    })

    console.log(`OK ${row.reference_code} | ${row.title}`)
    updated += 1
  }

  console.log('')
  console.log(`Aggiornate: ${updated}/${toUpdate.length}`)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
