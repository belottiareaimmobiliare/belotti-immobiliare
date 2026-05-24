import fs from 'fs'
import path from 'path'

const OUT_DIR = path.resolve('tmp/area-portali-audit')
const MISSING_JSON = path.join(OUT_DIR, 'audit-immobili-senza-foto.json')
const IMAGES_JSON = path.join(OUT_DIR, 'immagini-portali-per-ref.json')
const DESCRIPTIONS_JSON = path.join(OUT_DIR, 'descrizioni-finali-portali-manuali.json')

const OUT_HTML = path.join(OUT_DIR, 'review-immagini-mancanti-portali.html')
const OUT_MD = path.join(OUT_DIR, 'review-immagini-mancanti-portali.md')
const OUT_JSON = path.join(OUT_DIR, 'review-immagini-mancanti-portali.json')

function compact(value) {
  return String(value ?? '').trim()
}

function readJson(file, fallback = null) {
  if (!fs.existsSync(file)) return fallback
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function isImageUrl(value) {
  const s = compact(value)
  if (!/^https?:\/\//i.test(s)) return false
  if (/supabase\.co\/storage/i.test(s)) return false
  if (/favicon|apple-touch-icon|sprite|placeholder|common_images|PubblicaAnnuncio|AnnunciPubblicati|ValutaCasa|MiaCasa|VendiCasa/i.test(s)) return false
  return (
    /im-cdn\.it\/image\/\d+/i.test(s) ||
    /images-\d+\.casa\.it\/.*\.(jpg|jpeg|png|webp)/i.test(s) ||
    /\.(jpg|jpeg|png|webp)(\?|$)/i.test(s)
  )
}

function walk(value, cb) {
  if (Array.isArray(value)) {
    for (const item of value) walk(item, cb)
    return
  }

  if (value && typeof value === 'object') {
    cb(value)
    for (const child of Object.values(value)) walk(child, cb)
  }
}

function collectUrls(value, out = new Set()) {
  if (typeof value === 'string') {
    if (isImageUrl(value)) out.add(value)
    return out
  }

  if (Array.isArray(value)) {
    for (const item of value) collectUrls(item, out)
    return out
  }

  if (value && typeof value === 'object') {
    for (const item of Object.values(value)) collectUrls(item, out)
  }

  return out
}

function findCandidateObjectsByRef(imagesRaw) {
  const map = new Map()

  walk(imagesRaw, (obj) => {
    const ref = compact(obj.reference_code || obj.referenceCode || obj.ref || obj.REF)
    if (!/^IM\d{4}AA$/i.test(ref)) return

    const urls = [...collectUrls(obj)]
    const status = compact(obj.status || obj.stato || obj.state || obj.esito || '')
    const title = compact(obj.title || obj.immobile || obj.property_title || '')

    if (!map.has(ref)) {
      map.set(ref, {
        ref,
        status,
        title,
        urls: [],
      })
    }

    const row = map.get(ref)
    if (status && !row.status) row.status = status
    if (title && !row.title) row.title = title

    for (const url of urls) {
      if (!row.urls.includes(url)) row.urls.push(url)
    }
  })

  return map
}

function findSourceMap() {
  const rows = readJson(DESCRIPTIONS_JSON, [])
  const map = new Map()

  if (Array.isArray(rows)) {
    for (const row of rows) {
      const ref = compact(row.reference_code || row.ref)
      if (!ref) continue
      map.set(ref, {
        source_url: compact(row.source_url || row.url),
        description: compact(row.description),
      })
    }
  }

  return map
}

function statusBadge(row) {
  if (!row.urls.length) return 'NO_IMAGES'
  if (row.urls.length > 0) return 'DA_VERIFICARE'
  return '-'
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })

  if (!fs.existsSync(MISSING_JSON)) {
    throw new Error(`Manca ${MISSING_JSON}. Prima esegui: npm run audit:media:missing`)
  }

  const missingRaw = readJson(MISSING_JSON)
  const imagesRaw = readJson(IMAGES_JSON, {})
  const candidatesByRef = findCandidateObjectsByRef(imagesRaw)
  const sourceByRef = findSourceMap()

  const missing = Array.isArray(missingRaw.imported_without_photos)
    ? missingRaw.imported_without_photos
    : []

  const rows = missing
    .map((item) => {
      const ref = compact(item.reference_code)
      const candidate = candidatesByRef.get(ref) || { urls: [], status: '' }
      const source = sourceByRef.get(ref) || {}

      return {
        reference_code: ref,
        title: compact(item.title),
        status: compact(item.status),
        contract_type: compact(item.contract_type),
        price_label: compact(item.price_label),
        city: compact(item.city || item.comune),
        province: compact(item.province),
        area: compact(item.area),
        slug: compact(item.slug),
        source_url: source.source_url || '',
        description: source.description || '',
        candidate_status_from_file: candidate.status || '',
        candidate_images: candidate.urls.length,
        review_status: statusBadge(candidate),
        urls: candidate.urls.slice(0, 30),
      }
    })
    .sort((a, b) => a.reference_code.localeCompare(b.reference_code))

  const withCandidate = rows.filter((r) => r.urls.length)
  const withoutCandidate = rows.filter((r) => !r.urls.length)

  const md = []
  md.push('# Review immagini mancanti portali')
  md.push('')
  md.push(`Generato: ${new Date().toLocaleString('it-IT')}`)
  md.push('')
  md.push('## Riepilogo')
  md.push('')
  md.push(`- Draft importati senza foto: **${rows.length}**`)
  md.push(`- Con immagini candidate da verificare: **${withCandidate.length}**`)
  md.push(`- Senza immagini candidate: **${withoutCandidate.length}**`)
  md.push('')
  md.push('## Con immagini candidate')
  md.push('')
  md.push('| REF | Candidate | Comune | Zona | Prezzo | Titolo |')
  md.push('|---|---:|---|---|---:|---|')
  for (const row of withCandidate) {
    md.push(`| ${row.reference_code} | ${row.candidate_images} | ${row.city || '-'} | ${row.area || '-'} | ${row.price_label || '-'} | ${row.title} |`)
  }
  md.push('')
  md.push('## Senza immagini candidate')
  md.push('')
  if (!withoutCandidate.length) {
    md.push('Nessuno.')
  } else {
    md.push('| REF | Comune | Zona | Prezzo | Titolo |')
    md.push('|---|---|---|---:|---|')
    for (const row of withoutCandidate) {
      md.push(`| ${row.reference_code} | ${row.city || '-'} | ${row.area || '-'} | ${row.price_label || '-'} | ${row.title} |`)
    }
  }
  md.push('')
  md.push('## Nota')
  md.push('')
  md.push('Questa pagina serve solo per revisione visuale. Non importa immagini e non modifica Supabase.')

  const htmlCards = rows.map((row) => {
    const imgs = row.urls.length
      ? row.urls.map((url, index) => `
          <a href="${escapeHtml(url)}" target="_blank" rel="noreferrer" class="thumb">
            <img src="${escapeHtml(url)}" loading="lazy" alt="${escapeHtml(row.reference_code)} immagine ${index + 1}">
            <span>${index + 1}</span>
          </a>
        `).join('')
      : `<div class="empty">Nessuna immagine candidata trovata nel report.</div>`

    const desc = row.description
      ? `<details><summary>Descrizione usata</summary><p>${escapeHtml(row.description)}</p></details>`
      : ''

    const source = row.source_url
      ? `<a class="link" href="${escapeHtml(row.source_url)}" target="_blank" rel="noreferrer">Apri annuncio originale</a>`
      : `<span class="muted">Link annuncio non disponibile</span>`

    return `
      <section class="card ${row.urls.length ? 'has-candidates' : 'no-candidates'}">
        <div class="head">
          <div>
            <div class="ref">${escapeHtml(row.reference_code)}</div>
            <h2>${escapeHtml(row.title)}</h2>
            <p class="meta">${escapeHtml(row.contract_type || '-')} · ${escapeHtml(row.price_label || '-')} · ${escapeHtml(row.city || '-')} ${row.area ? '· ' + escapeHtml(row.area) : ''}</p>
            <p class="status">Stato: <b>${escapeHtml(row.review_status)}</b> · Candidate: <b>${row.urls.length}</b></p>
          </div>
          <div class="actions">${source}</div>
        </div>
        ${desc}
        <div class="grid">${imgs}</div>
      </section>
    `
  }).join('\n')

  const html = `<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <title>Review immagini mancanti portali</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    :root {
      color-scheme: dark;
      --bg: #0b1120;
      --panel: #111827;
      --panel2: #0f172a;
      --text: #e5e7eb;
      --muted: #94a3b8;
      --border: rgba(148,163,184,.25);
      --ok: #22c55e;
      --warn: #f59e0b;
      --bad: #ef4444;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 28px;
      background: radial-gradient(circle at top, #1e293b 0, var(--bg) 45%);
      color: var(--text);
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    h1 { margin: 0 0 8px; font-size: 32px; }
    h2 { margin: 4px 0 6px; font-size: 20px; }
    .top {
      max-width: 1500px;
      margin: 0 auto 22px;
      padding: 22px;
      border: 1px solid var(--border);
      background: rgba(15,23,42,.82);
      border-radius: 24px;
      box-shadow: 0 24px 70px rgba(0,0,0,.35);
    }
    .summary {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 14px;
    }
    .pill {
      padding: 10px 12px;
      border: 1px solid var(--border);
      border-radius: 999px;
      background: rgba(255,255,255,.04);
      color: var(--muted);
      font-weight: 700;
    }
    .pill b { color: var(--text); }
    .wrap {
      max-width: 1500px;
      margin: 0 auto;
      display: grid;
      gap: 18px;
    }
    .card {
      border: 1px solid var(--border);
      background: rgba(17,24,39,.9);
      border-radius: 24px;
      padding: 18px;
      box-shadow: 0 18px 40px rgba(0,0,0,.25);
    }
    .card.no-candidates { border-color: rgba(239,68,68,.55); }
    .head {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: flex-start;
      margin-bottom: 14px;
    }
    .ref {
      display: inline-flex;
      padding: 6px 10px;
      border-radius: 999px;
      background: rgba(59,130,246,.15);
      border: 1px solid rgba(59,130,246,.35);
      color: #bfdbfe;
      font-weight: 900;
      letter-spacing: .08em;
    }
    .meta, .status, .muted {
      color: var(--muted);
      margin: 0;
    }
    .status b { color: var(--warn); }
    .link {
      display: inline-flex;
      padding: 10px 12px;
      border-radius: 14px;
      background: rgba(245,158,11,.14);
      border: 1px solid rgba(245,158,11,.35);
      color: #fde68a;
      text-decoration: none;
      font-weight: 800;
      white-space: nowrap;
    }
    details {
      margin: 12px 0 16px;
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 12px;
      background: rgba(15,23,42,.75);
    }
    details summary { cursor: pointer; font-weight: 800; color: #cbd5e1; }
    details p { white-space: pre-wrap; color: #cbd5e1; line-height: 1.55; }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 12px;
    }
    .thumb {
      position: relative;
      display: block;
      min-height: 130px;
      border-radius: 18px;
      overflow: hidden;
      background: var(--panel2);
      border: 1px solid var(--border);
      text-decoration: none;
    }
    .thumb img {
      width: 100%;
      height: 150px;
      object-fit: cover;
      display: block;
      background: #020617;
    }
    .thumb span {
      position: absolute;
      top: 8px;
      left: 8px;
      padding: 4px 8px;
      border-radius: 999px;
      background: rgba(0,0,0,.65);
      color: white;
      font-weight: 900;
      font-size: 12px;
    }
    .empty {
      padding: 28px;
      border-radius: 18px;
      border: 1px dashed rgba(239,68,68,.6);
      color: #fecaca;
      background: rgba(127,29,29,.18);
      font-weight: 800;
    }
    @media (max-width: 800px) {
      body { padding: 14px; }
      .head { display: block; }
      .actions { margin-top: 12px; }
      .link { width: 100%; justify-content: center; }
    }
  </style>
</head>
<body>
  <main>
    <div class="top">
      <h1>Review immagini mancanti portali</h1>
      <p class="muted">Controllo visuale dei draft importati senza foto. Questa pagina non modifica Supabase.</p>
      <div class="summary">
        <div class="pill">Draft senza foto: <b>${rows.length}</b></div>
        <div class="pill">Con candidate: <b>${withCandidate.length}</b></div>
        <div class="pill">Senza candidate: <b>${withoutCandidate.length}</b></div>
      </div>
    </div>
    <div class="wrap">
      ${htmlCards}
    </div>
  </main>
</body>
</html>`

  fs.writeFileSync(OUT_HTML, html, 'utf8')
  fs.writeFileSync(OUT_MD, md.join('\n') + '\n', 'utf8')
  fs.writeFileSync(OUT_JSON, JSON.stringify({
    generated_at: new Date().toISOString(),
    summary: {
      missing_drafts: rows.length,
      with_candidate_images: withCandidate.length,
      without_candidate_images: withoutCandidate.length,
    },
    rows,
  }, null, 2), 'utf8')

  console.log('=== REVIEW IMMAGINI MANCANTI CREATA ===')
  console.log(OUT_HTML)
  console.log(OUT_MD)
  console.log(OUT_JSON)
  console.log('')
  console.log(md.join('\n'))
}

main()
