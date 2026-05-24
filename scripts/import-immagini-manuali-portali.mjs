import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

const ROOT = path.resolve('tmp/area-portali-audit/immagini-manuali-da-importare')
const REPORT_MD = path.resolve('tmp/area-portali-audit/import-immagini-manuali-portali.md')
const REPORT_JSON = path.resolve('tmp/area-portali-audit/import-immagini-manuali-portali.json')
const BUCKET = 'property-media'

const APPLY = process.argv.includes('--apply')
const REPLACE = process.argv.includes('--replace')
const ONLY_REF_ARG = process.argv.find((a) => a.startsWith('--ref='))
const ONLY_REF = ONLY_REF_ARG ? ONLY_REF_ARG.split('=')[1].trim() : ''

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue
    const i = trimmed.indexOf('=')
    const key = trimmed.slice(0, i).trim()
    let val = trimmed.slice(i + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = val
  }
}

for (const file of ['.env.local', '.env', '.env.development.local', '.env.production.local']) {
  loadEnvFile(file)
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('ERRORE: variabili Supabase mancanti.')
  process.exit(1)
}

function compact(v) {
  return String(v ?? '').trim()
}

function mimeFor(file) {
  const ext = path.extname(file).toLowerCase()
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg'
  if (ext === '.png') return 'image/png'
  if (ext === '.webp') return 'image/webp'
  return ''
}

function isSupportedImage(file) {
  return ['.jpg', '.jpeg', '.png', '.webp'].includes(path.extname(file).toLowerCase())
}

function safeName(file) {
  const ext = path.extname(file).toLowerCase()
  const base = path.basename(file, ext)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'foto'
  return base + ext
}

function publicUrl(objectPath) {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${objectPath}`
}

function euro(value) {
  if (value === null || value === undefined || value === '') return '-'
  const n = Number(value)
  if (!Number.isFinite(n)) return String(value)
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
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
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${text.slice(0, 600)}`)
  return text ? JSON.parse(text) : null
}

