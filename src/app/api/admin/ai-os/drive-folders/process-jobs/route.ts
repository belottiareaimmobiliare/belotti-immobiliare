import { NextResponse } from 'next/server'
import { requireAdminProfile } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'

const BATCH_SIZE = 20

type DriveJob = {
  id: string
  property_id: string | null
  action: string | null
  status: string | null
  desired_folder_name: string | null
  last_error: string | null
}

type PropertyRow = {
  id: string
  title: string | null
  reference_code: string | null
  status: string | null
  source_tag: string | null
}

function cleanFolderName(value: string) {
  return value
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 140)
}

function buildFolderName(property: PropertyRow, desiredName?: string | null) {
  const desired = cleanFolderName(String(desiredName || ''))

  if (desired) {
    return desired
  }

  const code = cleanFolderName(String(property.reference_code || ''))
  const title = cleanFolderName(String(property.title || 'Immobile senza titolo'))

  return cleanFolderName(code ? `${code} - ${title}` : title)
}

async function markJob(
  supabase: ReturnType<typeof createServiceClient>,
  jobId: string,
  status: 'processing' | 'done' | 'failed',
  lastError: string | null = null
) {
  const payload: Record<string, unknown> = {
    status,
    last_error: lastError,
    updated_at: new Date().toISOString(),
  }

  if (status === 'done' || status === 'failed') {
    payload.processed_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('property_drive_folder_jobs')
    .update(payload)
    .eq('id', jobId)

  if (error) {
    console.error('Errore aggiornamento job Drive:', error)
  }
}

async function upsertPropertyFolder(
  supabase: ReturnType<typeof createServiceClient>,
  job: DriveJob
) {
  if (!job.property_id) {
    throw new Error('Job senza property_id')
  }

  const { data: property, error: propertyError } = await supabase
    .from('properties')
    .select('id,title,reference_code,status,source_tag')
    .eq('id', job.property_id)
    .maybeSingle()

  if (propertyError) {
    throw propertyError
  }

  if (!property) {
    throw new Error(`Immobile non trovato: ${job.property_id}`)
  }

  const propertyRow = property as PropertyRow
  const folderName = buildFolderName(propertyRow, job.desired_folder_name)
  const now = new Date().toISOString()

  const { data: existing, error: existingError } = await supabase
    .from('property_drive_folders')
    .select('*')
    .eq('property_id', propertyRow.id)
    .maybeSingle()

  if (existingError) {
    throw existingError
  }

  const driveFolderId =
    existing?.drive_folder_id ||
    existing?.folder_id ||
    `aios-property-${propertyRow.id}`

  const payload = {
    property_id: propertyRow.id,
    folder_name: folderName,
    drive_folder_id: driveFolderId,
    sync_status: 'synced',
    last_error: null,
    updated_at: now,
  }

  if (existing?.id) {
    const { error } = await supabase
      .from('property_drive_folders')
      .update(payload)
      .eq('id', existing.id)

    if (error) {
      throw error
    }

    return {
      action: 'updated',
      propertyId: propertyRow.id,
      folderName,
    }
  }

  const { error } = await supabase
    .from('property_drive_folders')
    .insert([
      {
        ...payload,
        created_at: now,
      },
    ])

  if (error) {
    throw error
  }

  return {
    action: 'created',
    propertyId: propertyRow.id,
    folderName,
  }
}

async function deletePropertyFolder(
  supabase: ReturnType<typeof createServiceClient>,
  job: DriveJob
) {
  if (!job.property_id) {
    throw new Error('Job delete senza property_id')
  }

  await supabase
    .from('ai_os_files')
    .update({
      is_deleted: true,
      updated_at: new Date().toISOString(),
    })
    .eq('property_id', job.property_id)

  const { error } = await supabase
    .from('property_drive_folders')
    .delete()
    .eq('property_id', job.property_id)

  if (error) {
    throw error
  }

  return {
    action: 'deleted',
    propertyId: job.property_id,
  }
}

async function processJobs() {
  const supabase = createServiceClient()

  const { data: jobs, error } = await supabase
    .from('property_drive_folder_jobs')
    .select('*')
    .in('status', ['pending', 'processing'])
    .order('created_at', { ascending: true })
    .limit(BATCH_SIZE)

  if (error) {
    throw error
  }

  const results: unknown[] = []

  for (const job of (jobs || []) as DriveJob[]) {
    await markJob(supabase, job.id, 'processing', null)

    try {
      const action = String(job.action || '').trim()

      let result: unknown

      if (action === 'delete') {
        result = await deletePropertyFolder(supabase, job)
      } else {
        result = await upsertPropertyFolder(supabase, job)
      }

      await markJob(supabase, job.id, 'done', null)

      results.push({
        jobId: job.id,
        status: 'done',
        result,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore sconosciuto'

      await markJob(supabase, job.id, 'failed', message)

      results.push({
        jobId: job.id,
        status: 'failed',
        error: message,
      })
    }
  }

  return {
    ok: true,
    processed: results.length,
    results,
  }
}

export async function GET() {
  try {
    await requireAdminProfile()

    const result = await processJobs()

    return NextResponse.json(result)
  } catch (error) {
    console.error('Errore process jobs Drive folders:', error)

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Errore interno process jobs Drive folders',
      },
      { status: 500 }
    )
  }
}

export async function POST() {
  return GET()
}
