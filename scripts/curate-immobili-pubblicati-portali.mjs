import fs from 'fs'
import path from 'path'

const APPLY = process.argv.includes('--apply')
const REPORT_MD = path.resolve('tmp/area-portali-audit/curate-immobili-pubblicati-portali.md')
const REPORT_JSON = path.resolve('tmp/area-portali-audit/curate-immobili-pubblicati-portali.json')

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue
    const i = trimmed.indexOf('=')
    const key = trimmed.slice(0, i).trim()
    let value = trimmed.slice(i + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1)
    if (!process.env[key]) process.env[key] = value
  }
}

for (const file of ['.env.local', '.env', '.env.development.local', '.env.production.local']) loadEnvFile(file)

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('ERRORE: variabili Supabase mancanti.')
  process.exit(1)
}

function compact(v) {
  return String(v ?? '').trim()
}

function keyExists(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key)
}

function setPatch(patch, prop, key, value, options = {}) {
  if (!keyExists(prop, key)) return
  if (value === undefined) return
  if (value === null && !options.allowNull) return

  const current = prop[key]
  const currentEmpty =
    current === null ||
    current === undefined ||
    current === '' ||
    (Array.isArray(current) && current.length === 0)

  if (options.force || currentEmpty) {
    if (JSON.stringify(current) !== JSON.stringify(value)) patch[key] = value
  }
}

function setBoolTrue(patch, prop, key, value) {
  if (!keyExists(prop, key)) return
  if (value === true && prop[key] !== true) patch[key] = true
}

function titleText(prop) {
  return `${compact(prop.title)} ${compact(prop.property_type)} ${Array.isArray(prop.features) ? prop.features.join(' ') : ''}`.toLowerCase()
}

function inferRoomsFromTitle(text) {
  if (/\bmonolocale\b/.test(text)) return 1
  if (/\bbilocale\b/.test(text)) return 2
  if (/\btrilocale\b/.test(text)) return 3
  if (/\bquadrilocale\b/.test(text)) return 4
  if (/\bpentalocale\b/.test(text)) return 5
  return null
}

function inferFloorFromTitle(text) {
  if (/\bpiano terra\b|\bpian terreno\b/.test(text)) return 0
  if (/\bprimo piano\b/.test(text)) return 1
  if (/\bsecondo piano\b/.test(text)) return 2
  if (/\bterzo piano\b/.test(text)) return 3
  if (/\bquarto piano\b/.test(text)) return 4
  if (/\bquinto piano\b/.test(text)) return 5
  return null
}

function inferConditionFromTitle(text) {
  if (/\bda ristrutturare\b/.test(text)) return 'da_ristrutturare'
  if (/\bottimo stato\b|\bottime condizioni\b/.test(text)) return 'ottimo'
  if (/\bbuono stato\b|\bbuone condizioni\b/.test(text)) return 'buono'
  if (/\bnuovo\b|\bnuova costruzione\b|\bnuova realizzazione\b|\bmai abitato\b/.test(text)) return 'nuovo'
  return null
}

function canonicalFeature(value) {
  const raw = compact(value)
  const key = raw.toLowerCase()

  const map = {
    'box/garage': 'Box/Garage',
    'garage': 'Box/Garage',
    'bilocale': 'Bilocale',
    'trilocale': 'Trilocale',
    'quadrilocale': 'Quadrilocale',
    'piano terra': 'Piano terra',
    'primo piano': 'Primo piano',
    'secondo piano': 'Secondo piano',
    'nuova costruzione': 'Nuova costruzione',
    'ottimo stato': 'Ottimo stato',
    'buono stato': 'Buono stato',
    'da ristrutturare': 'Da ristrutturare',
    'terreno edificabile': 'Terreno edificabile',
    'rustico/cascina': 'Rustico/Cascina',
    'ufficio': 'Ufficio',
    'locale commerciale': 'Locale commerciale',
    'villa': 'Villa',
    'classe a': 'Classe A',
  }

  return map[key] || raw
}

function uniqueFeatures(values) {
  const seen = new Set()
  const out = []

  for (const value of values) {
    const normalized = canonicalFeature(value)
    const key = normalized.toLowerCase()
    if (!normalized || seen.has(key)) continue
    seen.add(key)
    out.push(normalized)
  }

  return out
}


