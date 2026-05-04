const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const SITE = (process.argv[2] || process.env.SITE || 'https://belotti-immobiliare.vercel.app').replace(/\/$/, '')
const OUT_DIR = path.join(process.cwd(), 'tmp', 'security-checks')
const RUN_ID = new Date().toISOString().replace(/[:.]/g, '-')
const REPORT = path.join(OUT_DIR, `security-report-${RUN_ID}.txt`)
const JS_DIR = path.join(OUT_DIR, `js-${RUN_ID}`)

fs.mkdirSync(OUT_DIR, { recursive: true })
fs.mkdirSync(JS_DIR, { recursive: true })

const rows = []

function write(line = '') {
  rows.push(line)
  console.log(line)
}

function section(title) {
  write('')
  write('='.repeat(90))
  write(title)
  write('='.repeat(90))
}

function status(code, label, detail = '') {
  const icon = code === 'PASS' ? '✅' : code === 'WARN' ? '⚠️ ' : code === 'FAIL' ? '❌' : 'ℹ️ '
  write(`${icon} [${code}] ${label}${detail ? ` — ${detail}` : ''}`)
}

function curl(args) {
  try {
    return execSync(`curl -L -s --max-time 15 ${args}`, {
      encoding: 'utf8',
      maxBuffer: 20 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
  } catch (error) {
    return ''
  }
}

function curlCode(url) {
  try {
    return execSync(`curl -L -s -o /dev/null -w "%{http_code} %{url_effective}" --max-time 15 "${url}"`, {
      encoding: 'utf8',
      maxBuffer: 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim()
  } catch (error) {
    return '000 ERROR'
  }
}

function curlCodeNoFollow(url) {
  try {
    return execSync(`curl -s -o /dev/null -w "%{http_code} %{redirect_url}" --max-time 15 "${url}"`, {
      encoding: 'utf8',
      maxBuffer: 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim()
  } catch (error) {
    return '000 ERROR'
  }
}

function maskSecret(value) {
  return String(value)
    .replace(/(service_role[^"'\\s:=]*["'\\s:=]+)[^"'\\s]+/gi, '$1***REDACTED***')
    .replace(/(password[^"'\\s:=]*["'\\s:=]+)[^"'\\s]+/gi, '$1***REDACTED***')
    .replace(/(secret[^"'\\s:=]*["'\\s:=]+)[^"'\\s]+/gi, '$1***REDACTED***')
    .replace(/(token[^"'\\s:=]*["'\\s:=]+)[^"'\\s]+/gi, '$1***REDACTED***')
    .replace(/(DATABASE_URL=["']?)[^"'\\s]+/gi, '$1***REDACTED***')
    .replace(/(SUPABASE_SERVICE_ROLE[^=]*=["']?)[^"'\\s]+/gi, '$1***REDACTED***')
    .replace(/(GMAIL[^=]*=["']?)[^"'\\s]+/gi, '$1***REDACTED***')
    .slice(0, 220)
}

function walk(dir, ignore = []) {
  const out = []
  if (!fs.existsSync(dir)) return out

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    const rel = path.relative(process.cwd(), full)

    if (ignore.some((item) => rel.includes(item))) continue

    if (entry.isDirectory()) {
      out.push(...walk(full, ignore))
    } else {
      out.push(full)
    }
  }

  return out
}

write(`Security check sito: ${SITE}`)
write(`Data: ${new Date().toLocaleString('it-IT')}`)
write(`Report: ${REPORT}`)

section('1. HEADER SICUREZZA')

const headersRaw = curl(`-I "${SITE}"`)
write(headersRaw.trim() || 'Nessun header ricevuto.')

const headers = headersRaw.toLowerCase()

const requiredHeaders = [
  ['strict-transport-security', 'HSTS'],
  ['content-security-policy', 'Content-Security-Policy'],
  ['x-content-type-options', 'X-Content-Type-Options'],
  ['referrer-policy', 'Referrer-Policy'],
  ['permissions-policy', 'Permissions-Policy'],
]

for (const [needle, label] of requiredHeaders) {
  if (headers.includes(needle)) {
    status('PASS', label, 'presente')
  } else {
    status(label === 'Content-Security-Policy' ? 'WARN' : 'WARN', label, 'mancante o non rilevato')
  }
}

if (headers.includes('x-powered-by')) {
  status('WARN', 'X-Powered-By', 'header presente: meglio nasconderlo se possibile')
} else {
  status('PASS', 'X-Powered-By', 'non esposto')
}

section('2. CHECK TRACCE WORDPRESS / VECCHIO STACK')

const wpPaths = [
  '/wp-admin',
  '/wp-login.php',
  '/wp-json',
  '/xmlrpc.php',
  '/wp-content',
  '/wp-includes',
  '/feed/',
  '/comments/feed/',
]

for (const p of wpPaths) {
  const result = curlCode(`${SITE}${p}`)
  const code = result.split(' ')[0]

  if (code === '200') {
    status('WARN', p, result)
  } else {
    status('PASS', p, result)
  }
}

section('3. CHECK ADMIN SENZA LOGIN')

const adminPaths = [
  '/admin',
  '/admin/immobili',
  '/admin/utenti',
  '/admin/logs',
  '/admin/privacy',
  '/admin/contenuti/home',
  '/admin/news',
  '/admin/exports',
]

for (const p of adminPaths) {
  const result = curlCodeNoFollow(`${SITE}${p}`)
  const code = result.split(' ')[0]

  if (code === '200') {
    status('WARN', p, `${result} — verifica che non mostri dati senza login`)
  } else if (['301', '302', '303', '307', '308', '401', '403', '404'].includes(code)) {
    status('PASS', p, result)
  } else {
    status('INFO', p, result)
  }
}

section('4. CHECK API ADMIN')

const apiPaths = [
  '/api/admin/site-content',
  '/api/admin/exports/immobiliare-it',
  '/api/admin/exports/idealista',
  '/api/admin/exports/casa-it',
  '/api/admin/kpi/request-clean-code',
  '/api/admin/kpi/verify-clean-code',
]

for (const p of apiPaths) {
  const result = curlCode(`${SITE}${p}`)
  const code = result.split(' ')[0]

  if (code === '200') {
    status('WARN', p, `${result} — controllare risposta`)
    const body = curl(`"${SITE}${p}"`).trim()
    if (body) {
      write(`    Preview body: ${maskSecret(body).slice(0, 300)}`)
    }
  } else if (['400', '401', '403', '404', '405', '307', '308'].includes(code)) {
    status('PASS', p, result)
  } else {
    status('INFO', p, result)
  }
}

section('5. CHECK JS PUBBLICI PER SEGRETI ESPOSTI')

const homeHtml = curl(`"${SITE}"`)
fs.writeFileSync(path.join(JS_DIR, 'home.html'), homeHtml)

const jsMatches = [...homeHtml.matchAll(/["'](\/_next\/static\/[^"']+?\.js)["']/g)]
const jsFiles = [...new Set(jsMatches.map((m) => m[1]))]

write(`JS trovati in home: ${jsFiles.length}`)

const suspicious = [
  /service_role/i,
  /SUPABASE_SERVICE_ROLE/i,
  /DATABASE_URL/i,
  /private_key/i,
  /smtp/i,
  /GMAIL/i,
  /CLIENT_SECRET/i,
  /secret/i,
]

let exposedFindings = 0

for (const js of jsFiles.slice(0, 80)) {
  const fileName = js.replace(/[\/\\:?*"<>|]/g, '_')
  const content = curl(`"${SITE}${js}"`)
  const outPath = path.join(JS_DIR, fileName)
  fs.writeFileSync(outPath, content)

  for (const pattern of suspicious) {
    if (pattern.test(content)) {
      exposedFindings++
      status('WARN', `Possibile keyword sensibile in JS`, `${js} — pattern ${pattern}`)
    }
  }
}

if (exposedFindings === 0) {
  status('PASS', 'Segreti nei JS pubblici', 'nessuna keyword critica trovata nei bundle scaricati')
} else {
  status('WARN', 'Segreti nei JS pubblici', `${exposedFindings} possibili occorrenze da verificare`)
}

section('6. CHECK FILE SENSIBILI IN PUBLIC LOCALE')

const publicFiles = walk(path.join(process.cwd(), 'public'), ['node_modules', '.next'])
const riskyPublic = publicFiles.filter((file) => {
  const rel = path.relative(process.cwd(), file).toLowerCase()
  return /\.(env|sql|zip|rar|7z|bak|backup|dump|csv|xlsx|docx?)$/.test(rel) ||
    /password|credential|segreti|private|fattura|documento|carta|inps|contratto|backup|dump/.test(rel)
})

if (riskyPublic.length === 0) {
  status('PASS', 'public/', 'nessun file chiaramente sensibile trovato')
} else {
  status('WARN', 'public/', `${riskyPublic.length} file da verificare`)
  riskyPublic.forEach((file) => write(`    ${path.relative(process.cwd(), file)}`))
}

section('7. CHECK SEGRETI NEL CODICE LOCALE, CON VALORI MASCHERATI')

const scanDirs = ['src', 'scripts']
const scanFiles = []

for (const dir of scanDirs) {
  scanFiles.push(...walk(path.join(process.cwd(), dir), ['node_modules', '.next', 'tmp']))
}

// File .env esclusi volutamente dal report per evitare stampa accidentale di segreti.

const secretPatterns = [
  /service_role/i,
  /SUPABASE_SERVICE_ROLE/i,
  /DATABASE_URL/i,
  /GMAIL/i,
  /SMTP/i,
  /private_key/i,
  /CLIENT_SECRET/i,
  /secret/i,
  /token/i,
]

let localFindings = 0

for (const file of scanFiles) {
  let content = ''
  try {
    content = fs.readFileSync(file, 'utf8')
  } catch {
    continue
  }

  const lines = content.split('\n')
  lines.forEach((line, index) => {
    if (secretPatterns.some((pattern) => pattern.test(line))) {
      localFindings++
      write(`⚠️  ${path.relative(process.cwd(), file)}:${index + 1}: ${maskSecret(line.trim())}`)
    }
  })
}

if (localFindings === 0) {
  status('PASS', 'Segreti locali', 'nessuna keyword sospetta trovata')
} else {
  status('WARN', 'Segreti locali', `${localFindings} righe da verificare. Non incollare valori reali in chat.`)
}

section('8. CHECK NPM AUDIT')

try {
  const auditRaw = execSync('npm audit --json', {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  const audit = JSON.parse(auditRaw)
  const meta = audit.metadata?.vulnerabilities

  if (!meta) {
    status('INFO', 'npm audit', 'output non standard')
  } else {
    const total = Object.values(meta).reduce((sum, n) => sum + Number(n || 0), 0)
    if (total === 0) {
      status('PASS', 'npm audit', 'nessuna vulnerabilità segnalata')
    } else {
      status('WARN', 'npm audit', JSON.stringify(meta))
    }
  }
} catch (error) {
  const output = String(error.stdout || error.message || '')
  try {
    const audit = JSON.parse(output)
    const meta = audit.metadata?.vulnerabilities
    status('WARN', 'npm audit', meta ? JSON.stringify(meta) : 'vulnerabilità o errore audit')
  } catch {
    status('INFO', 'npm audit', 'non completato o output non JSON')
  }
}

section('9. PROSSIMI CHECK MANUALI SUPABASE')

write(`SQL da eseguire in Supabase SQL Editor:`)
write(`
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;

select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

select id, name, public
from storage.buckets
order by name;
`)

fs.writeFileSync(REPORT, rows.join('\n'))
write('')
write(`Report salvato in: ${REPORT}`)
