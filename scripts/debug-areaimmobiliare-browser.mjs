import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'

const OUT_DIR = path.join(process.cwd(), 'data', 'imports', 'debug-old-site')
fs.mkdirSync(OUT_DIR, { recursive: true })

const urls = [
  'https://www.areaimmobiliare.com/',
  'https://www.areaimmobiliare.com/ricerca-avanzata/',
  'https://www.areaimmobiliare.com/property-city/bergamo/',
  'https://www.areaimmobiliare.com/property/appartamento-centralissimo/',
  'https://www.areaimmobiliare.com/property/super-attico-in-citta/',
  'https://www.areaimmobiliare.com/property/panoramicissimo-centralissimo-attico/',
]

async function launchBrowser() {
  try {
    return await chromium.launch({
      channel: 'chrome',
      headless: true,
    })
  } catch {
    console.log('Chrome locale non disponibile per Playwright, provo Chromium bundled...')
    return await chromium.launch({
      headless: true,
    })
  }
}

function safeName(url) {
  return url
    .replace(/^https?:\/\//, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 120)
}

async function main() {
  console.log('')
  console.log('=== DEBUG AREAIMMOBILIARE CON BROWSER REALE ===')
  console.log('')

  const browser = await launchBrowser()

  const context = await browser.newContext({
    locale: 'it-IT',
    timezoneId: 'Europe/Rome',
    viewport: {
      width: 1440,
      height: 1200,
    },
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36',
    extraHTTPHeaders: {
      'Accept-Language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
    },
  })

  const page = await context.newPage()

  for (const url of urls) {
    const name = safeName(url)
    console.log('')
    console.log(`--- TEST: ${url} ---`)

    let status = null
    let finalUrl = url
    let error = null

    try {
      const response = await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 45000,
      })

      status = response?.status() || null
      finalUrl = page.url()

      try {
        await page.waitForLoadState('networkidle', { timeout: 12000 })
      } catch {
        // non blocchiamo: alcuni siti tengono richieste aperte
      }

      await page.waitForTimeout(3500)

      const title = await page.title()
      const html = await page.content()
      const bodyText = await page.evaluate(() => document.body?.innerText || '')
      const hrefs = await page.evaluate(() =>
        Array.from(document.querySelectorAll('a[href]'))
          .map((a) => a.href)
          .filter((href) => href.includes('/property/')),
      )

      const images = await page.evaluate(() =>
        Array.from(document.querySelectorAll('img'))
          .map((img) => img.currentSrc || img.src || '')
          .filter(Boolean)
          .filter((src) => src.includes('/wp-content/uploads/')),
      )

      fs.writeFileSync(path.join(OUT_DIR, `${name}.html`), html)
      fs.writeFileSync(path.join(OUT_DIR, `${name}.txt`), bodyText)
      await page.screenshot({
        path: path.join(OUT_DIR, `${name}.png`),
        fullPage: true,
      })

      console.log({
        status,
        finalUrl,
        title,
        htmlLength: html.length,
        bodyTextLength: bodyText.length,
        propertyLinks: [...new Set(hrefs)].slice(0, 20),
        propertyLinksCount: [...new Set(hrefs)].length,
        wpImagesCount: [...new Set(images)].length,
      })

      console.log('Prime righe testo:')
      console.log(
        bodyText
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
          .slice(0, 12)
          .join('\n'),
      )
    } catch (err) {
      error = err?.message || String(err)
      console.log({
        status,
        finalUrl,
        error,
      })
    }
  }

  await browser.close()

  console.log('')
  console.log(`File debug salvati in: ${OUT_DIR}`)
  console.log('')
}

main().catch((error) => {
  console.error('')
  console.error('DEBUG FALLITO:')
  console.error(error)
  process.exit(1)
})
