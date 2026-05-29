import fs from 'fs'
import path from 'path'

const REPORT_MD = path.resolve('tmp/area-portali-audit/audit-location-immobili-pubblicati-portali.md')
const REPORT_JSON = path.resolve('tmp/area-portali-audit/audit-location-immobili-pubblicati-portali.json')

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

async function supabaseFetch(restPath) {
  const res = await fetch(`${SUPABASE_URL}${restPath}`, {
    headers: {
      apikey: SERVICE_KEY,
      authorization: `Bearer ${SERVICE_KEY}`,
      'content-type': 'application/json',
    },
  })

  const text = await res.text()
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${text.slice(0, 1200)}`)
  return text ? JSON.parse(text) : null
}

function hasStreetLikeAddress(address) {
  const a = v(address).toLowerCase()
  return /\bvia\b|\bviale\b|\bvicolo\b|\bpiazza\b|\blargo\b|\bcorso\b|\bstrada\b|\bloc\.|\blocalità\b/.test(a)
}

function hasCivicNumber(address) {
  return /\d+/.test(v(address))
}

async function main() {
  const rows = await supabaseFetch(
    '/rest/v1/properties?select=reference_code,title,status,province,comune,city,area,address,latitude,longitude,location_mode&reference_code=like.IM%25AA&status=eq.published&order=reference_code.asc'
  )

  const analysed = rows.map((p) => {
    const hasProvince = Boolean(v(p.province))
    const hasComune = Boolean(v(p.comune))
    const hasCity = Boolean(v(p.city))
    const hasArea = Boolean(v(p.area))
    const hasAddress = Boolean(v(p.address))
    const hasStreet = hasStreetLikeAddress(p.address)
    const hasNumber = hasCivicNumber(p.address)
    const hasCoords = p.latitude !== null && p.latitude !== undefined && p.longitude !== null && p.longitude !== undefined

    return {
      ref: p.reference_code,
      title: p.title,
      province: p.province,
      comune: p.comune,
      city: p.city,
      area: p.area,
      address: p.address,
      has_province: hasProvince,
      has_comune: hasComune,
      has_city: hasCity,
      has_area: hasArea,
      has_address: hasAddress,
      has_street_like_address: hasStreet,
      has_civic_number: hasNumber,
      has_coords: hasCoords,
      ok_minimo: hasProvince && hasComune && hasCity,
      ok_via: hasProvince && hasComune && hasCity && hasAddress,
      ok_via_civico: hasProvince && hasComune && hasCity && hasAddress && hasNumber,
    }
  })

  const summary = {
    total: analysed.length,
    con_province_comune_city: analysed.filter(r => r.ok_minimo).length,
    senza_province_comune_city: analysed.filter(r => !r.ok_minimo).length,
    con_address: analysed.filter(r => r.has_address).length,
    con_address_tipo_via: analysed.filter(r => r.has_street_like_address).length,
    con_address_e_civico: analysed.filter(r => r.ok_via_civico).length,
    con_area: analysed.filter(r => r.has_area).length,
    con_coordinate: analysed.filter(r => r.has_coords).length,
  }

  const md = []
  md.push('# Audit location immobili pubblicati portali')
  md.push('')
  md.push(`Generato: ${new Date().toLocaleString('it-IT')}`)
  md.push('')
  md.push('## Riepilogo')
  md.push('')
  md.push(`- Immobili pubblicati IMxxxxAA: **${summary.total}**`)
  md.push(`- Con provincia + comune + city: **${summary.con_province_comune_city}**`)
  md.push(`- Senza provincia/comune/city completa: **${summary.senza_province_comune_city}**`)
  md.push(`- Con campo address valorizzato: **${summary.con_address}**`)
  md.push(`- Con address tipo via/viale/vicolo/piazza: **${summary.con_address_tipo_via}**`)
  md.push(`- Con address e numero civico: **${summary.con_address_e_civico}**`)
  md.push(`- Con area/zona: **${summary.con_area}**`)
  md.push(`- Con coordinate: **${summary.con_coordinate}**`)
  md.push('')
  md.push('## Dettaglio')
  md.push('')
  md.push('| REF | Provincia | Comune | City | Area | Address | Civico | Coordinate | Titolo |')
  md.push('|---|---|---|---|---|---|---|---|---|')

  for (const r of analysed) {
    md.push(`| ${r.ref} | ${v(r.province) || '❌'} | ${v(r.comune) || '❌'} | ${v(r.city) || '❌'} | ${v(r.area) || '-'} | ${v(r.address) || '-'} | ${r.has_civic_number ? 'sì' : '-'} | ${r.has_coords ? 'sì' : '-'} | ${r.title} |`)
  }

  fs.mkdirSync(path.dirname(REPORT_MD), { recursive: true })
  fs.writeFileSync(REPORT_MD, md.join('\n') + '\n', 'utf8')
  fs.writeFileSync(REPORT_JSON, JSON.stringify({ generated_at: new Date().toISOString(), summary, rows: analysed }, null, 2), 'utf8')

  console.log(md.join('\n'))
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
