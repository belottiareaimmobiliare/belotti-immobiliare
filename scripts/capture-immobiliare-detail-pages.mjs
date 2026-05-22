import fs from 'node:fs/promises'
import path from 'node:path'
import readline from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { chromium } from 'playwright'

const AUDIT_DIR = 'tmp/area-portali-audit'
const CSV_FILE = path.join(AUDIT_DIR, 'descrizioni-manuali-portali.csv')
const OUT_DIR = path.join(AUDIT_DIR, 'immobiliare-detail-pages')
const USER_DATA_DIR = path.join(AUDIT_DIR, 'playwright-immobiliare-profile')

function compact(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
}

function parseCsv(text) {
  const rows = []
  let row = []
  let cell = ''
  let quoted = false

  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    const next = text[i + 1]

    if (quoted) {
      if (c === '"' && next === '"') {
        cell += '"'
        i++
      } else if (c === '"') {
        quoted = false
      } else {
        cell += c
      }
      continue
    }

    if (c === '"') quoted = true
    else if (c === ',') {
      row.push(cell)
      cell = ''
    } else if (c === '\n') {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else if (c !== '\r') {
      cell += c
    }
  }

  if (cell || row.length) {
    row.push(cell)
    rows.push(row)
  }

  const headers = rows.shift() || []
  return rows
    .filter((r) => r.some((x) => compact(x)))
    .map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ''])))
}

function safeName(ref, url) {
  const id = compact(url).match(/annunci\/(\d+)/)?.[1] || 'no-id'
  return `${ref}-${id}.html`
}

function shouldPauseForManualCheck({ status, html, text }) {
  const low = `${html}\n${text}`.toLowerCase()
  if (status === 403) return true
  if (html.length < 5000) return true
  if (low.includes('access denied')) return true
  if (low.includes('captcha')) return true
  if (low.includes('verify you are human')) return true
  if (low.includes('controlla di non essere un robot')) return true
  return false
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true })

  const csv = await fs.readFile(CSV_FILE, 'utf8')
  const rows = parseCsv(csv)
    .map((row) => ({
      ref: compact(row.REF),
      title: compact(row.Titolo),
      url: compact(row['URL annuncio']),
    }))
    .filter((row) => /^IM\d{4}AA$/.test(row.ref))
    .filter((row) => /^https:\/\/www\.immobiliare\.it\/annunci\//i.test(row.url))

  console.log('=== CAPTURE PAGINE DETTAGLIO IMMOBILIARE.IT ===')
  console.log('Non scrive in Supabase.')
  console.log(`URL da salvare: ${rows.length}`)
  console.log(`Cartella output: ${OUT_DIR}`)
  console.log('')

  const rl = readline.createInterface({ input, output })

  const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
    headless: false,
    viewport: { width: 1440, height: 1000 },
    locale: 'it-IT',
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36',
  })

  const page = context.pages()[0] || await context.newPage()

  let saved = 0
  let failed = 0

  for (const [index, row] of rows.entries()) {
    const outFile = path.join(OUT_DIR, safeName(row.ref, row.url))

    console.log('')
    console.log(`=== ${index + 1}/${rows.length} ${row.ref} ===`)
    console.log(row.title)
    console.log(row.url)

    try {
      const response = await page.goto(row.url, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      }).catch((error) => {
        console.log(`goto warning: ${error.message}`)
        return null
      })

      await page.waitForTimeout(5000)

      let status = response?.status() || 0
      let html = await page.content()
      let text = await page.locator('body').innerText({ timeout: 10000 }).catch(() => '')

      if (shouldPauseForManualCheck({ status, html, text })) {
        console.log('')
        console.log('ATTENZIONE: pagina sospetta/bloccata o incompleta.')
        console.log('Nel browser aperto, accetta cookie / risolvi eventuale controllo / attendi caricamento.')
        await rl.question('Quando la pagina si vede bene, premi INVIO qui nel terminale... ')

        await page.waitForTimeout(3000)
        status = 0
        html = await page.content()
        text = await page.locator('body').innerText({ timeout: 10000 }).catch(() => '')
      }

      const marker = [
        '<!-- AREA_IMPORT_CAPTURE_META',
        `REF=${row.ref}`,
        `TITLE=${row.title}`,
        `URL=${row.url}`,
        `CAPTURED_AT=${new Date().toISOString()}`,
        'AREA_IMPORT_CAPTURE_META -->',
        '',
      ].join('\n')

      await fs.writeFile(outFile, marker + html, 'utf8')
      console.log(`SAVED ${row.ref} | html ${Math.round(html.length / 1024)} KB | text ${Math.round(text.length / 1024)} KB`)
      saved += 1
    } catch (error) {
      console.log(`FAIL ${row.ref} | ${error.message}`)
      failed += 1
    }
  }

  await context.close()
  rl.close()

  console.log('')
  console.log('=== FINE CAPTURE ===')
  console.log(`Salvate: ${saved}`)
  console.log(`Fallite: ${failed}`)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
