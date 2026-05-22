import fs from 'node:fs/promises'
import path from 'node:path'

const ROOT = process.cwd()

const REFS = [
  'IM0001AA',
  'IM0007AA',
  'IM0009AA',
  'IM0010AA',
  'IM0012AA',
  'IM0013AA',
  'IM0014AA',
  'IM0017AA',
  'IM0025AA',
  'IM0026AA',
  'IM0027AA',
  'IM0030AA',
]

function loadEnvText(text) {
  const out = {}
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const index = line.indexOf('=')
    if (index < 0) continue
    const key = line.slice(0, index).trim()
    const value = line.slice(index + 1).trim().replace(/^['"]|['"]$/g, '')
    out[key] = value
  }
  return out
}

async function loadEnv() {
  const files = ['.env.local', '.env', '.env.development.local', '.env.production.local']
  const env = { ...process.env }

  for (const file of files) {
    try {
      const text = await fs.readFile(path.join(ROOT, file), 'utf8')
      Object.assign(env, loadEnvText(text))
    } catch {}
  }

  return env
}

async function supabaseConfig() {
  const env = await loadEnv()

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL
  const supabaseKey =
    env.SUPABASE_SERVICE_ROLE_KEY ||
    env.SUPABASE_SERVICE_KEY ||
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Variabili Supabase mancanti.')
  }

  return {
    baseUrl: supabaseUrl.replace(/\/$/, ''),
    key: supabaseKey,
  }
}

async function supabaseFetch(url, options = {}) {
  const cfg = await supabaseConfig()

  const response = await fetch(`${cfg.baseUrl}${url}`, {
    ...options,
    headers: {
      apikey: cfg.key,
      authorization: `Bearer ${cfg.key}`,
      accept: 'application/json',
      'content-type': 'application/json',
      ...(options.headers || {}),
    },
  })

  const text = await response.text()

  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }

  if (!response.ok) {
    throw new Error(`Supabase ${response.status}: ${typeof data === 'string' ? data : JSON.stringify(data).slice(0, 900)}`)
  }

  return data
}

async function main() {
  console.log('=== SYNC MAIN_IMAGE / GALLERY DA PROPERTY_MEDIA ===')

  const refsFilter = REFS.map((ref) => `"${ref}"`).join(',')
  const selectProperties = encodeURIComponent('id,title,reference_code')
  const properties = await supabaseFetch(`/rest/v1/properties?select=${selectProperties}&reference_code=in.(${refsFilter})`)

  for (const property of properties) {
    const selectMedia = encodeURIComponent('file_url,sort_order,is_cover')
    const media = await supabaseFetch(
      `/rest/v1/property_media?select=${selectMedia}&property_id=eq.${property.id}&order=sort_order.asc`
    )

    const urls = media
      .map((item) => item.file_url)
      .filter(Boolean)

    if (!urls.length) {
      console.log(`SKIP ${property.reference_code} | nessun media`)
      continue
    }

    const cover =
      media.find((item) => item.is_cover && item.file_url)?.file_url ||
      urls[0]

    await supabaseFetch(`/rest/v1/properties?id=eq.${property.id}`, {
      method: 'PATCH',
      headers: {
        prefer: 'return=minimal',
      },
      body: JSON.stringify({
        main_image: cover,
        gallery: urls,
        photo_coming_soon: false,
        no_photo_available: false,
      }),
    })

    console.log(`OK ${property.reference_code} | media: ${urls.length} | ${property.title}`)
  }

  console.log('')
  console.log('Sync completata.')
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
