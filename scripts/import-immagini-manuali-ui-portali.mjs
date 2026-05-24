import fs from 'fs'
import path from 'path'
import http from 'http'
import crypto from 'crypto'
import { execFile } from 'child_process'

const PORT = Number(process.env.PORT || 8787)
const ROOT = path.resolve('tmp/area-portali-audit/immagini-manuali-da-importare')
const INPUT = path.resolve('tmp/area-portali-audit/descrizioni-finali-portali-manuali.json')
const BUCKET = 'property-media'

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return

  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue

    const index = trimmed.indexOf('=')
    const key = trimmed.slice(0, index).trim()
    let value = trimmed.slice(index + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    if (!process.env[key]) process.env[key] = value
  }
}

for (const file of ['.env.local', '.env', '.env.development.local', '.env.production.local']) {
  loadEnvFile(file)
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('ERRORE: variabili Supabase mancanti in .env.local')
  process.exit(1)
}

if (!fs.existsSync(INPUT)) {
  console.error('ERRORE: manca ' + INPUT)
  process.exit(1)
}

fs.mkdirSync(ROOT, { recursive: true })

const jobs = new Map()

function compact(value) {
  return String(value ?? '').trim()
}

function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function json(res, status, data) {
  const body = JSON.stringify(data, null, 2)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  })
  res.end(body)
}

function html(res, body) {
  res.writeHead(200, {
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'no-store',
  })
  res.end(body)
}

function text(res, status, body) {
  res.writeHead(status, {
    'content-type': 'text/plain; charset=utf-8',
    'cache-control': 'no-store',
  })
  res.end(body)
}

async function readBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw) return {}
  return JSON.parse(raw)
}

function rowsFromInput() {
  const rows = JSON.parse(fs.readFileSync(INPUT, 'utf8'))
    .filter((row) => /^IM\d{4}AA$/.test(compact(row.reference_code)))
    .map((row) => ({
      ref: compact(row.reference_code),
      title: compact(row.title),
      source_url: compact(row.source_url),
      description: compact(row.description),
    }))
    .sort((a, b) => a.ref.localeCompare(b.ref))

  for (const row of rows) {
    const refDir = path.join(ROOT, row.ref)
    const importDir = path.join(refDir, 'importate')
    fs.mkdirSync(importDir, { recursive: true })

    const readme = path.join(refDir, 'LEGGIMI.txt')
    if (!fs.existsSync(readme)) {
      fs.writeFileSync(
        readme,
        [
          `REF: ${row.ref}`,
          `Titolo: ${row.title}`,
          `URL origine: ${row.source_url || '-'}`,
          '',
          'Metti le foto verificate dentro la sottocartella:',
          'importate',
          '',
          'Ordine consigliato:',
          '01-cover.jpg',
          '02-soggiorno.jpg',
          '03-camera.jpg',
          '',
          'Formati supportati: jpg, jpeg, png, webp',
          '',
        ].join('\n'),
        'utf8',
      )
    }
  }

  return rows
}

function importDirFor(ref) {
  return path.join(ROOT, ref, 'importate')
}

function supportedImage(file) {
  return ['.jpg', '.jpeg', '.png', '.webp'].includes(path.extname(file).toLowerCase())
}

function imageFilesFor(ref) {
  const dir = importDirFor(ref)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  return fs
    .readdirSync(dir)
    .filter(supportedImage)
    .sort((a, b) => a.localeCompare(b, 'it', { numeric: true }))
    .map((name) => ({
      name,
      fullPath: path.join(dir, name),
      size: fs.statSync(path.join(dir, name)).size,
    }))
}

function mimeFor(file) {
  const ext = path.extname(file).toLowerCase()
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg'
  if (ext === '.png') return 'image/png'
  if (ext === '.webp') return 'image/webp'
  return 'application/octet-stream'
}

function safeName(file) {
  const ext = path.extname(file).toLowerCase()
  const base =
    path
      .basename(file, ext)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 70) || 'foto'

  return base + ext
}

function publicUrl(objectPath) {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${objectPath}`
}

async function supabaseFetch(restPath, options = {}) {
  const response = await fetch(`${SUPABASE_URL}${restPath}`, {
    ...options,
    headers: {
      apikey: SERVICE_KEY,
      authorization: `Bearer ${SERVICE_KEY}`,
      'content-type': 'application/json',
      ...(options.headers || {}),
    },
  })

  const body = await response.text()

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${body.slice(0, 800)}`)
  }

  if (!body) return null
  return JSON.parse(body)
}

