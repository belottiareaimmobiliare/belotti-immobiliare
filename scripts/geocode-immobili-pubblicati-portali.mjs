import fs from 'fs'
import path from 'path'

const APPLY = process.argv.includes('--apply')
const ONLY_MISSING = !process.argv.includes('--all')
const REPORT_MD = path.resolve('tmp/area-portali-audit/geocode-immobili-pubblicati-portali.md')
const REPORT_JSON = path.resolve('tmp/area-portali-audit/geocode-immobili-pubblicati-portali.json')

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

function v(x) {
  return String(x ?? '').trim()
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function hasCoords(p) {
  return p.latitude !== null && p.latitude !== undefined && p.longitude !== null && p.longitude !== undefined
}

function cleanQueryPart(x) {
  return v(x)
    .replace(/\s+/g, ' ')
    .replace(/\s+,/g, ',')
    .trim()
}

function buildCandidates(p) {
  const address = cleanQueryPart(p.address)
  const area = cleanQueryPart(p.area)
  const comune = cleanQueryPart(p.comune || p.city)
  const province = cleanQueryPart(p.province)

  const candidates = []

  if (address && area && comune) {
    candidates.push({
      level: 'address_area_comune',
      query: `${address}, ${area}, ${comune}, ${province}, Italia`,
    })
  }

  if (address && comune) {
    candidates.push({
      level: 'address_comune',
      query: `${address}, ${comune}, ${province}, Italia`,
    })
  }

  if (area && comune) {
    candidates.push({
      level: 'area_comune',
      query: `${area}, ${comune}, ${province}, Italia`,
    })
  }

  if (comune) {
    candidates.push({
      level: 'comune',
      query: `${comune}, ${province}, Italia`,
    })
  }

  const seen = new Set()
  return candidates.filter((c) => {
    const key = c.query.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
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

async function geocode(query) {
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('limit', '1')
  url.searchParams.set('countrycodes', 'it')
  url.searchParams.set('accept-language', 'it')
  url.searchParams.set('q', query)

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'belotti-immobiliare-geocode-audit/1.0',
      'Accept': 'application/json',
    },
  })

  if (!res.ok) {
    return {
      ok: false,
      error: `${res.status} ${res.statusText}`,
    }
  }

  const data = await res.json()
  const first = Array.isArray(data) ? data[0] : null

  if (!first || first.lat === undefined || first.lon === undefined) {
    return {
      ok: false,
      error: 'nessun risultato',
    }
  }

  return {
    ok: true,
    latitude: Number(first.lat),
    longitude: Number(first.lon),
    display_name: first.display_name || '',
    class: first.class || '',
    type: first.type || '',
    importance: first.importance ?? null,
  }
}

async function main() {
  console.log('=== GEOCODE IMMOBILI PUBBLICATI PORTALI ===')
  console.log(`Modalità: ${APPLY ? 'APPLY - aggiorna davvero Supabase' : 'DRY RUN - non modifica nulla'}`)
  console.log(`Target: ${ONLY_MISSING ? 'solo immobili senza coordinate' : 'tutti gli immobili pubblicati IMxxxxAA'}`)
  console.log('')

  const all = await supabaseFetch(
    '/rest/v1/properties?select=id,reference_code,title,status,province,comune,city,area,address,latitude,longitude,location_mode,geocode_query,geocode_status&reference_code=like.IM%25AA&status=eq.published&order=reference_code.asc'
  )

  const target = ONLY_MISSING ? all.filter((p) => !hasCoords(p)) : all
  const results = []

  for (const p of target) {
    const candidates = buildCandidates(p)
    let chosen = null
    const attempts = []

    for (const candidate of candidates) {
      await sleep(1200)
      const r = await geocode(candidate.query)
      attempts.push({ ...candidate, result: r })

      if (r.ok) {
        chosen = {
          level: candidate.level,
          query: candidate.query,
          ...r,
        }
        break
      }
    }

    const patch = chosen
      ? {
          latitude: chosen.latitude,
          longitude: chosen.longitude,
          geocode_query: chosen.query,
          geocode_status: chosen.level,
          location_mode: chosen.level.includes('address') ? 'address' : chosen.level.includes('area') ? 'area' : 'comune',
          updated_at: new Date().toISOString(),
        }
      : {
          geocode_query: candidates[0]?.query || null,
          geocode_status: 'not_found',
          updated_at: new Date().toISOString(),
        }

    if (APPLY) {
      await patchProperty(p.id, patch)
      console.log(`${chosen ? 'OK' : 'KO'} ${p.reference_code}: ${chosen ? `${chosen.latitude}, ${chosen.longitude} [${chosen.level}]` : 'nessun risultato'}`)
    } else {
      console.log(`${chosen ? 'OK' : 'KO'} ${p.reference_code}: ${chosen ? `${chosen.latitude}, ${chosen.longitude} [${chosen.level}]` : 'nessun risultato'}`)
    }

    results.push({
      ref: p.reference_code,
      title: p.title,
      current_latitude: p.latitude,
      current_longitude: p.longitude,
      province: p.province,
      comune: p.comune,
      city: p.city,
      area: p.area,
      address: p.address,
      chosen,
      patch,
      attempts,
    })
  }

  const success = results.filter((r) => r.chosen).length
  const failed = results.length - success

  const md = []
  md.push('# Geocode immobili pubblicati portali')
  md.push('')
  md.push(`Generato: ${new Date().toLocaleString('it-IT')}`)
  md.push('')
  md.push('## Riepilogo')
  md.push('')
  md.push(`- Modalità: **${APPLY ? 'APPLY' : 'DRY RUN'}**`)
  md.push(`- Immobili pubblicati IMxxxxAA totali: **${all.length}**`)
  md.push(`- Target geocodifica: **${target.length}**`)
  md.push(`- Geocodificati: **${success}**`)
  md.push(`- Non trovati: **${failed}**`)
  md.push('')
  md.push('## Dettaglio')
  md.push('')
  md.push('| REF | Esito | Livello | Query usata | Coordinate | Titolo |')
  md.push('|---|---|---|---|---|---|')

  for (const r of results) {
    md.push(`| ${r.ref} | ${r.chosen ? 'OK' : 'KO'} | ${r.chosen?.level || '-'} | ${r.chosen?.query || r.patch.geocode_query || '-'} | ${r.chosen ? `${r.chosen.latitude}, ${r.chosen.longitude}` : '-'} | ${r.title} |`)
  }

  fs.mkdirSync(path.dirname(REPORT_MD), { recursive: true })
  fs.writeFileSync(REPORT_MD, md.join('\n') + '\n', 'utf8')
  fs.writeFileSync(REPORT_JSON, JSON.stringify({
    generated_at: new Date().toISOString(),
    apply: APPLY,
    total: all.length,
    target: target.length,
    success,
    failed,
    results,
  }, null, 2), 'utf8')

  console.log('')
  console.log(md.join('\n'))

  if (!APPLY) {
    console.log('')
    console.log('Dry-run completato. Se le coordinate sono sensate, applica con:')
    console.log('npm run audit:portali:geocode -- --apply')
  } else {
    console.log('')
    console.log('OK: coordinate aggiornate.')
  }
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
