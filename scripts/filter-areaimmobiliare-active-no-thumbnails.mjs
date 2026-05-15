import fs from 'node:fs'
import path from 'node:path'

const INPUT_FILE = path.join(
  process.cwd(),
  'data',
  'imports',
  'areaimmobiliare-active-strict-import.json',
)

const OUT_FILE = path.join(
  process.cwd(),
  'data',
  'imports',
  'areaimmobiliare-active-strict-no-thumbnails-import.json',
)

function cleanText(value) {
  return String(value || '').trim()
}

function fileNameFromUrl(value) {
  const raw = cleanText(value)

  if (!raw) return ''

  try {
    return decodeURIComponent(new URL(raw).pathname.split('/').pop() || '')
  } catch {
    return decodeURIComponent(raw.split('/').pop() || '')
  }
}

function imageUrls(image) {
  if (!image) return []

  if (typeof image === 'string') return [image]

  return [
    image.url,
    image.src,
    image.href,
    image.file_url,
    image.fileUrl,
    image.original_url,
    image.originalUrl,
    image.wayback_url,
    image.waybackUrl,
  ].filter(Boolean)
}

function looksLikeThumbnail(image) {
  const urls = imageUrls(image)

  return urls.some((url) => {
    const name = fileNameFromUrl(url).toLowerCase()

    return /-(150x150|150x100|210x210|246x162)\./.test(name)
  })
}

function imageDebugName(image) {
  const urls = imageUrls(image)
  return fileNameFromUrl(urls[0] || '')
}

const input = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'))

const properties = Array.isArray(input.properties) ? input.properties : []

let removedTotal = 0
let keptTotal = 0

const cleanedProperties = properties.map((property) => {
  const images = Array.isArray(property.images) ? property.images : []
  const keptImages = images.filter((image) => !looksLikeThumbnail(image))
  const removedImages = images.filter((image) => looksLikeThumbnail(image))

  removedTotal += removedImages.length
  keptTotal += keptImages.length

  return {
    ...property,
    images: keptImages,
    image_count: keptImages.length,
    no_thumbnail_filter: {
      original_images: images.length,
      kept_images: keptImages.length,
      removed_thumbnail_like_images: removedImages.length,
      removed_preview: removedImages.slice(0, 10).map(imageDebugName),
    },
  }
})

const result = {
  prepared_at: new Date().toISOString(),
  source: 'wayback_active_listing_candidates_strict_2026_no_thumbnails',
  summary: {
    properties: cleanedProperties.length,
    original_images: keptTotal + removedTotal,
    kept_images: keptTotal,
    removed_thumbnail_like_images: removedTotal,
  },
  properties: cleanedProperties,
}

fs.writeFileSync(OUT_FILE, JSON.stringify(result, null, 2) + '\n')

console.log('')
console.log('=== STRICT NO THUMBNAILS PREPARATO ===')
console.log(result.summary)

console.log('')
console.log('=== ANTEPRIMA ===')

for (const property of cleanedProperties) {
  const filter = property.no_thumbnail_filter

  console.log('')
  console.log(`- ${property.title}`)
  console.log(`  immagini prima: ${filter.original_images}`)
  console.log(`  immagini tenute: ${filter.kept_images}`)
  console.log(`  miniature rimosse: ${filter.removed_thumbnail_like_images}`)

  if (filter.removed_preview.length > 0) {
    console.log(`  rimosse esempio: ${filter.removed_preview.join(', ')}`)
  }
}

console.log('')
console.log(`File no thumbnails: ${OUT_FILE}`)
console.log('')