function safeFeatures(prop) {
  const text = titleText(prop)
  const existing = Array.isArray(prop.features) ? prop.features.map(compact).filter(Boolean) : []
  const add = []

  if (/\bbilocale\b/.test(text)) add.push('bilocale')
  if (/\btrilocale\b/.test(text)) add.push('trilocale')
  if (/\bquadrilocale\b/.test(text)) add.push('quadrilocale')
  if (/\bpiano terra\b/.test(text)) add.push('piano terra')
  if (/\bprimo piano\b/.test(text)) add.push('primo piano')
  if (/\bsecondo piano\b/.test(text)) add.push('secondo piano')
  if (/\bnuovo\b|\bnuova costruzione\b|\bnuova realizzazione\b/.test(text)) add.push('nuova costruzione')
  if (/\bottimo stato\b/.test(text)) add.push('ottimo stato')
  if (/\bbuono stato\b/.test(text)) add.push('buono stato')
  if (/\bda ristrutturare\b/.test(text)) add.push('da ristrutturare')
  if (/\bgarage\b|\bbox\b/.test(text)) add.push('garage')
  if (/\bterreno edificabile\b/.test(text)) add.push('terreno edificabile')
  if (/\brustico\b|\bcascina\b|\bcasa colonica\b/.test(text)) add.push('rustico/cascina')
  if (/\bufficio\b|\bstudio\b|\bdirezionale\b|\bcentro medico\b/.test(text)) add.push('ufficio')
  if (/\blocale commerciale\b|\bnegozio\b/.test(text)) add.push('locale commerciale')
  if (/\bvilla\b|\bunifamiliare\b/.test(text)) add.push('villa')

  return uniqueFeatures([...existing, ...add])
}

const LOCATION_OVERRIDES = {
  IM0001AA: { province: 'Bergamo', comune: 'Brembate di Sopra', city: 'Brembate di Sopra', area: null, address: null },
  IM0003AA: { province: 'Bergamo', comune: 'Bergamo', city: 'Bergamo', area: 'Canovine', address: 'via San Bernardino' },
  IM0004AA: { province: 'Bergamo', comune: 'Bergamo', city: 'Bergamo', area: 'Centro', address: 'vicolo Macellerie' },
  IM0005AA: { province: 'Siena', comune: 'Chiusi', city: 'Chiusi', area: null, address: null },
  IM0006AA: { province: 'Bergamo', comune: 'Bergamo', city: 'Bergamo', area: 'Redona', address: null },
  IM0007AA: { province: 'Bergamo', comune: 'Bergamo', city: 'Bergamo', area: 'Centro', address: null },
  IM0008AA: { province: 'Bergamo', comune: 'Bergamo', city: 'Bergamo', area: "Centro Sant'Alessandro", address: 'Via San Giorgio' },
  IM0009AA: { province: 'Bergamo', comune: 'Bergamo', city: 'Bergamo', area: 'Stazione', address: 'via Don Luigi Palazzolo' },
  IM0010AA: { province: 'Bergamo', comune: 'Bergamo', city: 'Bergamo', area: 'Stazione', address: 'via Giacomo Quarenghi 5' },
  IM0011AA: { province: 'Bergamo', comune: 'Bergamo', city: 'Bergamo', area: 'Stazione', address: 'via San Bernardino 63' },
  IM0012AA: { province: 'Bergamo', comune: 'Bergamo', city: 'Bergamo', area: 'Centro', address: 'Via Torquato Tasso' },
  IM0013AA: { province: 'Bergamo', comune: 'Bergamo', city: 'Bergamo', area: 'Centro', address: 'Via Torquato Tasso' },
  IM0015AA: { province: 'Bergamo', comune: 'Bergamo', city: 'Bergamo', area: 'Canovine', address: 'via Pietro Spino' },
  IM0016AA: { province: 'Bergamo', comune: 'Bianzano', city: 'Bianzano', area: null, address: null },
  IM0017AA: { province: 'Bergamo', comune: 'Treviolo', city: 'Treviolo', area: 'Centro', address: 'via dei Compagnoni' },
  IM0018AA: { province: 'Bergamo', comune: 'Bergamo', city: 'Bergamo', area: 'Corridoni', address: null },
  IM0019AA: { province: 'Bergamo', comune: 'Bergamo', city: 'Bergamo', area: "Centro Sant'Alessandro", address: 'Via Giorgio e Guido Paglia' },
  IM0020AA: { province: 'Bergamo', comune: 'Bergamo', city: 'Bergamo', area: 'Centro Pignolo', address: 'Via Masone' },
  IM0021AA: { province: 'Bergamo', comune: 'Brembate di Sopra', city: 'Brembate di Sopra', area: null, address: null },
  IM0022AA: { province: 'Bergamo', comune: 'Bergamo', city: 'Bergamo', area: 'Valtesse', address: null },
  IM0023AA: { province: 'Bergamo', comune: 'Bedulita', city: 'Bedulita', area: null, address: 'via Ca Personeni San c' },
  IM0025AA: { province: 'Bergamo', comune: 'Sotto il Monte Giovanni XXIII', city: 'Sotto il Monte Giovanni XXIII', area: null, address: null },
  IM0026AA: { province: 'Bergamo', comune: 'Bergamo', city: 'Bergamo', area: 'Corridoni', address: 'via Alberto Pitentino San c' },
  IM0027AA: { province: 'Bergamo', comune: 'Bergamo', city: 'Bergamo', area: 'Celadina / Boccaleone', address: 'via daste e spalenga San c' },
  IM0028AA: { province: 'Bergamo', comune: 'Bergamo', city: 'Bergamo', area: 'Redona', address: 'via F. Corridoni San c' },
  IM0029AA: { province: 'Bergamo', comune: 'Gorle', city: 'Gorle', area: null, address: 'Via Roma 85' },
  IM0030AA: { province: 'Bergamo', comune: 'Gorle', city: 'Gorle', area: null, address: 'Via Roma 85' },
  IM0031AA: { province: 'Bergamo', comune: 'Gorle', city: 'Gorle', area: null, address: 'Via Roma 85' },
  IM0032AA: { province: 'Bergamo', comune: 'Bergamo', city: 'Bergamo', area: 'Borgo Santa Caterina', address: 'Viale Giulio Cesare 29' },
  IM0033AA: { province: 'Bergamo', comune: 'Bergamo', city: 'Bergamo', area: 'Borgo Santa Caterina / Corridoni', address: 'Viale Giulio Cesare 29' },
  IM0035AA: { province: 'Bergamo', comune: 'Strozza', city: 'Strozza', area: null, address: null },
}