async function uploadStorage(objectPath, buffer, contentType) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${objectPath}`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      authorization: `Bearer ${SERVICE_KEY}`,
      'content-type': contentType,
      'x-upsert': 'true',
    },
    body: buffer,
  })

  const text = await res.text()
  if (!res.ok) throw new Error(`Storage upload fallito ${objectPath}: ${res.status} ${text.slice(0, 500)}`)
}

async function getProperty(ref) {
  const rows = await supabaseFetch(`/rest/v1/properties?select=id,reference_code,title,slug,status,price,main_image,gallery&reference_code=eq.${encodeURIComponent(ref)}&limit=1`)
  return Array.isArray(rows) ? rows[0] : null
}

async function getMedia(propertyId) {
  return await supabaseFetch(`/rest/v1/property_media?select=id,file_url,label,sort_order,is_cover&property_id=eq.${propertyId}&order=sort_order.asc,created_at.asc`)
}

async function main() {
  console.log('=== IMPORT IMMAGINI MANUALI PORTALI ===')
  console.log(`Modalità: ${APPLY ? 'APPLY - scrive Supabase' : 'DRY RUN - non scrive nulla'}`)
  console.log(`Replace: ${REPLACE ? 'sì, sostituisce immagini esistenti del REF' : 'no, salta se il REF ha già immagini'}`)
  if (ONLY_REF) console.log(`Solo REF: ${ONLY_REF}`)
  console.log('')

  if (!fs.existsSync(ROOT)) {
    throw new Error(`Manca cartella ${ROOT}. Prima esegui: npm run audit:media:manual-prepare`)
  }

  const refs = fs.readdirSync(ROOT)
    .filter((name) => /^IM\d{4}AA$/.test(name))
    .filter((ref) => !ONLY_REF || ref === ONLY_REF)
    .sort()

  const report = []
  let planned = 0
  let imported = 0

  for (const ref of refs) {
    const dir = path.join(ROOT, ref)
    const files = fs.readdirSync(dir)
      .filter(isSupportedImage)
      .sort((a, b) => a.localeCompare(b, 'it', { numeric: true }))

    if (!files.length) continue

    const property = await getProperty(ref)
    if (!property) {
      console.log(`SKIP ${ref} | immobile non trovato`)
      report.push({ ref, status: 'SKIP_NOT_FOUND', files })
      continue
    }

    const currentMedia = await getMedia(property.id)
    const currentGallery = Array.isArray(property.gallery) ? property.gallery : []
    const hasCurrentImages = currentMedia.length > 0 || currentGallery.length > 0 || !!property.main_image

    if (hasCurrentImages && !REPLACE) {
      console.log(`SKIP ${ref} | ha già immagini | usa --replace solo se vuoi sostituirle`)
      report.push({
        ref,
        status: 'SKIP_HAS_IMAGES',
        title: property.title,
        current_media: currentMedia.length,
        current_gallery: currentGallery.length,
        files,
      })
      continue
    }

    planned += files.length

    console.log(`${APPLY ? 'IMPORT' : 'DRY'} ${ref} | file: ${files.length} | ${property.title}`)
    if (REPLACE && hasCurrentImages) {
      console.log(`  - replace: rimuove righe property_media e sostituisce main_image/gallery`)
    }

    const uploadedUrls = []

    if (APPLY) {
      if (REPLACE) {
        await supabaseFetch(`/rest/v1/property_media?property_id=eq.${property.id}`, {
          method: 'DELETE',
          headers: { prefer: 'return=minimal' },
        })
      }

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const full = path.join(dir, file)
        const buffer = fs.readFileSync(full)
        const hash = crypto.createHash('sha1').update(buffer).digest('hex').slice(0, 10)
        const objectPath = `manual-portali/${ref}/${String(i + 1).padStart(2, '0')}-${hash}-${safeName(file)}`
        const type = mimeFor(file)

        await uploadStorage(objectPath, buffer, type)

        const url = publicUrl(objectPath)
        uploadedUrls.push(url)

        const mediaRow = {
          property_id: property.id,
          media_type: 'image',
          file_url: url,
          label: `Import manuale ${ref}`,
          sort_order: i + 1,
          is_cover: i === 0,
        }

        await supabaseFetch('/rest/v1/property_media', {
          method: 'POST',
          headers: { prefer: 'return=minimal' },
          body: JSON.stringify(mediaRow),
        })

        imported += 1
        console.log(`  OK ${i + 1}/${files.length} ${file}`)
      }

      await supabaseFetch(`/rest/v1/properties?id=eq.${property.id}`, {
        method: 'PATCH',
        headers: { prefer: 'return=minimal' },
        body: JSON.stringify({
          main_image: uploadedUrls[0] || null,
          gallery: uploadedUrls,
          photo_coming_soon: false,
          no_photo_available: false,
        }),
      })
    }

    report.push({
      ref,
      status: APPLY ? 'IMPORTED' : 'DRY',
      replace: REPLACE,
      title: property.title,
      price: property.price,
      files,
      uploaded_urls: uploadedUrls,
    })
  }

  const md = []
  md.push('# Import immagini manuali portali')
  md.push('')
  md.push(`Generato: ${new Date().toLocaleString('it-IT')}`)
  md.push('')
  md.push(`- Modalità: **${APPLY ? 'APPLY' : 'DRY RUN'}**`)
  md.push(`- Replace: **${REPLACE ? 'sì' : 'no'}**`)
  md.push(`- File pianificati: **${planned}**`)
  md.push(`- File importati: **${imported}**`)
  md.push('')
  md.push('| REF | Stato | File | Titolo |')
  md.push('|---|---|---:|---|')
  for (const row of report) {
    md.push(`| ${row.ref} | ${row.status} | ${row.files?.length || 0} | ${row.title || '-'} |`)
  }

  fs.writeFileSync(REPORT_MD, md.join('\n') + '\n', 'utf8')
  fs.writeFileSync(REPORT_JSON, JSON.stringify({
    generated_at: new Date().toISOString(),
    apply: APPLY,
    replace: REPLACE,
    planned,
    imported,
    report,
  }, null, 2), 'utf8')

  console.log('')
  console.log('Report:')
  console.log(REPORT_MD)
  console.log(REPORT_JSON)

  if (!APPLY) {
    console.log('')
    console.log('Dry-run completato. Per importare davvero:')
    console.log('npm run audit:media:manual-import -- --apply')
    console.log('')
    console.log('Se vuoi sostituire immagini già presenti per i REF con cartella piena:')
    console.log('npm run audit:media:manual-import -- --apply --replace')
    console.log('')
    console.log('Per lavorare su un solo REF:')
    console.log('npm run audit:media:manual-import -- --ref=IM0003AA')
  } else {
    console.log('')
    console.log(`OK: immagini importate ${imported}/${planned}`)
  }
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
