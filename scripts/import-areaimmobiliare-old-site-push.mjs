import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { createClient } from '@supabase/supabase-js'

const DEFAULT_INPUT_FILE = path.join(
  process.cwd(),
  'data',
  'imports',
  'areaimmobiliare-clean-import.json',
)

const BUCKET_NAME = 'property-media'

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/)

  for (const line of lines) {
    const clean = line.trim()

    if (!clean || clean.startsWith('#')) continue

    const match = clean.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
    if (!match) continue

    const key = match[1]
    let value = match[2].trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}

loadEnvFile(path.join(process.cwd(), '.env.local'))

const args = Object.fromEntries(
  process.argv
    .slice(2)
    .filter((arg) => arg.startsWith('--'))
    .map((arg) => {
      const [key, ...valueParts] = arg.replace(/^--/, '').split('=')
      return [key, valueParts.join('=') || 'true']
    }),
)

const DRY_RUN = args['dry-run'] === 'true'
const LIMIT = Number(args.limit || 0)
const MAX_IMAGES_PER_PROPERTY = Number(args['max-images-per-property'] ?? 12)
const DELAY_MS = Number(args['delay-ms'] || 250)
const INPUT_FILE = args.input
  ? path.resolve(process.cwd(), args.input)
  : DEFAULT_INPUT_FILE

const SAFE_PROPERTY_TYPES = new Set([
  'appartamento',
  'attico',
  'villa',
  'bilocale',
  'trilocale',
  'quadrilocale',
  'pentalocale',
  'ufficio',
  'negozio',
  'box',
  'terreno',
  'rustico',
  'palazzo',
  'magazzino',
])

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function cleanText(value) {
  return String(value || '')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t\r\n]+/g, ' ')
    .replace(/\s+([.,;:!?])/g, '$1')
    .trim()
}

function slugify(value) {
  return cleanText(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 90)
}

function sanitizeFileName(value, fallback) {
  const clean = String(value || '')
    .split('?')[0]
    .split('#')[0]
    .split('/')
    .pop()

  return (clean || fallback)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120) || fallback
}

function extFromContentType(contentType, fallback = 'jpg') {
  const clean = String(contentType || '').split(';')[0].trim().toLowerCase()

  if (clean === 'image/jpeg' || clean === 'image/jpg') return 'jpg'
  if (clean === 'image/png') return 'png'
  if (clean === 'image/webp') return 'webp'
  if (clean === 'image/gif') return 'gif'

  return fallback
}

function inferFallbackContractType(property) {
  const title = cleanText(property.title).toLowerCase()
  const price = Number(property.price || 0)

  if (property.contract_type === 'vendita' || property.contract_type === 'affitto') {
    return property.contract_type
  }

  if (title.includes('locato') || title.includes('vendesi')) return 'vendita'
  if (title.includes('affitto') || title.includes('affittasi')) return 'affitto'

  if (price > 0 && price < 10000) return 'affitto'
  if (price >= 10000) return 'vendita'

  return null
}

function normalizePropertyType(value, property = null) {
  const clean = cleanText(value).toLowerCase()
  const title = cleanText(property?.title).toLowerCase()
  const url = cleanText(property?.old_source_url).toLowerCase()
  const haystack = `${clean} ${title} ${url}`

  if (clean && SAFE_PROPERTY_TYPES.has(clean)) return clean

  if (haystack.includes('uffici') || haystack.includes('ufficio')) return 'ufficio'
  if (haystack.includes('ristorante') || haystack.includes('negozio')) return 'negozio'
  if (haystack.includes('terreno') || haystack.includes('area edificabile')) return 'terreno'
  if (haystack.includes('quadrilocali') || haystack.includes('quadrilocale')) return 'quadrilocale'
  if (haystack.includes('trilocali') || haystack.includes('trilocale')) return 'trilocale'
  if (haystack.includes('bilocali') || haystack.includes('bilocale')) return 'bilocale'
  if (haystack.includes('pentalocale')) return 'pentalocale'
  if (haystack.includes('ville ') || haystack.includes('villa') || haystack.includes('bifamigliare')) return 'villa'
  if (haystack.includes('attico')) return 'attico'
  if (haystack.includes('appartamento')) return 'appartamento'
  if (haystack.includes('rustico') || haystack.includes('casale') || haystack.includes('cascina')) return 'rustico'
  if (haystack.includes('box') || haystack.includes('garage')) return 'box'
  if (haystack.includes('palazzo')) return 'palazzo'
  if (haystack.includes('magazzino')) return 'magazzino'

  return null
}

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Variabili mancanti: NEXT_PUBLIC_SUPABASE_URL e/o SUPABASE_SERVICE_ROLE_KEY in .env.local',
    )
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