async function supabaseFetch(restPath, options = {}) {
  const res = await fetch(`${SUPABASE_URL}${restPath}`, {
    ...options,
    headers: {
      apikey: SERVICE_KEY,
      authorization: `Bearer ${SERVICE_KEY}`,
      'content-type': 'application/json',
      ...(options.headers || {}),
    },
  })

  const text = await res.text()
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${text.slice(0, 1200)}`)
  return text ? JSON.parse(text) : null
}

async function patchProperty(id, body) {
  return supabaseFetch(`/rest/v1/properties?id=eq.${id}`, {
    method: 'PATCH',
    headers: { prefer: 'return=representation' },
    body: JSON.stringify(body),
  })
}

function analyseProperty(p) {
  const ref = compact(p.reference_code)
  const title = compact(p.title)
  const lowerTitle = title.toLowerCase()
  const patch = {}
  const warnings = []

  const loc = LOCATION_OVERRIDES[ref]
  if (loc) {
    setPatch(patch, p, 'province', loc.province, { force: true })
    setPatch(patch, p, 'comune', loc.comune, { force: true })
    setPatch(patch, p, 'city', loc.city, { force: true })
    setPatch(patch, p, 'area', loc.area, { force: true, allowNull: true })
    if (loc.address !== null) setPatch(patch, p, 'address', loc.address, { force: true })
  } else {
    warnings.push('location override mancante')
  }

  const rooms = inferRoomsFromTitle(lowerTitle)
  const floor = inferFloorFromTitle(lowerTitle)
  const condition = inferConditionFromTitle(lowerTitle)

  setPatch(patch, p, 'rooms', rooms)
  setPatch(patch, p, 'floor', floor)
  setPatch(patch, p, 'condition', condition)

  if (/\bgarage\b|\bbox\b/.test(lowerTitle)) {
    setBoolTrue(patch, p, 'has_garage', true)
    setBoolTrue(patch, p, 'has_parking', true)
  }

  const hasAnyPhoto = Boolean(p.main_image) || (Array.isArray(p.gallery) && p.gallery.length > 0)
  if (hasAnyPhoto) {
    if (keyExists(p, 'photo_coming_soon') && p.photo_coming_soon !== false) patch.photo_coming_soon = false
    if (keyExists(p, 'no_photo_available') && p.no_photo_available !== false) patch.no_photo_available = false
  }

  if (keyExists(p, 'features')) {
    const merged = safeFeatures(p)
    const current = Array.isArray(p.features) ? p.features.map(compact).filter(Boolean) : []
    if (JSON.stringify(merged) !== JSON.stringify(current)) patch.features = merged
  }

  if (/\bSan c\b/i.test(title + ' ' + compact(p.address))) warnings.push('San c rilevato: lasciato invariato')
  if (!rooms && /\bbilocale\b|\btrilocale\b|\bquadrilocale\b/i.test(title)) warnings.push('rooms non inferiti dal titolo')
  if (!condition && /\bnuovo\b|\bottimo\b|\bbuono\b|\bda ristrutturare\b/i.test(title)) warnings.push('condition non inferita dal titolo')

  return {
    ref,
    title,
    patch,
    warnings,
  }
}

async function main() {
  console.log('=== CURATE SAFE IMMOBILI PUBBLICATI PORTALI ===')
  console.log(`Modalità: ${APPLY ? 'APPLY - modifica davvero Supabase' : 'DRY RUN - non modifica nulla'}`)
  console.log('Regola: niente descrizione, niente riscrittura titolo/testo, niente modifica San c.')
  console.log('')

  const properties = await supabaseFetch(
    '/rest/v1/properties?select=*&reference_code=like.IM%25AA&status=eq.published&order=reference_code.asc'
  )

  const analyses = properties.map(analyseProperty)
  const withPatch = analyses.filter((a) => Object.keys(a.patch).length > 0)

  if (APPLY) {
    for (const a of withPatch) {
      const prop = properties.find((p) => p.reference_code === a.ref)
      await patchProperty(prop.id, { ...a.patch, updated_at: new Date().toISOString() })
      console.log(`OK ${a.ref}: ${Object.keys(a.patch).join(', ')}`)
    }
  }

  const md = []
  md.push('# Curate SAFE immobili pubblicati portali')
  md.push('')
  md.push(`Generato: ${new Date().toLocaleString('it-IT')}`)
  md.push('')
  md.push(`- Modalità: **${APPLY ? 'APPLY' : 'DRY RUN'}**`)
  md.push(`- Immobili pubblicati IMxxxxAA analizzati: **${properties.length}**`)
  md.push(`- Immobili con modifiche proposte/applicate: **${withPatch.length}**`)
  md.push('- Regola: **San c non viene modificato**.')
  md.push('- Regola: **features/flag inferiti solo da titolo/tipo/features esistenti, non da descrizione**.')
  md.push('')
  md.push('| REF | Campi proposti/applicati | Warning | Titolo |')
  md.push('|---|---|---|---|')

  for (const a of analyses) {
    const keys = Object.keys(a.patch)
    md.push(`| ${a.ref} | ${keys.length ? keys.join(', ') : '-'} | ${a.warnings.join('; ') || '-'} | ${a.title} |`)
  }

  md.push('')
  md.push('## Dettaglio patch')
  md.push('')
  md.push('```json')
  md.push(JSON.stringify(withPatch, null, 2))
  md.push('```')

  fs.mkdirSync(path.dirname(REPORT_MD), { recursive: true })
  fs.writeFileSync(REPORT_MD, md.join('\n') + '\n', 'utf8')
  fs.writeFileSync(REPORT_JSON, JSON.stringify({
    generated_at: new Date().toISOString(),
    apply: APPLY,
    total: properties.length,
    with_patch: withPatch.length,
    analyses,
  }, null, 2), 'utf8')

  console.log(md.join('\n'))

  if (!APPLY) {
    console.log('')
    console.log('Dry-run completato. Se questo è pulito, applica con:')
    console.log('npm run audit:portali:curate-published -- --apply')
  } else {
    console.log('')
    console.log('OK: modifiche applicate.')
  }
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
