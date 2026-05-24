import fs from 'fs'
import path from 'path'

const ROOT = path.resolve('tmp/area-portali-audit/immagini-manuali-da-importare')
const FINAL_DESC = path.resolve('tmp/area-portali-audit/descrizioni-finali-portali-manuali.json')
const OUT_MD = path.resolve('tmp/area-portali-audit/istruzioni-import-immagini-manuali.md')
const OUT_HTML = path.resolve('tmp/area-portali-audit/istruzioni-import-immagini-manuali.html')

function compact(v) {
  return String(v ?? '').trim()
}

function safeHtml(v) {
  return String(v ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

if (!fs.existsSync(FINAL_DESC)) {
  console.error('Manca ' + FINAL_DESC)
  process.exit(1)
}

fs.mkdirSync(ROOT, { recursive: true })

const rows = JSON.parse(fs.readFileSync(FINAL_DESC, 'utf8'))
  .filter((r) => /^IM\d{4}AA$/.test(compact(r.reference_code)))
  .sort((a, b) => compact(a.reference_code).localeCompare(compact(b.reference_code)))

const md = []
md.push('# Import immagini manuali portali')
md.push('')
md.push(`Cartella principale: \`${ROOT}\``)
md.push('')
md.push('Metti le immagini dentro la cartella del REF corretto.')
md.push('')
md.push('| REF | Titolo | Link origine |')
md.push('|---|---|---|')

const cards = []

for (const row of rows) {
  const ref = compact(row.reference_code)
  const title = compact(row.title)
  const url = compact(row.source_url)

  const dir = path.join(ROOT, ref)
  fs.mkdirSync(dir, { recursive: true })

  fs.writeFileSync(
    path.join(dir, 'LEGGIMI.txt'),
    [
      `REF: ${ref}`,
      `Titolo: ${title}`,
      `URL origine: ${url || '-'}`,
      '',
      'Metti qui SOLO le foto corrette per questo immobile.',
      'Formati supportati: .jpg .jpeg .png .webp',
      'Ordine: il nome file decide l’ordine. Esempio:',
      '01-cover.jpg',
      '02-soggiorno.jpg',
      '03-camera.jpg',
      '',
    ].join('\n'),
    'utf8'
  )

  md.push(`| ${ref} | ${title} | ${url ? `[apri](${url})` : '-'} |`)

  cards.push(`
    <section class="card">
      <div class="ref">${safeHtml(ref)}</div>
      <h2>${safeHtml(title)}</h2>
      ${url ? `<a href="${safeHtml(url)}" target="_blank" rel="noreferrer">Apri annuncio origine</a>` : '<span>Nessun link origine</span>'}
      <p>Cartella: <code>${safeHtml(path.join(ROOT, ref))}</code></p>
    </section>
  `)
}

fs.writeFileSync(OUT_MD, md.join('\n') + '\n', 'utf8')

fs.writeFileSync(OUT_HTML, `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<title>Import immagini manuali portali</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
body{margin:0;padding:28px;background:#0b1120;color:#e5e7eb;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
main{max-width:1200px;margin:auto}
h1{font-size:34px;margin:0 0 10px}
.notice{padding:16px;border:1px solid rgba(245,158,11,.45);border-radius:18px;background:rgba(245,158,11,.13);color:#fde68a;font-weight:800;margin:18px 0}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px}
.card{background:rgba(15,23,42,.9);border:1px solid rgba(148,163,184,.25);border-radius:20px;padding:16px}
.ref{display:inline-flex;padding:6px 10px;border-radius:999px;background:rgba(59,130,246,.15);border:1px solid rgba(59,130,246,.35);color:#bfdbfe;font-weight:900}
h2{font-size:18px;margin:10px 0}
a{color:#fde68a;font-weight:800}
code{color:#cbd5e1;word-break:break-all}
</style>
</head>
<body>
<main>
<h1>Import immagini manuali portali</h1>
<div class="notice">
Non usare immagini candidate automatiche se non corrispondono. Metti nelle cartelle solo foto verificate.
</div>
<p>Cartella principale: <code>${safeHtml(ROOT)}</code></p>
<div class="grid">
${cards.join('\n')}
</div>
</main>
</body>
</html>`, 'utf8')

console.log('=== CARTELLE IMPORT IMMAGINI CREATE ===')
console.log(ROOT)
console.log(OUT_MD)
console.log(OUT_HTML)
console.log('')
console.log('Ora metti le immagini corrette nelle cartelle IMxxxxAA.')
