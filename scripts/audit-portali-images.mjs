import fs from 'node:fs/promises'
import path from 'node:path'

const ROOT = process.cwd()
const OUT_DIR = path.join(ROOT, 'tmp', 'area-portali-audit')
const OUT_TXT = path.join(OUT_DIR, 'audit-immagini-portali.txt')
const OUT_JSON = path.join(OUT_DIR, 'audit-immagini-portali.json')
const OUT_MD = path.join(OUT_DIR, 'audit-immagini-portali.md')

function compact(value = '') {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function decodeBasic(value = '') {
  return String(value || '')
    .replace(/\\u002F/g, '/')
    .replace(/\\\//g, '/')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
}

function isImageUrl(url = '') {
  return /\.(jpg|jpeg|png|webp)(\?|#|$)/i.test(url)
}

function cleanUrl(url = '') {
  return decodeBasic(url)
    .replace(/^["'(\s]+|["')\s]+$/g, '')
    .replace(/,$/, '')
}

function hostOf(url = '') {
  try {
    return new URL(url).hostname
  } catch {
    return 'non valido'
  }
}

async function walk(dir) {
  const out = []
  const entries = await fs.readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      out.push(...await walk(full))
    } else {
      out.push(full)
    }
  }

  return out
}

async function main() {
  const files = (await walk(OUT_DIR))
    .filter((file) => /\.(html|txt|json|md)$/i.test(file))
    .filter((file) => !file.endsWith('audit-immagini-portali.txt'))
    .filter((file) => !file.endsWith('audit-immagini-portali.json'))
    .filter((file) => !file.endsWith('audit-immagini-portali.md'))

  const found = []

  for (const file of files) {
    const rel = path.relative(ROOT, file)
    let text = ''

    try {
      text = await fs.readFile(file, 'utf8')
    } catch {
      continue
    }

    const decoded = decodeBasic(text)

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
            if (url.startsWith('http') && isImageUrl(url)) {
              found.push({ url, host: hostOf(url), sourceFile: rel })
            }
          }
          continue
        }

        const url = cleanUrl(raw)
        if (url.startsWith('http') && isImageUrl(url)) {
          found.push({ url, host: hostOf(url), sourceFile: rel })
        }
      }
    }
  }

  const uniqueMap = new Map()
  for (const item of found) {
    if (!uniqueMap.has(item.url)) uniqueMap.set(item.url, item)
  }

  const unique = [...uniqueMap.values()]

  const byHost = new Map()
  for (const item of unique) {
    byHost.set(item.host, (byHost.get(item.host) || 0) + 1)
  }

  const byFile = new Map()
  for (const item of unique) {
    byFile.set(item.sourceFile, (byFile.get(item.sourceFile) || 0) + 1)
  }

  const hostRows = [...byHost.entries()].sort((a, b) => b[1] - a[1])
  const fileRows = [...byFile.entries()].sort((a, b) => b[1] - a[1])

  const md = [
    '# Audit immagini portali',
    '',
    `Generato: ${new Date().toLocaleString('it-IT')}`,
    '',
    '## Riepilogo',
    '',
    `- File analizzati: **${files.length}**`,
    `- URL immagine trovati totali: **${found.length}**`,
    `- URL immagine unici: **${unique.length}**`,
    '',
    '## Domini immagini',
    '',
    '| Dominio | URL unici |',
    '|---|---:|',
    ...hostRows.map(([host, count]) => `| ${host} | ${count} |`),
    '',
    '## File sorgente principali',
    '',
    '| File | URL unici |',
    '|---|---:|',
    ...fileRows.slice(0, 30).map(([file, count]) => `| ${file} | ${count} |`),
    '',
    '## Prime 40 immagini trovate',
    '',
    ...unique.slice(0, 40).map((item, index) => `${index + 1}. ${item.url}`),
    '',
  ].join('\n')

  const txt = [
    'AUDIT IMMAGINI PORTALI',
    '',
    `File analizzati: ${files.length}`,
    `URL immagine totali: ${found.length}`,
    `URL immagine unici: ${unique.length}`,
    '',
    'DOMINI:',
    ...hostRows.map(([host, count]) => `- ${host}: ${count}`),
    '',
    'FILE:',
    ...fileRows.slice(0, 30).map(([file, count]) => `- ${file}: ${count}`),
    '',
    'URL:',
    ...unique.map((item) => `${item.url}\t${item.sourceFile}`),
    '',
  ].join('\n')

  await fs.writeFile(OUT_MD, md, 'utf8')
  await fs.writeFile(OUT_TXT, txt, 'utf8')
  await fs.writeFile(OUT_JSON, JSON.stringify({
    generatedAt: new Date().toISOString(),
    counts: {
      files: files.length,
      totalImageUrls: found.length,
      uniqueImageUrls: unique.length,
    },
    byHost: Object.fromEntries(hostRows),
    byFile: Object.fromEntries(fileRows),
    images: unique,
  }, null, 2), 'utf8')

  console.log('=== AUDIT IMMAGINI CREATO ===')
  console.log('tmp/area-portali-audit/audit-immagini-portali.md')
  console.log('tmp/area-portali-audit/audit-immagini-portali.json')
  console.log('tmp/area-portali-audit/audit-immagini-portali.txt')
  console.log('')
  console.log(md.split('\n').slice(0, 90).join('\n'))
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
