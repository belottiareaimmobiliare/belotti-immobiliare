import fs from 'fs'
import path from 'path'

const OUT_DIR = path.resolve('tmp/area-portali-audit')
const OUT_MD = path.join(OUT_DIR, 'audit-immobili-senza-foto.md')
const OUT_JSON = path.join(OUT_DIR, 'audit-immobili-senza-foto.json')
const OUT_CSV = path.join(OUT_DIR, 'audit-immobili-senza-foto.csv')

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return
  const text = fs.readFileSync(file, 'utf8')
  for (const line of text.split(/\r?\n/)) {
    const clean = line.trim()
    if (!clean || clean.startsWith('#') || !clean.includes('=')) continue
    const idx = clean.indexOf('=')
    const key = clean.slice(0, idx).trim()
    let value = clean.slice(idx + 1).trim()
    value = value.replace(/^['"]|['"]$/g, '')
    if (!process.env[key]) process.env[key] = value
  }
}

for (const file of ['.env.local', '.env', '.env.development.local', '.env.production.local']) {
  loadEnvFile(file)
}

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  process.env.PUBLIC_SUPABASE_URL

const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('ERRORE: variabili Supabase mancanti.')
  console.error('Servono NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY oppure equivalenti.')
  process.exit(1)
}

function compact(value) {
  return String(value ?? '').trim()
}

function euro(value) {
  if (value === null || value === undefined || value === '') return '-'
  const n = Number(value)
  if (!Number.isFinite(n)) return String(value)
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(n)
}

function normalizeGallery(value) {
  if (!value) return []
  if (Array.isArray(value)) return value.filter(Boolean)
  if (typeof value === 'string') {
    const clean = value.trim()
    if (!clean) return []
    try {
      const parsed = JSON.parse(clean)
      if (Array.isArray(parsed)) return parsed.filter(Boolean)
    } catch {}
    return clean.split(',').map((x) => x.trim()).filter(Boolean)
  }
  return []
}

async function supabaseFetch(apiPath, options = {}) {
  const url = `${SUPABASE_URL.replace(/\/$/, '')}${apiPath}`
  const res = await fetch(url, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      authorization: `Bearer ${SUPABASE_KEY}`,
      accept: 'application/json',
      ...(options.headers || {}),
    },
  })

  const text = await res.text()
  let data = null

  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }

  if (!res.ok) {
    throw new Error(`Supabase HTTP ${res.status}: ${typeof data === 'string' ? data : JSON.stringify(data)}`)
  }

  return data
}

async function fetchAll(table, select) {
  const pageSize = 1000
  let from = 0
  const rows = []

  while (true) {
    const params = new URLSearchParams()
    params.set('select', select)

    const chunk = await supabaseFetch(`/rest/v1/${table}?${params.toString()}`, {
      headers: {
        range: `${from}-${from + pageSize - 1}`,
      },
    })

    if (!Array.isArray(chunk)) {
      throw new Error(`Risposta non valida da ${table}`)
    }

    rows.push(...chunk)
    if (chunk.length < pageSize) break
    from += pageSize
  }

  return rows
}

function isImported(row) {
  const ref = compact(row.reference_code)
  return /^IM\d{4}AA$/i.test(ref) || compact(row.source_tag).toLowerCase().includes('portali')
}

function csvCell(value) {
  const s = String(value ?? '')
  return `"${s.replace(/"/g, '""')}"`
}

function loadImageCandidateMap() {
  const file = path.resolve('tmp/area-portali-audit/immagini-portali-per-ref.json')
  const map = new Map()
  if (!fs.existsSync(file)) return map

  try {
    const raw = JSON.parse(fs.readFileSync(file, 'utf8'))
    const objects = []

    function walk(x) {
      if (!x) return
      if (Array.isArray(x)) {
        for (const item of x) walk(item)
        return
      }
      if (typeof x === 'object') {
        objects.push(x)
        for (const value of Object.values(x)) walk(value)
      }
    }

    walk(raw)

    for (const obj of objects) {
      const ref = compact(obj.reference_code || obj.referenceCode || obj.ref || obj.REF)
      if (!/^IM\d{4}AA$/i.test(ref)) continue

      const status = compact(obj.status || obj.stato || obj.state || obj.esito || '-')
      let count = 0

      for (const key of ['images', 'immagini', 'image_count', 'images_count', 'candidate_count', 'candidateImagesCount']) {
        const value = obj[key]
        if (typeof value === 'number') count = Math.max(count, value)
        if (Array.isArray(value)) count = Math.max(count, value.length)
      }

      for (const key of ['urls', 'image_urls', 'imageUrls', 'candidate_urls', 'candidateUrls']) {
        const value = obj[key]
        if (Array.isArray(value)) count = Math.max(count, value.length)
      }

      const old = map.get(ref)
      if (!old || count > old.candidate_images) {
        map.set(ref, {
          image_status: status || '-',
          candidate_images: count,
        })
      }
    }
  } catch {
    return map
  }

  return map
}

