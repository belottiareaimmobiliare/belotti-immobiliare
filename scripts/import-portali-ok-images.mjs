import fs from 'node:fs/promises'
import path from 'node:path'

const ROOT = process.cwd()
const REPORT_JSON = path.join(ROOT, 'tmp', 'area-portali-audit', 'immagini-portali-per-ref.json')
const OUT_DIR = path.join(ROOT, 'tmp', 'area-portali-audit')
const OUT_MD = path.join(OUT_DIR, 'import-immagini-portali-ok.md')
const OUT_JSON = path.join(OUT_DIR, 'import-immagini-portali-ok.json')

const APPLY = process.argv.includes('--apply')
const FORCE = process.argv.includes('--force')
const MAX_IMAGES_PER_PROPERTY = Number(process.env.PORTAL_IMAGES_MAX || 12)

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
    throw new Error('Variabili Supabase mancanti. Servono NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.')
  }

  return {
    baseUrl: supabaseUrl.replace(/\/$/, ''),
    key: supabaseKey,
    env,
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

async function fetchBuckets() {
  try {
    return await supabaseFetch('/storage/v1/bucket')
  } catch {
    return []
  }
}

async function detectBucket() {
  const cfg = await supabaseConfig()
  const explicit =
    cfg.env.PROPERTY_MEDIA_BUCKET ||
    cfg.env.SUPABASE_STORAGE_BUCKET ||
    cfg.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ||
    cfg.env.NEXT_PUBLIC_PROPERTY_MEDIA_BUCKET

  if (explicit) return explicit

  const buckets = await fetchBuckets()
  const names = buckets.map((bucket) => bucket.name || bucket.id).filter(Boolean)

  const preferred = [
    'property-media',
    'property_media',
    'properties',
    'immobili',
    'media',
    'images',
    'property-images',
  ]

  for (const wanted of preferred) {
    if (names.includes(wanted)) return wanted
  }

  if (names.length === 1) return names[0]

  throw new Error(`Bucket storage non rilevato. Bucket disponibili: ${names.join(', ') || 'nessuno'}. Imposta PROPERTY_MEDIA_BUCKET nel .env.local.`)
}

async function fetchImportedProperties(refs) {
  const select = encodeURIComponent('id,title,slug,reference_code,status')
  const refsFilter = refs.map((ref) => `"${ref}"`).join(',')
  return await supabaseFetch(`/rest/v1/properties?select=${select}&reference_code=in.(${refsFilter})`)
}

async function fetchPropertyMedia(propertyId) {
  const select = encodeURIComponent('id,property_id,file_url,label,sort_order,is_cover')
  return await supabaseFetch(`/rest/v1/property_media?select=${select}&property_id=eq.${propertyId}`)
}

function contentTypeToExt(contentType = '') {
  if (contentType.includes('webp')) return 'webp'
  if (contentType.includes('png')) return 'png'
  return 'jpg'
}

function imageIdFromUrl(url = '') {
  const match = url.match(/\/image\/(\d+)\//i)
  if (match) return match[1]

  return normalize(url).slice(0, 40).replace(/[^a-z0-9]+/g, '-')
}

function urlVariants(url = '') {
  const out = new Set()
  out.add(url)

  if (url.includes('/xxs-c.')) {
    out.add(url.replace('/xxs-c.', '/xxl.'))
    out.add(url.replace('/xxs-c.', '/xxl-c.'))
    out.add(url.replace('/xxs-c.', '/large.'))
    out.add(url.replace('/xxs-c.', '/m-c.'))
  }

  if (url.includes('/360x265/')) {
    out.add(url.replace('/360x265/', '/original/'))
    out.add(url.replace('/360x265/', '/745x559/'))
  }

  return [...out]
}

async function fetchBestImage(url) {
  const variants = urlVariants(url)

  for (const candidate of variants) {
    try {
      const response = await fetch(candidate, {
        headers: {
          'user-agent': 'Mozilla/5.0 portal-media-import',
          accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        },
      })

      if (!response.ok) continue

      const contentType = response.headers.get('content-type') || ''
      if (!contentType.startsWith('image/')) continue

      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      if (buffer.length < 5000) continue

      return {
        sourceUrl: url,
        finalUrl: candidate,
        contentType,
        ext: contentTypeToExt(contentType),
        buffer,
        bytes: buffer.length,
      }
    } catch {}
  }

  throw new Error(`Download immagine non riuscito: ${url}`)
}

async function uploadToStorage(bucket, objectPath, image) {
  const cfg = await supabaseConfig()

  const response = await fetch(`${cfg.baseUrl}/storage/v1/object/${bucket}/${objectPath}`, {
    method: 'POST',
    headers: {
      apikey: cfg.key,
      authorization: `Bearer ${cfg.key}`,
      'content-type': image.contentType,
      'cache-control': '31536000',
      'x-upsert': 'false',
    },
    body: image.buffer,
  })

  const text = await response.text()

  if (!response.ok && response.status !== 409) {
    throw new Error(`Storage upload ${response.status}: ${text.slice(0, 700)}`)
  }

  return `${cfg.baseUrl}/storage/v1/object/public/${bucket}/${objectPath}`
}

async function insertMedia(row) {
  return await supabaseFetch('/rest/v1/property_media', {
    method: 'POST',
    headers: {
      prefer: 'return=representation',
    },
    body: JSON.stringify(row),
  })
}

async function patchProperty(propertyId, urls) {
  if (!urls.length) return

  await supabaseFetch(`/rest/v1/properties?id=eq.${propertyId}`, {
    method: 'PATCH',
    headers: {
      prefer: 'return=minimal',
    },
    body: JSON.stringify({
      main_image: urls[0],
      gallery: urls,
      photo_coming_soon: false,
      no_photo_available: false,
    }),
  })
}

function isOkRow(row) {
  return row.status === 'OK' && row.suspicious !== true && Number(row.image_count || 0) > 0
}

async function main() {
  const report = JSON.parse(await fs.readFile(REPORT_JSON, 'utf8'))
  const okRows = (report.rows || []).filter(isOkRow)
  const refs = okRows.map((row) => row.reference_code)

  const bucket = await detectBucket()
  const properties = await fetchImportedProperties(refs)
  const propertyByRef = new Map(properties.map((property) => [property.reference_code, property]))

  const plan = []

  for (const row of okRows) {
    const property = propertyByRef.get(row.reference_code)

    if (!property) {
      plan.push({
        ...row,
        action: 'SKIP',
        reason: 'property non trovata in Supabase',
        property_id: null,
        existing_media: 0,
        images_to_import: [],
      })
      continue
    }

    const existingMedia = await fetchPropertyMedia(property.id)

    const wantedImages = row.images.slice(0, MAX_IMAGES_PER_PROPERTY)

    if (existingMedia.length && !FORCE && existingMedia.length >= wantedImages.length) {
      plan.push({
        ...row,
        action: 'SKIP',
        reason: `ha già ${existingMedia.length} media collegati`,
        property_id: property.id,
        existing_media: existingMedia.length,
        images_to_import: [],
      })
      continue
    }

    const imagesToImport = FORCE ? wantedImages : wantedImages.slice(existingMedia.length)

    plan.push({
      ...row,
      action: imagesToImport.length ? 'IMPORT' : 'SKIP',
      reason: existingMedia.length
        ? `resume: ha già ${existingMedia.length} media, importa le restanti ${imagesToImport.length}`
        : '',
      property_id: property.id,
      existing_media: existingMedia.length,
      images_to_import: imagesToImport,
      start_sort_order: FORCE ? 1 : existingMedia.length + 1,
    })
  }

  const importRows = plan.filter((row) => row.action === 'IMPORT')
  const skipRows = plan.filter((row) => row.action === 'SKIP')
  const totalImages = importRows.reduce((sum, row) => sum + row.images_to_import.length, 0)

  const mdLines = [
    '# Import immagini portali OK',
    '',
    `Generato: ${new Date().toLocaleString('it-IT')}`,
    '',
    '## Riepilogo',
    '',
    `- Modalità: **${APPLY ? 'APPLY' : 'DRY RUN'}**`,
    `- Bucket rilevato: **${bucket}**`,
    `- Immobili OK nel report immagini: **${okRows.length}**`,
    `- Immobili da importare: **${importRows.length}**`,
    `- Immobili saltati: **${skipRows.length}**`,
    `- Max immagini per immobile: **${MAX_IMAGES_PER_PROPERTY}**`,
    `- Immagini candidate da importare: **${totalImages}**`,
    '',
    '## Piano',
    '',
    '| REF | Azione | Immagini | Immobile | Motivo |',
    '|---|---|---:|---|---|',
    ...plan.map((row) => `| ${safeCell(row.reference_code)} | ${safeCell(row.action)} | ${row.images_to_import.length} | ${safeCell(row.title)} | ${safeCell(row.reason || '-')} |`),
    '',
  ]

  const results = []

  console.log('')
  console.log('=== IMPORT IMMAGINI PORTALI OK ===')
  console.log(`Modalità: ${APPLY ? 'APPLY - scrive storage/property_media' : 'DRY RUN - non scrive nulla'}`)
  console.log(`Bucket: ${bucket}`)
  console.log(`Immobili da importare: ${importRows.length}`)
  console.log(`Immagini candidate: ${totalImages}`)
  console.log('')

  for (const row of plan) {
    console.log(`${row.action} ${row.reference_code} | immagini: ${row.images_to_import.length} | ${row.title}${row.reason ? ` | ${row.reason}` : ''}`)
  }

  if (!APPLY) {
    await fs.writeFile(OUT_MD, mdLines.join('\n'), 'utf8')
    await fs.writeFile(OUT_JSON, JSON.stringify({
      generatedAt: new Date().toISOString(),
      mode: 'dry-run',
      bucket,
      counts: {
        okRows: okRows.length,
        importProperties: importRows.length,
        skippedProperties: skipRows.length,
        totalImages,
      },
      plan,
    }, null, 2), 'utf8')

    console.log('')
    console.log('Dry-run completato. Nessun file scaricato o caricato.')
    console.log('Report creato:')
    console.log('tmp/area-portali-audit/import-immagini-portali-ok.md')
    console.log('tmp/area-portali-audit/import-immagini-portali-ok.json')
    return
  }

  console.log('')
  console.log('=== SCRITTURA IMMAGINI ===')

  for (const row of importRows) {
    const publicUrls = []

    const startSortOrder = Number(row.start_sort_order || 1)

    for (let index = 0; index < row.images_to_import.length; index += 1) {
      const sourceUrl = row.images_to_import[index]
      const image = await fetchBestImage(sourceUrl)
      const imageId = imageIdFromUrl(sourceUrl)
      const sortOrder = startSortOrder + index
      const objectPath = `portali/${row.reference_code}/${String(sortOrder).padStart(2, '0')}-${imageId}.${image.ext}`

      const publicUrl = await uploadToStorage(bucket, objectPath, image)
      publicUrls.push(publicUrl)

      await insertMedia({
        property_id: row.property_id,
        media_type: 'image',
        file_url: publicUrl,
        label: `Import portali ${row.reference_code}`,
        sort_order: sortOrder,
        is_cover: sortOrder === 1,
      })

      console.log(`OK ${row.reference_code} ${index + 1}/${row.images_to_import.length} ${Math.round(image.bytes / 1024)} KB`)
    }

    if (publicUrls.length) {
      await patchProperty(row.property_id, publicUrls)
    }

    results.push({
      reference_code: row.reference_code,
      property_id: row.property_id,
      imported: publicUrls.length,
      urls: publicUrls,
    })
  }

  await fs.writeFile(OUT_MD, [
    ...mdLines,
    '',
    '## Risultati APPLY',
    '',
    ...results.map((row) => `- ${row.reference_code}: ${row.imported} immagini importate`),
    '',
  ].join('\n'), 'utf8')

  await fs.writeFile(OUT_JSON, JSON.stringify({
    generatedAt: new Date().toISOString(),
    mode: 'apply',
    bucket,
    counts: {
      okRows: okRows.length,
      importProperties: importRows.length,
      skippedProperties: skipRows.length,
      totalImages,
      importedImages: results.reduce((sum, row) => sum + row.imported, 0),
    },
    plan,
    results,
  }, null, 2), 'utf8')

  console.log('')
  console.log(`Completato. Immagini importate: ${results.reduce((sum, row) => sum + row.imported, 0)}/${totalImages}`)
  console.log('Report aggiornato:')
  console.log('tmp/area-portali-audit/import-immagini-portali-ok.md')
  console.log('tmp/area-portali-audit/import-immagini-portali-ok.json')
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