async function uploadStorage(objectPath, buffer, contentType) {
  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${objectPath}`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      authorization: `Bearer ${SERVICE_KEY}`,
      'content-type': contentType,
      'x-upsert': 'true',
    },
    body: buffer,
  })

  const body = await response.text()

  if (!response.ok) {
    throw new Error(`Storage upload fallito ${objectPath}: ${response.status} ${body.slice(0, 800)}`)
  }
}

async function getProperty(ref) {
  const rows = await supabaseFetch(
    `/rest/v1/properties?select=id,reference_code,title,slug,status,price,main_image,gallery&reference_code=eq.${encodeURIComponent(ref)}&limit=1`,
  )

  return Array.isArray(rows) ? rows[0] : null
}

async function getMedia(propertyId) {
  return await supabaseFetch(
    `/rest/v1/property_media?select=id,file_url,label,sort_order,is_cover&property_id=eq.${propertyId}&order=sort_order.asc,created_at.asc`,
  )
}

function isImportedMediaForRef(media, ref) {
  const url = compact(media.file_url)
  const label = compact(media.label)
  return (
    url.includes(`/portali/${ref}/`) ||
    url.includes(`/manual-portali/${ref}/`) ||
    label.includes(ref)
  )
}

async function deleteImportedMediaForRef(propertyId, ref, job) {
  const media = await getMedia(propertyId)
  const toDelete = media.filter((item) => isImportedMediaForRef(item, ref))

  for (const item of toDelete) {
    await supabaseFetch(`/rest/v1/property_media?id=eq.${item.id}`, {
      method: 'DELETE',
      headers: { prefer: 'return=minimal' },
    })
    job.logs.push(`Rimossa vecchia riga media ${item.id}`)
  }
}

async function importRef(job, ref, replace) {
  job.status = 'running'
  job.logs.push(`Avvio import ${ref}`)

  const files = imageFilesFor(ref)
  job.total = files.length

  if (!files.length) {
    throw new Error(`Nessuna immagine trovata in ${importDirFor(ref)}`)
  }

  const property = await getProperty(ref)
  if (!property) {
    throw new Error(`Immobile ${ref} non trovato in Supabase`)
  }

  const currentMedia = await getMedia(property.id)
  const currentGallery = Array.isArray(property.gallery) ? property.gallery : []
  const hasExisting =
    currentMedia.length > 0 ||
    currentGallery.length > 0 ||
    Boolean(property.main_image)

  if (hasExisting && !replace) {
    throw new Error(`${ref} ha già immagini. Spunta "sostituisci immagini importate" e riprova.`)
  }

  if (replace) {
    job.logs.push('Sostituzione attiva: rimuovo vecchie righe media importate per questo REF')
    await deleteImportedMediaForRef(property.id, ref, job)
  }

  const uploadedUrls = []

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index]
    const buffer = fs.readFileSync(file.fullPath)
    const hash = crypto.createHash('sha1').update(buffer).digest('hex').slice(0, 10)
    const objectPath = `manual-portali/${ref}/importate/${String(index + 1).padStart(2, '0')}-${hash}-${safeName(file.name)}`

    job.current = file.name
    job.logs.push(`Upload ${index + 1}/${files.length}: ${file.name}`)

    await uploadStorage(objectPath, buffer, mimeFor(file.name))

    const url = publicUrl(objectPath)
    uploadedUrls.push(url)

    await supabaseFetch('/rest/v1/property_media', {
      method: 'POST',
      headers: { prefer: 'return=minimal' },
      body: JSON.stringify({
        property_id: property.id,
        media_type: 'image',
        file_url: url,
        label: `Import manuale ${ref}`,
        sort_order: index + 1,
        is_cover: index === 0,
      }),
    })

    job.done = index + 1
  }

  await supabaseFetch(`/rest/v1/properties?id=eq.${property.id}`, {
    method: 'PATCH',
    headers: { prefer: 'return=minimal' },
    body: JSON.stringify({
      main_image: uploadedUrls[0],
      gallery: uploadedUrls,
      photo_coming_soon: false,
      no_photo_available: false,
    }),
  })

  job.status = 'done'
  job.current = ''
  job.logs.push(`Completato ${ref}: ${uploadedUrls.length} immagini importate`)
}

async function refsPayload() {
  const rows = rowsFromInput()
  const enriched = []

  for (const row of rows) {
    const files = imageFilesFor(row.ref)
    const property = await getProperty(row.ref)

    let mediaCount = 0
    let galleryCount = 0
    let hasMainImage = false

    if (property) {
      const media = await getMedia(property.id)
      mediaCount = media.length
      galleryCount = Array.isArray(property.gallery) ? property.gallery.length : 0
      hasMainImage = Boolean(property.main_image)
    }

    enriched.push({
      ...row,
      local_count: files.length,
      local_files: files.map((file) => ({
        name: file.name,
        size: file.size,
      })),
      property_found: Boolean(property),
      site_title: property?.title || '',
      media_count: mediaCount,
      gallery_count: galleryCount,
      has_main_image: hasMainImage,
      import_dir: importDirFor(row.ref),
    })
  }

  return enriched
}

function openPath(target) {
  const command =
    process.platform === 'darwin'
      ? 'open'
      : process.platform === 'win32'
        ? 'explorer'
        : 'xdg-open'

  execFile(command, [target], (error) => {
    if (error) console.error(error.message)
  })
}

function page() {
  return `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<title>Import immagini manuali portali</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
:root{
  color-scheme:dark;
  --bg:#0b1120;
  --panel:#0f172a;
  --panel2:#111827;
  --text:#e5e7eb;
  --muted:#94a3b8;
  --border:rgba(148,163,184,.25);
  --yellow:#facc15;
  --orange:#f59e0b;
  --green:#22c55e;
  --red:#ef4444;
  --blue:#60a5fa;
}
*{box-sizing:border-box}
body{
  margin:0;
  padding:24px;
  background:radial-gradient(circle at top,#1e293b 0,var(--bg) 45%);
  color:var(--text);
  font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
}
main{max-width:1500px;margin:0 auto}
.top{
  padding:22px;
  border:1px solid var(--border);
  border-radius:24px;
  background:rgba(15,23,42,.9);
  box-shadow:0 24px 70px rgba(0,0,0,.35);
  margin-bottom:18px;
}
h1{font-size:34px;margin:0 0 8px}
.notice{
  margin-top:14px;
  padding:14px;
  border-radius:18px;
  border:1px solid rgba(245,158,11,.45);
  background:rgba(245,158,11,.13);
  color:#fde68a;
  font-weight:850;
}
.toolbar{display:flex;gap:10px;flex-wrap:wrap;margin-top:16px}
button,a.btn{
  border:0;
  border-radius:14px;
  padding:10px 12px;
  font-weight:900;
  cursor:pointer;
  text-decoration:none;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  gap:6px;
}
.primary{background:var(--yellow);color:#111827}
.secondary{background:rgba(148,163,184,.14);color:#e5e7eb;border:1px solid var(--border)}
.danger{background:rgba(239,68,68,.18);color:#fecaca;border:1px solid rgba(239,68,68,.45)}
button:disabled{opacity:.45;cursor:not-allowed}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:14px}
.card{
  padding:16px;
  border-radius:24px;
  border:1px solid var(--border);
  background:rgba(17,24,39,.92);
  box-shadow:0 18px 40px rgba(0,0,0,.25);
}
.card.has-local{border-color:rgba(34,197,94,.45)}
.card.has-existing{border-color:rgba(245,158,11,.5)}
.ref{
  display:inline-flex;
  padding:6px 10px;
  border-radius:999px;
  background:rgba(59,130,246,.16);
  border:1px solid rgba(59,130,246,.4);
  color:#bfdbfe;
  font-weight:950;
  letter-spacing:.08em;
}
h2{font-size:18px;margin:10px 0 8px}
.meta,.small,.dir,.files,.joblog{color:var(--muted);font-size:13px;line-height:1.45}
.dir{word-break:break-all;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace}
.badge{
  display:inline-flex;
  margin:4px 6px 4px 0;
  padding:5px 8px;
  border-radius:999px;
  background:rgba(255,255,255,.06);
  border:1px solid var(--border);
  color:#cbd5e1;
  font-size:12px;
  font-weight:850;
}
.badge.green{color:#bbf7d0;border-color:rgba(34,197,94,.35);background:rgba(34,197,94,.12)}
.badge.orange{color:#fed7aa;border-color:rgba(245,158,11,.45);background:rgba(245,158,11,.13)}
.badge.red{color:#fecaca;border-color:rgba(239,68,68,.45);background:rgba(239,68,68,.13)}
.actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0}
.importrow{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:10px}
label{font-size:13px;color:#cbd5e1;font-weight:750}
.progress{
  width:100%;
  height:12px;
  border-radius:999px;
  overflow:hidden;
  background:#020617;
  border:1px solid var(--border);
  margin-top:10px;
}
.bar{
  height:100%;
  width:0%;
  background:linear-gradient(90deg,#facc15,#22c55e);
  transition:width .25s ease;
}
.joblog{
  min-height:38px;
  margin-top:8px;
  padding:10px;
  border-radius:14px;
  background:rgba(2,6,23,.45);
  border:1px solid var(--border);
  white-space:pre-wrap;
}
.files ul{margin:6px 0 0 18px;padding:0}
hr{border:0;border-top:1px solid var(--border);margin:12px 0}
</style>
</head>
<body>
<main>
  <div class="top">
    <h1>Import immagini manuali portali</h1>
    <p class="meta">Questa pagina è locale. Non scarica immagini dal portale. Tu salvi le foto nella cartella importate del REF, poi premi Importa.</p>
    <div class="notice">
      Flusso sicuro: apri annuncio → salva manualmente le immagini giuste → apri cartella importate → incolla foto → importa quel REF.
    </div>
    <div class="toolbar">
      <button class="primary" onclick="refresh()">Aggiorna conteggi</button>
      <button class="secondary" onclick="openRoot()">Apri cartella principale</button>
    </div>
  </div>

  <div id="grid" class="grid"></div>
</main>

<script>
const jobsByRef = new Map()

function euroLike(v){return v || '-'}

async function api(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      'content-type': 'application/json',
      ...(options.headers || {}),
    },
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.error || res.statusText)
  return data
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
}

async function openRoot() {
  await api('/api/open-root', { method: 'POST', body: '{}' })
}

async function openFolder(ref) {
  await api('/api/open-folder', {
    method: 'POST',
    body: JSON.stringify({ ref }),
  })
}

async function startImport(ref) {
  const replace = document.querySelector('#replace-' + ref)?.checked || false
  const card = document.querySelector('#card-' + ref)
  const log = card.querySelector('.joblog')
  const btn = card.querySelector('.import-btn')

  btn.disabled = true
  log.textContent = 'Avvio import...'

  try {
    const data = await api('/api/import-ref', {
      method: 'POST',
      body: JSON.stringify({ ref, replace }),
    })

    jobsByRef.set(ref, data.jobId)
    pollJob(ref, data.jobId)
  } catch (error) {
    log.textContent = 'ERRORE: ' + error.message
    btn.disabled = false
  }
}

async function pollJob(ref, jobId) {
  const card = document.querySelector('#card-' + ref)
  const bar = card.querySelector('.bar')
  const log = card.querySelector('.joblog')
  const btn = card.querySelector('.import-btn')

  try {
    const job = await api('/api/job?id=' + encodeURIComponent(jobId))
    const pct = job.total ? Math.round((job.done / job.total) * 100) : 0
    bar.style.width = pct + '%'

    const lastLogs = (job.logs || []).slice(-5).join('\\n')
    log.textContent =
      'Stato: ' + job.status +
      '\\nProgresso: ' + job.done + '/' + job.total +
      (job.current ? '\\nFile: ' + job.current : '') +
      (job.error ? '\\nERRORE: ' + job.error : '') +
      (lastLogs ? '\\n\\n' + lastLogs : '')

    if (job.status === 'done') {
      btn.disabled = false
      await refresh()
      return
    }

    if (job.status === 'error') {
      btn.disabled = false
      return
    }

    setTimeout(() => pollJob(ref, jobId), 700)
  } catch (error) {
    log.textContent = 'ERRORE POLL: ' + error.message
    btn.disabled = false
  }
}

function render(rows) {
  const grid = document.getElementById('grid')

  grid.innerHTML = rows.map((row) => {
    const hasLocal = row.local_count > 0
    const hasExisting = row.media_count > 0 || row.gallery_count > 0 || row.has_main_image
    const classes = [
      'card',
      hasLocal ? 'has-local' : '',
      hasExisting ? 'has-existing' : '',
    ].join(' ')

    const fileList = row.local_files?.length
      ? '<ul>' + row.local_files.map((file) => '<li>' + escapeHtml(file.name) + '</li>').join('') + '</ul>'
      : '<p>Nessuna foto nella cartella importate.</p>'

    return \`
      <section class="\${classes}" id="card-\${escapeHtml(row.ref)}">
        <div class="ref">\${escapeHtml(row.ref)}</div>
        <h2>\${escapeHtml(row.title)}</h2>

        <div>
          <span class="badge \${hasLocal ? 'green' : 'red'}">Locali importate: \${row.local_count}</span>
          <span class="badge \${hasExisting ? 'orange' : 'green'}">Sul sito: media \${row.media_count}, gallery \${row.gallery_count}</span>
          <span class="badge \${row.property_found ? 'green' : 'red'}">\${row.property_found ? 'Supabase OK' : 'Non trovato'}</span>
        </div>

        <p class="small">Titolo Supabase: \${escapeHtml(row.site_title || '-')}</p>
        <p class="dir">\${escapeHtml(row.import_dir)}</p>

        <div class="actions">
          \${row.source_url ? '<a class="btn secondary" href="' + escapeHtml(row.source_url) + '" target="_blank" rel="noreferrer">Apri annuncio</a>' : '<button class="secondary" disabled>Link assente</button>'}
          <button class="secondary" onclick="openFolder('\${escapeHtml(row.ref)}')">Apri cartella importate</button>
        </div>

        <div class="files">
          <b>File locali:</b>
          \${fileList}
        </div>

        <hr>

        <div class="importrow">
          <label>
            <input type="checkbox" id="replace-\${escapeHtml(row.ref)}">
            sostituisci immagini importate già presenti
          </label>
          <button class="primary import-btn" onclick="startImport('\${escapeHtml(row.ref)}')" \${hasLocal ? '' : 'disabled'}>
            Importa questo REF
          </button>
        </div>

        <div class="progress"><div class="bar"></div></div>
        <div class="joblog">Pronto.</div>
      </section>
    \`
  }).join('')
}

async function refresh() {
  const rows = await api('/api/refs')
  render(rows)
}

refresh()
</script>
</body>
</html>`
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${PORT}`)

    if (req.method === 'GET' && url.pathname === '/') {
      return html(res, page())
    }

    if (req.method === 'GET' && url.pathname === '/api/refs') {
      return json(res, 200, await refsPayload())
    }

    if (req.method === 'GET' && url.pathname === '/api/job') {
      const id = compact(url.searchParams.get('id'))
      const job = jobs.get(id)
      if (!job) return json(res, 404, { error: 'Job non trovato' })
      return json(res, 200, job)
    }

    if (req.method === 'POST' && url.pathname === '/api/open-root') {
      fs.mkdirSync(ROOT, { recursive: true })
      openPath(ROOT)
      return json(res, 200, { ok: true })
    }

    if (req.method === 'POST' && url.pathname === '/api/open-folder') {
      const body = await readBody(req)
      const ref = compact(body.ref)

      if (!/^IM\d{4}AA$/.test(ref)) {
        return json(res, 400, { error: 'REF non valido' })
      }

      const dir = importDirFor(ref)
      fs.mkdirSync(dir, { recursive: true })
      openPath(dir)

      return json(res, 200, { ok: true, dir })
    }

    if (req.method === 'POST' && url.pathname === '/api/import-ref') {
      const body = await readBody(req)
      const ref = compact(body.ref)
      const replace = Boolean(body.replace)

      if (!/^IM\d{4}AA$/.test(ref)) {
        return json(res, 400, { error: 'REF non valido' })
      }

      const jobId = crypto.randomUUID()
      const job = {
        id: jobId,
        ref,
        replace,
        status: 'queued',
        total: 0,
        done: 0,
        current: '',
        logs: [],
        error: '',
      }

      jobs.set(jobId, job)

      importRef(job, ref, replace).catch((error) => {
        job.status = 'error'
        job.error = error.message
        job.logs.push('ERRORE: ' + error.message)
      })

      return json(res, 200, { ok: true, jobId })
    }

    return text(res, 404, 'Not found')
  } catch (error) {
    return json(res, 500, { error: error.message })
  }
})

server.listen(PORT, () => {
  const url = `http://localhost:${PORT}`
  console.log('')
  console.log('=== UI IMPORT IMMAGINI MANUALI PORTALI ===')
  console.log(url)
  console.log('')
  console.log('Lascia questo terminale aperto mentre usi la pagina.')
  console.log('Per chiudere: CTRL+C')
  console.log('')

  openPath(url)
})