function rowLine(row) {
  return `| ${row.reference_code || '-'} | ${row.status || '-'} | ${row.contract_type || '-'} | ${row.price_label} | ${row.city || row.comune || '-'} | ${row.area || '-'} | ${row.media_photos} | ${row.legacy_gallery} | ${row.main_image ? 'sì' : 'no'} | ${row.image_candidate_status || '-'} | ${row.image_candidate_count ?? '-'} | ${row.title || '-'} |`
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })

  console.log('=== AUDIT IMMOBILI SENZA FOTO ===')
  console.log('Modalità: sola lettura, non modifica nulla.')

  const properties = await fetchAll(
    'properties',
    [
      'id',
      'reference_code',
      'title',
      'slug',
      'status',
      'contract_type',
      'property_type',
      'price',
      'city',
      'comune',
      'province',
      'area',
      'address',
      'main_image',
      'gallery',
      'photo_coming_soon',
      'no_photo_available',
      'source_tag',
      'imported_at',
      'created_at',
      'updated_at',
    ].join(',')
  )

  const media = await fetchAll(
    'property_media',
    [
      'id',
      'property_id',
      'media_type',
      'file_url',
      'label',
      'is_cover',
      'sort_order',
      'created_at',
    ].join(',')
  )

  const mediaByProperty = new Map()
  for (const item of media) {
    const pid = compact(item.property_id)
    if (!pid) continue
    if (!mediaByProperty.has(pid)) mediaByProperty.set(pid, [])
    mediaByProperty.get(pid).push(item)
  }

  const imageCandidateMap = loadImageCandidateMap()

  const rows = properties.map((p) => {
    const propertyMedia = mediaByProperty.get(p.id) || []
    const photoMedia = propertyMedia.filter((m) => compact(m.media_type).toLowerCase() !== 'plan')
    const gallery = normalizeGallery(p.gallery)
    const ref = compact(p.reference_code)
    const candidate = imageCandidateMap.get(ref)

    const hasPhoto =
      photoMedia.length > 0 ||
      compact(p.main_image) ||
      gallery.length > 0

    return {
      id: p.id,
      reference_code: ref,
      imported: isImported(p),
      status: compact(p.status),
      title: compact(p.title),
      slug: compact(p.slug),
      contract_type: compact(p.contract_type),
      property_type: compact(p.property_type),
      price: p.price,
      price_label: euro(p.price),
      city: compact(p.city || p.comune),
      comune: compact(p.comune),
      province: compact(p.province),
      area: compact(p.area),
      address: compact(p.address),
      main_image: compact(p.main_image),
      legacy_gallery: gallery.length,
      media_total: propertyMedia.length,
      media_photos: photoMedia.length,
      has_photo: hasPhoto,
      photo_coming_soon: Boolean(p.photo_coming_soon),
      no_photo_available: Boolean(p.no_photo_available),
      image_candidate_status: candidate?.image_status || '',
      image_candidate_count: candidate?.candidate_images ?? '',
      created_at: p.created_at,
      updated_at: p.updated_at,
    }
  })

  const withoutPhotos = rows.filter((r) => !r.has_photo)
  const withPhotos = rows.filter((r) => r.has_photo)
  const publishedWithout = withoutPhotos.filter((r) => r.status === 'published')
  const draftWithout = withoutPhotos.filter((r) => r.status === 'draft')
  const importedWithout = withoutPhotos.filter((r) => r.imported)
  const importedWith = rows.filter((r) => r.imported && r.has_photo)

  const importedWithoutCandidates = importedWithout.filter((r) => Number(r.image_candidate_count || 0) > 0)
  const importedWithoutNoCandidates = importedWithout.filter((r) => !Number(r.image_candidate_count || 0))

  const sortRows = (list) => [...list].sort((a, b) => {
    const statusWeight = (x) => x.status === 'published' ? 0 : x.status === 'draft' ? 1 : 2
    return statusWeight(a) - statusWeight(b) ||
      Number(b.imported) - Number(a.imported) ||
      compact(a.reference_code).localeCompare(compact(b.reference_code)) ||
      compact(a.title).localeCompare(compact(b.title))
  })

  const md = []

  md.push('# Audit immobili senza foto')
  md.push('')
  md.push(`Generato: ${new Date().toLocaleString('it-IT')}`)
  md.push('')
  md.push('## Riepilogo')
  md.push('')
  md.push(`- Immobili totali: **${rows.length}**`)
  md.push(`- Immobili con almeno 1 foto/gallery/main_image: **${withPhotos.length}**`)
  md.push(`- Immobili senza foto: **${withoutPhotos.length}**`)
  md.push(`- Pubblicati senza foto: **${publishedWithout.length}**`)
  md.push(`- Draft senza foto: **${draftWithout.length}**`)
  md.push(`- Importati REF IMxxxxAA con foto: **${importedWith.length}**`)
  md.push(`- Importati REF IMxxxxAA senza foto: **${importedWithout.length}**`)
  md.push(`- Importati senza foto ma con candidate nel vecchio report immagini: **${importedWithoutCandidates.length}**`)
  md.push(`- Importati senza foto e senza candidate note: **${importedWithoutNoCandidates.length}**`)
  md.push('')
  md.push('## Pubblicati senza foto')
  md.push('')
  if (!publishedWithout.length) {
    md.push('Nessun immobile pubblicato risulta senza foto.')
  } else {
    md.push('| REF | Stato | Contratto | Prezzo | Comune | Zona | Media foto | Gallery | Main image | Stato candidate | Candidate | Titolo |')
    md.push('|---|---|---|---:|---|---|---:|---:|---|---|---:|---|')
    for (const row of sortRows(publishedWithout)) md.push(rowLine(row))
  }

  md.push('')
  md.push('## Draft importati senza foto')
  md.push('')
  if (!importedWithout.length) {
    md.push('Nessun draft importato risulta senza foto.')
  } else {
    md.push('| REF | Stato | Contratto | Prezzo | Comune | Zona | Media foto | Gallery | Main image | Stato candidate | Candidate | Titolo |')
    md.push('|---|---|---|---:|---|---|---:|---:|---|---|---:|---|')
    for (const row of sortRows(importedWithout)) md.push(rowLine(row))
  }

  md.push('')
  md.push('## Altri immobili senza foto')
  md.push('')
  const otherWithout = withoutPhotos.filter((r) => !r.imported && r.status !== 'published')
  if (!otherWithout.length) {
    md.push('Nessun altro immobile senza foto.')
  } else {
    md.push('| REF | Stato | Contratto | Prezzo | Comune | Zona | Media foto | Gallery | Main image | Stato candidate | Candidate | Titolo |')
    md.push('|---|---|---|---:|---|---|---:|---:|---|---|---:|---|')
    for (const row of sortRows(otherWithout)) md.push(rowLine(row))
  }

  md.push('')
  md.push('## Copertura foto immobili importati')
  md.push('')
  md.push('| REF | Stato | Foto presenti | Media foto | Gallery | Candidate vecchio audit | Titolo |')
  md.push('|---|---|---|---:|---:|---:|---|')
  for (const row of sortRows(rows.filter((r) => r.imported))) {
    md.push(`| ${row.reference_code || '-'} | ${row.status || '-'} | ${row.has_photo ? 'sì' : 'no'} | ${row.media_photos} | ${row.legacy_gallery} | ${row.image_candidate_count || 0} | ${row.title || '-'} |`)
  }

  md.push('')
  md.push('## Nota operativa')
  md.push('')
  md.push('- Questo report non modifica Supabase.')
  md.push('- Gli immobili importati senza foto possono essere gestiti in due modi: import immagini solo dopo verifica, oppure mostrare placeholder/“foto in arrivo”.')
  md.push('- Non importare automaticamente immagini REVIEW: rischiamo di mettere foto sbagliate su immobili diversi.')

  fs.writeFileSync(OUT_MD, md.join('\n') + '\n', 'utf8')
  fs.writeFileSync(OUT_JSON, JSON.stringify({
    generated_at: new Date().toISOString(),
    summary: {
      total: rows.length,
      with_photos: withPhotos.length,
      without_photos: withoutPhotos.length,
      published_without_photos: publishedWithout.length,
      draft_without_photos: draftWithout.length,
      imported_with_photos: importedWith.length,
      imported_without_photos: importedWithout.length,
      imported_without_photos_with_candidates: importedWithoutCandidates.length,
      imported_without_photos_without_candidates: importedWithoutNoCandidates.length,
    },
    rows,
    without_photos: withoutPhotos,
    published_without_photos: publishedWithout,
    imported_without_photos: importedWithout,
  }, null, 2), 'utf8')

  const csv = [
    [
      'reference_code',
      'status',
      'imported',
      'has_photo',
      'media_photos',
      'legacy_gallery',
      'main_image',
      'candidate_images',
      'candidate_status',
      'contract_type',
      'price',
      'city',
      'province',
      'area',
      'address',
      'title',
      'slug',
    ].map(csvCell).join(','),
    ...rows.map((r) => [
      r.reference_code,
      r.status,
      r.imported ? 'yes' : 'no',
      r.has_photo ? 'yes' : 'no',
      r.media_photos,
      r.legacy_gallery,
      r.main_image ? 'yes' : 'no',
      r.image_candidate_count || 0,
      r.image_candidate_status || '',
      r.contract_type,
      r.price_label,
      r.city,
      r.province,
      r.area,
      r.address,
      r.title,
      r.slug,
    ].map(csvCell).join(',')),
  ].join('\n')

  fs.writeFileSync(OUT_CSV, csv + '\n', 'utf8')

  console.log('')
  console.log('=== AUDIT CREATO ===')
  console.log(OUT_MD)
  console.log(OUT_JSON)
  console.log(OUT_CSV)
  console.log('')
  console.log(md.slice(0, 180).join('\n'))
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
