import fs from 'node:fs/promises'
import path from 'node:path'

const ROOT = process.cwd()
const OUT_DIR = path.join(ROOT, 'tmp', 'area-portali-audit')
const PLAN_JSON = path.join(OUT_DIR, 'piano-import-immobili-portali.json')
const OUT_MD = path.join(OUT_DIR, 'immagini-portali-per-ref.md')
const OUT_JSON = path.join(OUT_DIR, 'immagini-portali-per-ref.json')
const OUT_CSV = path.join(OUT_DIR, 'immagini-portali-per-ref.csv')

function compact(value = '') {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function decodeBasic(value = '') {
  return String(value || '')
    .replace(/\\u002F/g, '/')
    .replace(/\\\//g, '/')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&agrave;/g, 'à')
    .replace(/&egrave;/g, 'è')
    .replace(/&eacute;/g, 'é')
    .replace(/&igrave;/g, 'ì')
    .replace(/&ograve;/g, 'ò')
    .replace(/&ugrave;/g, 'ù')
    .replace(/&nbsp;/g, ' ')
}

function normalize(value = '') {
  return compact(decodeBasic(value))
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

function escapeRegex(value = '') {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function cleanUrl(url = '') {
  return decodeBasic(url)
    .replace(/^["'(\s]+|["')\s]+$/g, '')
    .replace(/,$/, '')
}

function isGoodImageUrl(url = '') {
  if (!/^https?:\/\//i.test(url)) return false
  if (!/\.(jpg|jpeg|png|webp)(\?|#|$)/i.test(url)) return false

  try {
    const host = new URL(url).hostname
    return ['pwm.im-cdn.it', 'images-1.casa.it'].includes(host)
  } catch {
    return false
  }
}

function extractImageUrls(text = '') {
  const decoded = decodeBasic(text)
  const found = []

  const patterns = [
    /https?:\/\/[^"' <>()\\]+?\.(?:jpg|jpeg|png|webp)(?:\?[^"' <>()\\]*)?/gi,
    /(?:src|href|content)=["']([^"']+\.(?:jpg|jpeg|png|webp)(?:\?[^"']*)?)["']/gi,
    /(?:srcset)=["']([^"']+)["']/gi,
  ]

  for (const pattern of patterns) {
    for (const match of decoded.matchAll(pattern)) {
      const raw = match[1] || match[0]

      if (pattern.source.includes('srcset')) {
        const parts = raw.split(',').map((part) => compact(part).split(/\s+/)[0])
        for (const part of parts) {
          const url = cleanUrl(part)
          if (isGoodImageUrl(url)) found.push(url)
        }
        continue
      }

      const url = cleanUrl(raw)
      if (isGoodImageUrl(url)) found.push(url)
    }
  }

  return [...new Set(found)]
}

async function walk(dir) {
  const out = []
  const entries = await fs.readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...await walk(full))
    else out.push(full)
  }

  return out
}

async function loadHtmlFiles() {
  const files = (await walk(OUT_DIR)).filter((file) => /\.html$/i.test(file))
  const loaded = []

  for (const file of files) {
    const html = decodeBasic(await fs.readFile(file, 'utf8'))
    loaded.push({
      file: path.relative(ROOT, file),
      html,
      norm: normalize(html),
    })
  }

  return loaded
}

function possibleTitleVariants(title = '') {
  const clean = compact(title)
  const variants = new Set([
    clean,
    clean.replace(/\bSan c\b/gi, ''),
    clean.replace(/\bs\.?n\.?c\.?\b/gi, ''),
    clean.replace(/\s*,\s*/g, ', '),
    clean.replace(/\s+/g, ' '),
  ])

  return [...variants].map(compact).filter(Boolean)
}

function priceDigits(value = '') {
  const text = compact(value)
  const match = text.match(/(\d{1,3}(?:\.\d{3})+|\d{4,}|\d{1,3})(?:,\d+)?/)
  if (!match) return ''
  return match[1].replace(/\./g, '')
}

function segmentContainsPrice(segment = '', row) {
  const wanted = String(row.price_number || priceDigits(row.price_label) || '').trim()
  if (!wanted) return false
  const seg = normalize(segment).replace(/\s+/g, '')
  return seg.includes(wanted)
}

function buildOccurrences(rows, htmlFile) {
  const occurrences = []

  for (const row of rows) {
    const variants = possibleTitleVariants(row.title)

    for (const variant of variants) {
      const re = new RegExp(escapeRegex(variant), 'gi')
      for (const match of htmlFile.html.matchAll(re)) {
        occurrences.push({
          reference_code: row.reference_code,
          row,
          index: match.index,
          variant,
        })
      }
    }
  }

  occurrences.sort((a, b) => a.index - b.index)

  // dedup vicino: stessa riga trovata più volte nello stesso punto
  const deduped = []
  for (const occ of occurrences) {
    const prev = deduped[deduped.length - 1]
    if (
      prev &&
      prev.reference_code === occ.reference_code &&
      Math.abs(prev.index - occ.index) < 300
    ) {
      continue
    }
    deduped.push(occ)
  }

  return deduped
}

function titleIsAmbiguous(row, rows) {
  const n = normalize(row.title)
  return rows.filter((item) => normalize(item.title) === n).length > 1
}

function findBestImagesForRow(row, htmlFiles, allRows) {
  const ambiguous = titleIsAmbiguous(row, allRows)

  let best = {
    score: -1,
    images: [],
    sourceFile: '',
    method: 'none',
    priceMatched: false,
    segmentLength: 0,
  }

  for (const htmlFile of htmlFiles) {
    const occurrences = buildOccurrences(allRows, htmlFile)
    const rowOccurrences = occurrences.filter((occ) => occ.reference_code === row.reference_code)

    for (const occ of rowOccurrences) {
      const pos = occ.index
      const prev = [...occurrences].reverse().find((item) => item.index < pos - 20)
      const next = occurrences.find((item) => item.index > pos + 20)

      const start = prev ? Math.floor((prev.index + pos) / 2) : Math.max(0, pos - 4500)
      const end = next ? Math.floor((pos + next.index) / 2) : Math.min(htmlFile.html.length, pos + 4500)

      const segment = htmlFile.html.slice(start, end)
      const images = extractImageUrls(segment)
        .filter((url) => !url.includes('mobileplaceholder'))
        .filter((url) => !url.includes('star-blur'))
        .filter((url) => !url.includes('favicon'))
        .slice(0, 18)

      const priceMatched = segmentContainsPrice(segment, row)

      let score = 0
      score += Math.min(images.length, 18)
      if (priceMatched) score += 20
      if (normalize(segment).includes(normalize(row.title))) score += 10
      if (ambiguous && !priceMatched) score -= 25
      if (images.length >= 18) score -= 4

      if (score > best.score) {
        best = {
          score,
          images,
          sourceFile: htmlFile.file,
          method: 'strict-between-titles',
          priceMatched,
          segmentLength: segment.length,
        }
      }
    }
  }

  return best
}

function toCsv(rows) {
  const header = [
    'reference_code',
    'title',
    'portals',
    'price',
    'image_count',
    'status',
    'price_matched',
    'first_image',
    'source_file',
  ]

  const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`

  return [
    header.join(';'),
    ...rows.map((row) => [
      row.reference_code,
      row.title,
      row.portals,
      row.price_label,
      row.image_count,
      row.status,
      row.price_matched ? 'yes' : 'no',
      row.images[0] || '',
      row.source_file,
    ].map(escape).join(';')),
  ].join('\n')
}

async function main() {
  const plan = JSON.parse(await fs.readFile(PLAN_JSON, 'utf8'))
  const htmlFiles = await loadHtmlFiles()

  const importedRows = (plan.importRows || [])
    .filter((row) => row.action === 'CREARE DRAFT')
    .filter((row) => ['vendita', 'affitto'].includes(compact(row.contract_type).toLowerCase()))

  const matchedRows = importedRows.map((row) => {
    const matched = findBestImagesForRow(row, htmlFiles, importedRows)

    return {
      reference_code: row.reference_code,
      title: row.title,
      portals: row.portals,
      price_label: row.price_label,
      images: matched.images,
      image_count: matched.images.length,
      source_file: matched.sourceFile,
      method: matched.method,
      price_matched: matched.priceMatched,
      score: matched.score,
      status: matched.images.length === 0
        ? 'NO_IMAGES'
        : matched.priceMatched
          ? 'OK'
          : 'REVIEW',
    }
  })

  const firstImageMap = new Map()
  for (const row of matchedRows) {
    const first = row.images[0]
    if (!first) continue
    if (!firstImageMap.has(first)) firstImageMap.set(first, [])
    firstImageMap.get(first).push(row.reference_code)
  }

  const duplicatedFirstImages = [...firstImageMap.entries()]
    .filter(([, refs]) => refs.length > 1)
    .sort((a, b) => b[1].length - a[1].length)

  const rows = matchedRows.map((row) => {
    const first = row.images[0]
    const dupRefs = first ? firstImageMap.get(first) || [] : []
    const suspicious = row.status !== 'OK' || dupRefs.length > 2 || row.image_count >= 18

    return {
      ...row,
      duplicated_first_refs: dupRefs,
      suspicious,
    }
  })

  const ok = rows.filter((row) => row.status === 'OK' && !row.suspicious)
  const review = rows.filter((row) => row.suspicious)
  const withoutImages = rows.filter((row) => row.image_count === 0)
  const totalImages = rows.reduce((sum, row) => sum + row.image_count, 0)

  const md = [
    '# Immagini portali associate ai REF',
    '',
    `Generato: ${new Date().toLocaleString('it-IT')}`,
    '',
    '## Riepilogo stretto',
    '',
    `- Immobili importati analizzati: **${rows.length}**`,
    `- Match immagini OK non sospetti: **${ok.length}**`,
    `- Da verificare prima di importare immagini: **${review.length}**`,
    `- Immobili senza immagini candidate: **${withoutImages.length}**`,
    `- URL immagini candidate totali associate: **${totalImages}**`,
    `- Prime immagini duplicate tra più REF: **${duplicatedFirstImages.length}**`,
    '',
    '## Prime immagini duplicate',
    '',
    '| Prima immagine | REF coinvolti |',
    '|---|---|',
    ...duplicatedFirstImages.slice(0, 20).map(([url, refs]) => `| ${safeCell(url)} | ${safeCell(refs.join(', '))} |`),
    '',
    '## Tabella compatta',
    '',
    '| REF | Stato | Immagini | Prezzo nel segmento | Immobile | Prima immagine |',
    '|---|---|---:|---|---|---|',
    ...rows.map((row) => `| ${safeCell(row.reference_code)} | ${safeCell(row.suspicious ? 'REVIEW' : 'OK')} | ${row.image_count} | ${row.price_matched ? 'sì' : 'no'} | ${safeCell(row.title)} | ${safeCell(row.images[0] || '-')} |`),
    '',
    '## Da verificare',
    '',
    ...review.map((row) => `- ${row.reference_code} ${row.title} — immagini: ${row.image_count}, prezzo nel segmento: ${row.price_matched ? 'sì' : 'no'}, prima immagine duplicata con: ${row.duplicated_first_refs.join(', ') || '-'}`),
    '',
    '## Nota',
    '',
    'Questo report associa immagini con una logica più stretta tra titolo annuncio e titolo successivo. Non scarica nulla e non scrive nulla in Supabase.',
    '',
  ].join('\n')

  await fs.writeFile(OUT_MD, md, 'utf8')
  await fs.writeFile(OUT_JSON, JSON.stringify({
    generatedAt: new Date().toISOString(),
    counts: {
      properties: rows.length,
      ok: ok.length,
      review: review.length,
      withoutImages: withoutImages.length,
      totalCandidateImages: totalImages,
      duplicatedFirstImages: duplicatedFirstImages.length,
    },
    duplicatedFirstImages: duplicatedFirstImages.map(([url, refs]) => ({ url, refs })),
    rows,
  }, null, 2), 'utf8')
  await fs.writeFile(OUT_CSV, toCsv(rows), 'utf8')

  console.log('=== REPORT IMMAGINI PER REF STRETTO CREATO ===')
  console.log('tmp/area-portali-audit/immagini-portali-per-ref.md')
  console.log('tmp/area-portali-audit/immagini-portali-per-ref.json')
  console.log('tmp/area-portali-audit/immagini-portali-per-ref.csv')
  console.log('')
  console.log(md.split('\n').slice(0, 130).join('\n'))
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