async function ensureBucket(supabase) {
  const { data: buckets, error: listError } = await supabase.storage.listBuckets()

  if (listError) {
    throw new Error(`Errore lettura bucket Supabase: ${listError.message}`)
  }

  const exists = buckets?.some((bucket) => bucket.name === BUCKET_NAME)

  if (exists) return

  const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
    public: true,
    fileSizeLimit: 1024 * 1024 * 20,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  })

  if (createError) {
    throw new Error(`Errore creazione bucket ${BUCKET_NAME}: ${createError.message}`)
  }
}

async function fetchBuffer(url, timeoutMs = 45000) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'user-agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/147 Safari/537.36',
        accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      },
      redirect: 'follow',
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const contentType = response.headers.get('content-type') || ''

    if (!contentType.toLowerCase().startsWith('image/')) {
      throw new Error(`Risposta non immagine: ${contentType || 'content-type vuoto'}`)
    }

    const arrayBuffer = await response.arrayBuffer()

    return {
      buffer: Buffer.from(arrayBuffer),
      contentType,
    }
  } finally {
    clearTimeout(timeout)
  }
}

function getWaybackTimestampFromUrl(url) {
  const match = String(url || '').match(/\/web\/(\d{8,14})/)
  return match?.[1] || null
}

function normalizeOriginalImageUrl(image) {
  const original = image?.original_url || image?.archived_url || ''

  try {
    const parsed = new URL(original)

    if (parsed.hostname === 'web.archive.org') {
      const match = parsed.pathname.match(/\/web\/\d+(?:[a-z_]+)?\/(https?:\/\/.+)$/)
      if (match?.[1]) return match[1]
    }

    return parsed.toString()
  } catch {
    return original
  }
}

function buildImageDownloadCandidates(image) {
  const candidates = []
  const originalUrl = normalizeOriginalImageUrl(image)
  const timestamp = getWaybackTimestampFromUrl(image?.archived_url)

  const add = (url) => {
    if (!url) return
    if (candidates.includes(url)) return
    candidates.push(url)
  }

  add(image?.archived_url)

  if (originalUrl && originalUrl.startsWith('http')) {
    if (timestamp) {
      add(`https://web.archive.org/web/${timestamp}im_/${originalUrl}`)
      add(`https://web.archive.org/web/${timestamp}if_/${originalUrl}`)
      add(`https://web.archive.org/web/${timestamp}/${originalUrl}`)
    }

    // 0im_ chiede a Wayback la migliore copia disponibile dell'immagine.
    add(`https://web.archive.org/web/0im_/${originalUrl}`)

    // Ultimo tentativo: file originale live. A volte wp-content/uploads è ancora servito
    // anche se le pagine PHP del sito ritornano vuote.
    add(originalUrl)
  }

  return candidates
}

