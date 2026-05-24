import fs from 'fs'
import path from 'path'

const INPUT = path.resolve('tmp/area-portali-audit/descrizioni-finali-portali-manuali.json')
const OUT_HTML = path.resolve('tmp/area-portali-audit/check-ref-link-titoli-portali.html')
const OUT_MD = path.resolve('tmp/area-portali-audit/check-ref-link-titoli-portali.md')
const OUT_JSON = path.resolve('tmp/area-portali-audit/check-ref-link-titoli-portali.json')

function compact(v) {
  return String(v ?? '').trim()
}

function esc(v) {
  return String(v ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

if (!fs.existsSync(INPUT)) {
  console.error('Manca ' + INPUT)
  process.exit(1)
}

const rows = JSON.parse(fs.readFileSync(INPUT, 'utf8'))
  .filter((r) => /^IM\d{4}AA$/.test(compact(r.reference_code)))
  .map((r) => ({
    ref: compact(r.reference_code),
    title: compact(r.title),
    url: compact(r.source_url),
    descriptionLength: compact(r.description).length,
  }))
  .sort((a, b) => a.ref.localeCompare(b.ref))

const byUrl = new Map()
for (const row of rows) {
  if (!row.url) continue
  if (!byUrl.has(row.url)) byUrl.set(row.url, [])
  byUrl.get(row.url).push(row.ref)
}

const enriched = rows.map((row) => {
  const refsForUrl = row.url ? byUrl.get(row.url) || [] : []
  const flags = []

  if (!row.url) flags.push('LINK_MANCANTE')
  if (refsForUrl.length > 1) flags.push('STESSO_LINK_SU_PIU_REF')
  if (!row.title) flags.push('TITOLO_MANCANTE')

  return {
    ...row,
    sameUrlRefs: refsForUrl,
    flags,
  }
})

const suspicious = enriched.filter((r) => r.flags.length)

const md = []
md.push('# Controllo REF / link / titoli portali')
md.push('')
md.push(`Generato: ${new Date().toLocaleString('it-IT')}`)
md.push('')
md.push('## Riepilogo')
md.push('')
md.push(`- REF controllati: **${enriched.length}**`)
md.push(`- REF con avvisi: **${suspicious.length}**`)
md.push('')
md.push('## Avvisi')
md.push('')
if (!suspicious.length) {
  md.push('Nessun avviso.')
} else {
  md.push('| REF | Avvisi | Titolo | Link | REF con stesso link |')
  md.push('|---|---|---|---|---|')
  for (const row of suspicious) {
    md.push(`| ${row.ref} | ${row.flags.join(', ')} | ${row.title} | ${row.url || '-'} | ${row.sameUrlRefs.join(', ') || '-'} |`)
  }
}
md.push('')
md.push('## Tutti i REF')
md.push('')
md.push('| REF | Titolo atteso | Link |')
md.push('|---|---|---|')
for (const row of enriched) {
  md.push(`| ${row.ref} | ${row.title} | ${row.url ? `[apri](${row.url})` : '-'} |`)
}

const cards = enriched.map((row) => {
  const warn = row.flags.length
    ? `<div class="warn">⚠️ ${esc(row.flags.join(' · '))}${row.sameUrlRefs.length > 1 ? `<br>Stesso link usato da: <b>${esc(row.sameUrlRefs.join(', '))}</b>` : ''}</div>`
    : `<div class="ok">OK mappa interna: REF, titolo e link sono presenti.</div>`

  return `
    <section class="card ${row.flags.length ? 'bad' : 'good'}">
      <div class="ref">${esc(row.ref)}</div>
      <h2>${esc(row.title)}</h2>
      ${warn}
      <p class="small">Quando apri il link, controlla che il titolo/immobile sul portale sia questo. Se non combacia, NON copiare foto in quella cartella.</p>
      ${row.url ? `<a class="btn" href="${esc(row.url)}" target="_blank" rel="noreferrer">Apri link origine</a>` : `<span class="no">Link mancante</span>`}
      <p class="url">${esc(row.url || '-')}</p>
    </section>
  `
}).join('\n')

const html = `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<title>Controllo REF link titoli portali</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
body{margin:0;padding:28px;background:#0b1120;color:#e5e7eb;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
main{max-width:1300px;margin:auto}
h1{font-size:34px;margin:0 0 8px}
.top{padding:20px;border:1px solid rgba(148,163,184,.25);border-radius:24px;background:rgba(15,23,42,.9);margin-bottom:18px}
.notice{margin-top:14px;padding:14px;border-radius:18px;background:rgba(245,158,11,.13);border:1px solid rgba(245,158,11,.4);color:#fde68a;font-weight:900}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:14px}
.card{padding:16px;border-radius:22px;background:rgba(15,23,42,.92);border:1px solid rgba(148,163,184,.25)}
.card.bad{border-color:rgba(245,158,11,.65)}
.ref{display:inline-flex;padding:6px 10px;border-radius:999px;background:rgba(59,130,246,.16);border:1px solid rgba(59,130,246,.4);color:#bfdbfe;font-weight:950;letter-spacing:.08em}
h2{font-size:18px;margin:10px 0}
.ok{padding:10px;border-radius:14px;background:rgba(34,197,94,.12);border:1px solid rgba(34,197,94,.35);color:#bbf7d0;font-weight:800}
.warn{padding:10px;border-radius:14px;background:rgba(245,158,11,.13);border:1px solid rgba(245,158,11,.45);color:#fde68a;font-weight:900}
.small{color:#94a3b8;line-height:1.45}
.btn{display:inline-flex;margin-top:8px;padding:10px 12px;border-radius:14px;background:#facc15;color:#111827;text-decoration:none;font-weight:950}
.url{font-size:12px;color:#94a3b8;word-break:break-all}
.no{color:#fecaca;font-weight:900}
</style>
</head>
<body>
<main>
  <div class="top">
    <h1>Controllo REF / link / titolo</h1>
    <p>Questa pagina non apre bot e non scarica nulla. Serve solo a controllare manualmente che il link corrisponda al titolo del REF.</p>
    <div class="notice">
      Regola: apri il link, guarda il titolo/immobile sul portale. Se non è lo stesso immobile del REF, non copiare foto in quella cartella.
    </div>
    <p>REF controllati: <b>${enriched.length}</b> · REF con avvisi: <b>${suspicious.length}</b></p>
  </div>
  <div class="grid">
    ${cards}
  </div>
</main>
</body>
</html>`

fs.writeFileSync(OUT_MD, md.join('\n') + '\n', 'utf8')
fs.writeFileSync(OUT_HTML, html, 'utf8')
fs.writeFileSync(OUT_JSON, JSON.stringify({
  generated_at: new Date().toISOString(),
  total: enriched.length,
  warnings: suspicious.length,
  rows: enriched,
}, null, 2), 'utf8')

console.log('=== CONTROLLO REF / LINK / TITOLI CREATO ===')
console.log(OUT_HTML)
console.log(OUT_MD)
console.log(OUT_JSON)
console.log('')
console.log(md.slice(0, 120).join('\n'))
