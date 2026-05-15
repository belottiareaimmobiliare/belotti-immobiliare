import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { createClient } from '@supabase/supabase-js'

const BUCKET_NAME = 'property-media'
const APPLY = process.argv.includes('--confirm=DELETE_OLD_SITE_IMPORT')

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return

  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const clean = line.trim()
    if (!clean || clean.startsWith('#')) continue

    const match = clean.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
    if (!match) continue

    let value = match[2].trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    process.env[match[1]] ||= value
  }
}

loadEnvFile(path.join(process.cwd(), '.env.local'))

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Variabili Supabase mancanti in .env.local')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

function chunk(items, size = 100) {
  const chunks = []

  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }

  return chunks
}

function parseStoragePathFromPublicUrl(fileUrl) {
  if (!fileUrl) return null

  try {
    const url = new URL(fileUrl)
    const marker = `/storage/v1/object/public/${BUCKET_NAME}/`
    const index = url.pathname.indexOf(marker)

    if (index === -1) return null

    return decodeURIComponent(url.pathname.slice(index + marker.length))
  } catch {
    return null
  }
}

async function listOldSiteStorageFilesForProperty(supabase, propertyId) {
  const dir = `properties/${propertyId}/old-site-import`

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .list(dir, {
      limit: 1000,
      sortBy: {
        column: 'name',
        order: 'asc',
      },
    })

  if (error) {
    console.warn(`WARN storage list ${dir}: ${error.message}`)
    return []
  }

  return (data || [])
    .filter((item) => item?.name)
    .map((item) => `${dir}/${item.name}`)
}

async function safeDeleteAiOsFilesByMediaIds(supabase, mediaIds) {
  if (mediaIds.length === 0) return 0

  let deleted = 0

  for (const ids of chunk(mediaIds, 100)) {
    const { error } = await supabase
      .from('ai_os_files')
      .delete()
      .in('property_media_id', ids)

    if (error) {
      console.warn(`WARN delete ai_os_files by property_media_id: ${error.message}`)
      continue
    }

    deleted += ids.length
  }

  return deleted
}

async function safeDeleteAiOsFilesByPropertyIds(supabase, propertyIds) {
  if (propertyIds.length === 0) return 0

  let deleted = 0

  for (const ids of chunk(propertyIds, 100)) {
    const { error } = await supabase
      .from('ai_os_files')
      .delete()
      .in('property_id', ids)

    if (error) {
      console.warn(`WARN delete ai_os_files by property_id: ${error.message}`)
      continue
    }

    deleted += ids.length
  }

  return deleted
}

async function removeStoragePaths(supabase, paths) {
  const uniquePaths = [...new Set(paths.filter(Boolean))]

  if (uniquePaths.length === 0) return 0

  let removed = 0

  for (const pathsChunk of chunk(uniquePaths, 100)) {
    const { error } = await supabase.storage.from(BUCKET_NAME).remove(pathsChunk)

    if (error) {
      console.warn(`WARN storage remove: ${error.message}`)
      continue
    }

    removed += pathsChunk.length
  }

  return removed
}

async function deleteRowsByIds(supabase, table, ids) {
  if (ids.length === 0) return 0

  let deleted = 0

  for (const idsChunk of chunk(ids, 100)) {
    const { error } = await supabase.from(table).delete().in('id', idsChunk)

    if (error) {
      throw new Error(`Errore delete ${table}: ${error.message}`)
    }

    deleted += idsChunk.length
  }

  return deleted
}

async function main() {
  const supabase = getSupabaseClient()

  const { data: properties, error: propertiesError } = await supabase
    .from('properties')
    .select('id,title,old_source_url')
    .eq('source_tag', 'old_site_import')

  if (propertiesError) throw propertiesError

  const propertyIds = (properties || []).map((item) => item.id)

  let media = []

  if (propertyIds.length > 0) {
    for (const ids of chunk(propertyIds, 100)) {
      const { data, error } = await supabase
        .from('property_media')
        .select('id,property_id,file_url')
        .in('property_id', ids)

      if (error) throw error

      media.push(...(data || []))
    }
  }

  const mediaIds = media.map((item) => item.id)

  const linkedStoragePaths = media
    .map((item) => parseStoragePathFromPublicUrl(item.file_url))
    .filter(Boolean)

  const listedStoragePaths = []

  for (const propertyId of propertyIds) {
    const paths = await listOldSiteStorageFilesForProperty(supabase, propertyId)
    listedStoragePaths.push(...paths)
  }

  const allStoragePaths = [...new Set([...linkedStoragePaths, ...listedStoragePaths])]

  console.log('')
  console.log('=== CLEANUP OLD SITE IMPORT ===')
  console.log({
    apply: APPLY,
    propertiesToDelete: propertyIds.length,
    mediaRowsToDelete: mediaIds.length,
    storageObjectsToRemove: allStoragePaths.length,
  })

  console.log('')
  console.log('Prime 20 proprietà che verrebbero rimosse:')
  for (const property of (properties || []).slice(0, 20)) {
    console.log(`- ${property.title} | ${property.old_source_url}`)
  }

  if (!APPLY) {
    console.log('')
    console.log('DRY RUN: nessuna cancellazione effettuata.')
    console.log('Per cancellare davvero: npm run import:old-site:cleanup')
    console.log('')
    return
  }

  console.log('')
  console.log('Cancello ai_os_files collegati...')
  await safeDeleteAiOsFilesByMediaIds(supabase, mediaIds)
  await safeDeleteAiOsFilesByPropertyIds(supabase, propertyIds)

  console.log('Cancello oggetti storage old-site-import...')
  const removedStorage = await removeStoragePaths(supabase, allStoragePaths)

  console.log('Cancello property_media...')
  const deletedMedia = await deleteRowsByIds(supabase, 'property_media', mediaIds)

  console.log('Cancello properties old_site_import...')
  const deletedProperties = await deleteRowsByIds(supabase, 'properties', propertyIds)

  console.log('')
  console.log('=== CLEANUP COMPLETATO ===')
  console.log({
    deletedProperties,
    deletedMedia,
    removedStorage,
  })
  console.log('')
}

main().catch((error) => {
  console.error('')
  console.error('CLEANUP FALLITO:')
  console.error(error)
  process.exit(1)
})