async function downloadImageWithFallback(image) {
  const candidates = buildImageDownloadCandidates(image)
  const errors = []

  if (candidates.length === 0) {
    throw new Error('Nessun candidato download immagine')
  }

  for (const candidate of candidates) {
    try {
      const result = await fetchBuffer(candidate)
      return {
        ...result,
        downloadedFrom: candidate,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      errors.push(`${candidate} -> ${message}`)
    }
  }

  throw new Error(`Nessun URL immagine valido. Tentativi: ${errors.join(' | ')}`)
}

async function uploadImage(supabase, propertyId, image, index) {
  const originalUrl = normalizeOriginalImageUrl(image)

  if (!originalUrl) {
    throw new Error('URL immagine mancante')
  }

  await sleep(DELAY_MS)

  const { buffer, contentType, downloadedFrom } = await downloadImageWithFallback(image)
  const ext = extFromContentType(contentType)
  const originalName = sanitizeFileName(originalUrl, `image-${index + 1}.${ext}`)
  const cleanName = originalName.includes('.') ? originalName : `${originalName}.${ext}`

  const filePath = `properties/${propertyId}/old-site-import/${String(index + 1).padStart(3, '0')}-${cleanName}`

  let finalPath = filePath

  const uploadOnce = async (targetPath) => {
    return await supabase.storage.from(BUCKET_NAME).upload(targetPath, buffer, {
      contentType,
      cacheControl: '31536000',
      upsert: false,
    })
  }

  let { error: uploadError } = await uploadOnce(finalPath)

  if (uploadError && /already exists|duplicate/i.test(uploadError.message || '')) {
    finalPath = `properties/${propertyId}/old-site-import/${String(index + 1).padStart(3, '0')}-${Date.now()}-${cleanName}`
    ;({ error: uploadError } = await uploadOnce(finalPath))
  }

  if (uploadError) {
    throw new Error(uploadError.message)
  }

  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(finalPath)

  if (!data?.publicUrl) {
    throw new Error('Public URL non generato da Supabase')
  }

  console.log(`    download ok da: ${downloadedFrom}`)

  return data.publicUrl
}

async function getExistingSlugs(supabase) {
  const slugs = new Set()
  let from = 0
  const pageSize = 1000

  while (true) {
    const { data, error } = await supabase
      .from('properties')
      .select('slug')
      .range(from, from + pageSize - 1)

    if (error) {
      throw new Error(`Errore lettura slug esistenti: ${error.message}`)
    }

    for (const row of data || []) {
      if (row.slug) slugs.add(row.slug)
    }

    if (!data || data.length < pageSize) break

    from += pageSize
  }

  return slugs
}

function uniqueSlug(baseSlug, existingSlugs) {
  const cleanBase = baseSlug || 'immobile-importato'

  if (!existingSlugs.has(cleanBase)) {
    existingSlugs.add(cleanBase)
    return cleanBase
  }

  let counter = 2

  while (existingSlugs.has(`${cleanBase}-${counter}`)) {
    counter += 1
  }

  const slug = `${cleanBase}-${counter}`
  existingSlugs.add(slug)

  return slug
}

async function findExistingPropertyByOldUrl(supabase, oldSourceUrl) {
  const { data, error } = await supabase
    .from('properties')
    .select('id, title, old_source_url')
    .eq('old_source_url', oldSourceUrl)
    .maybeSingle()

  if (error) {
    throw new Error(`Errore ricerca duplicato old_source_url: ${error.message}`)
  }

  return data || null
}

async function getExistingImageSortOrders(supabase, propertyId) {
  const { data, error } = await supabase
    .from('property_media')
    .select('sort_order')
    .eq('property_id', propertyId)
    .eq('media_type', 'image')

  if (error) {
    throw new Error(`Errore lettura media esistenti: ${error.message}`)
  }

  return new Set((data || []).map((item) => Number(item.sort_order)).filter(Number.isFinite))
}

function buildPropertyInsert(property, index, slug) {
  const contractType = inferFallbackContractType(property)
  const propertyType = normalizePropertyType(property.property_type, property)
  const now = new Date().toISOString()

  return {
    title: property.title,
    reference_code: `OLD-${String(index + 1).padStart(4, '0')}`,
    slug,
    price: property.price || null,

    province: null,
    comune: null,
    frazione: null,
    address: null,

    rooms: null,
    bathrooms: null,
    surface: null,

    contract_type: contractType,
    property_type: propertyType,
    description: property.description_text || null,
    status: 'draft',

    has_garage: Boolean(property.has_garage),
    has_parking: Boolean(property.has_parking),
    has_garden: Boolean(property.has_garden),
    has_elevator: Boolean(property.has_elevator),
    is_auction: false,

    source_tag: 'old_site_import',
    import_source: 'wayback',
    is_demo: false,
    needs_review: true,
    old_source_url: property.old_source_url,
    imported_at: now,
    import_raw: {
      wayback_url: property.wayback_url,
      wayback_timestamp: property.wayback_timestamp,
      price_text: property.price_text,
      detected_contract_type: property.contract_type,
      detected_property_type: property.property_type,
      original_scan: property.original_scan || null,
      image_count: property.image_count,
    },

    last_activity_at: now,
  }
}

async function insertProperty(supabase, property, index, existingSlugs) {
  const baseSlug = slugify(property.slug || property.title || `immobile-importato-${index + 1}`)
  const slug = uniqueSlug(baseSlug, existingSlugs)
  const payload = buildPropertyInsert(property, index, slug)

  const { data, error } = await supabase
    .from('properties')
    .insert(payload)
    .select('id, slug')
    .single()

  if (error) {
    throw new Error(`Errore inserimento immobile "${property.title}": ${error.message}`)
  }

  return data
}

function parseStoragePathFromPublicUrl(fileUrl) {
  if (!fileUrl) return null

  try {
    const url = new URL(fileUrl)
    const marker = `/storage/v1/object/public/${BUCKET_NAME}/`
    const markerIndex = url.pathname.indexOf(marker)

    if (markerIndex === -1) return null

    return decodeURIComponent(url.pathname.slice(markerIndex + marker.length))
  } catch {
    return null
  }
}

async function removeUploadedStorageObject(supabase, publicUrl) {
  const storagePath = parseStoragePathFromPublicUrl(publicUrl)

  if (!storagePath) return

  const { error } = await supabase.storage.from(BUCKET_NAME).remove([storagePath])

  if (error) {
    console.warn(`WARN impossibile rimuovere file storage orfano: ${error.message}`)
  }
}

async function insertMediaRecord(supabase, propertyId, publicUrl, index) {
  const isCover = index === 0

  const { error } = await supabase.from('property_media').insert({
    property_id: propertyId,
    media_type: 'image',
    file_url: publicUrl,
    label: null,
    sort_order: index,
    is_cover: isCover,
  })

  if (error) {
    throw new Error(`Errore inserimento property_media: ${error.message}`)
  }

  if (isCover) {
    const { error: propertyError } = await supabase
      .from('properties')
      .update({
        main_image: publicUrl,
        photo_coming_soon: false,
        no_photo_available: false,
        last_activity_at: new Date().toISOString(),
      })
      .eq('id', propertyId)

    if (propertyError) {
      throw new Error(`Errore aggiornamento main_image: ${propertyError.message}`)
    }
  }
}

async function main() {
  if (!fs.existsSync(INPUT_FILE)) {
    throw new Error(`File non trovato: ${INPUT_FILE}. Lancia prima npm run import:old-site:prepare`)
  }

  const input = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'))
  let properties = Array.isArray(input.properties) ? input.properties : []

  if (LIMIT > 0) {
    properties = properties.slice(0, LIMIT)
  }

  console.log('')
  console.log('=== IMPORT AREAIMMOBILIARE OLD SITE -> SUPABASE ===')
  console.log({
    dryRun: DRY_RUN,
    inputProperties: input.properties?.length || 0,
    selectedProperties: properties.length,
    maxImagesPerProperty: MAX_IMAGES_PER_PROPERTY === 0 ? 'all' : MAX_IMAGES_PER_PROPERTY,
    bucket: BUCKET_NAME,
  })
  console.log('')

  if (DRY_RUN) {
    for (const [index, property] of properties.entries()) {
      const contractType = inferFallbackContractType(property)
      const propertyType = normalizePropertyType(property.property_type, property)
      const imageLimit =
        MAX_IMAGES_PER_PROPERTY === 0
          ? property.images.length
          : Math.min(property.images.length, MAX_IMAGES_PER_PROPERTY)

      console.log({
        index: index + 1,
        title: property.title,
        price: property.price,
        contract_type: contractType,
        property_type: propertyType,
        status: 'draft',
        imagesToImport: imageLimit,
        old_source_url: property.old_source_url,
      })
    }

    console.log('')
    console.log('DRY RUN completato: nessuna scrittura effettuata.')
    console.log('')
    return
  }

  const supabase = getSupabaseClient()
  await ensureBucket(supabase)

  const existingSlugs = await getExistingSlugs(supabase)

  const summary = {
    propertiesInserted: 0,
    propertiesExisting: 0,
    imagesUploaded: 0,
    imagesSkippedExistingSortOrder: 0,
    imageErrors: 0,
    propertyErrors: 0,
  }

  const errors = []

  for (const [index, property] of properties.entries()) {
    console.log('')
    console.log(`=== ${index + 1}/${properties.length} ${property.title} ===`)

    try {
      let propertyId = null

      const existing = await findExistingPropertyByOldUrl(supabase, property.old_source_url)

      if (existing?.id) {
        propertyId = existing.id
        summary.propertiesExisting += 1
        console.log(`Immobile già presente, uso ID esistente: ${propertyId}`)
      } else {
        const inserted = await insertProperty(supabase, property, index, existingSlugs)
        propertyId = inserted.id
        summary.propertiesInserted += 1
        console.log(`Immobile creato: ${propertyId}`)
      }

      const existingSortOrders = await getExistingImageSortOrders(supabase, propertyId)
      const images = Array.isArray(property.images) ? property.images : []
      const imagesToImport =
        MAX_IMAGES_PER_PROPERTY === 0 ? images : images.slice(0, MAX_IMAGES_PER_PROPERTY)

      for (let imageIndex = 0; imageIndex < imagesToImport.length; imageIndex += 1) {
        if (existingSortOrders.has(imageIndex)) {
          summary.imagesSkippedExistingSortOrder += 1
          console.log(`  - immagine ${imageIndex + 1}: già presente, salto`)
          continue
        }

        try {
          const publicUrl = await uploadImage(supabase, propertyId, imagesToImport[imageIndex], imageIndex)

          try {
            await insertMediaRecord(supabase, propertyId, publicUrl, imageIndex)
          } catch (mediaRecordError) {
            await removeUploadedStorageObject(supabase, publicUrl)
            throw mediaRecordError
          }

          summary.imagesUploaded += 1
          console.log(`  - immagine ${imageIndex + 1}: caricata`)
        } catch (imageError) {
          summary.imageErrors += 1
          const message = imageError instanceof Error ? imageError.message : String(imageError)
          errors.push({
            type: 'image',
            property: property.title,
            old_source_url: property.old_source_url,
            imageIndex,
            error: message,
          })
          console.log(`  - immagine ${imageIndex + 1}: ERRORE ${message}`)
        }
      }
    } catch (propertyError) {
      summary.propertyErrors += 1
      const message = propertyError instanceof Error ? propertyError.message : String(propertyError)
      errors.push({
        type: 'property',
        property: property.title,
        old_source_url: property.old_source_url,
        error: message,
      })
      console.log(`ERRORE IMMOBILE: ${message}`)
    }
  }

  console.log('')
  console.log('=== IMPORT COMPLETATO ===')
  console.log(summary)

  if (errors.length > 0) {
    const errorFile = path.join(
      process.cwd(),
      'data',
      'imports',
      'areaimmobiliare-import-errors.json',
    )

    fs.writeFileSync(errorFile, JSON.stringify(errors, null, 2) + '\n')
    console.log(`Errori salvati in: ${errorFile}`)
  }

  console.log('')
}

main().catch((error) => {
  console.error('')
  console.error('IMPORT FALLITO:')
  console.error(error)
  process.exit(1)
})
