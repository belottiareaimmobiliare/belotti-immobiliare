import { NextResponse } from 'next/server'
import { requireAdminProfile } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { canUseAIOS, jsonError } from '@/lib/ai-os'

type AIOSFolderType = 'root' | 'images' | 'docs'

const allowedFolderTypes: AIOSFolderType[] = ['root', 'images', 'docs']

function cleanFolderName(value: unknown) {
  const cleaned = String(value ?? '')
    .replace(/[\\/:*?"<>|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120)

  return cleaned.length > 0 ? cleaned : null
}

function normalizeFolderType(value: unknown): AIOSFolderType {
  const raw = String(value ?? 'root').trim()

  return allowedFolderTypes.includes(raw as AIOSFolderType)
    ? (raw as AIOSFolderType)
    : 'root'
}

function cleanUuidOrNull(value: unknown) {
  const raw = String(value ?? '').trim()

  return raw.length > 0 ? raw : null
}

export async function GET(request: Request) {
  try {
    const profile = await requireAdminProfile()

    if (!canUseAIOS(profile)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')?.trim()
    const parentFolderType = normalizeFolderType(searchParams.get('parentFolderType'))
    const parentCustomFolderId = cleanUuidOrNull(searchParams.get('parentCustomFolderId'))

    if (!propertyId) {
      return NextResponse.json({ error: 'propertyId mancante' }, { status: 400 })
    }

    const supabase = createServiceClient()

    let query = supabase
      .from('ai_os_custom_folders')
      .select('*')
      .eq('property_id', propertyId)
      .eq('parent_folder_type', parentFolderType)
      .eq('is_deleted', false)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })

    if (parentCustomFolderId) {
      query = query.eq('parent_custom_folder_id', parentCustomFolderId)
    } else {
      query = query.is('parent_custom_folder_id', null)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Errore caricamento cartelle custom' },
        { status: 500 },
      )
    }

    return NextResponse.json({ folders: data ?? [] })
  } catch (error) {
    return NextResponse.json(
      { error: jsonError(error, 'Errore caricamento cartelle custom AI-OS') },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const profile = await requireAdminProfile()

    if (!canUseAIOS(profile)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    const body = await request.json().catch(() => null)

    const propertyId = String(body?.propertyId ?? '').trim()
    const parentFolderType = normalizeFolderType(body?.parentFolderType)
    const parentCustomFolderId = cleanUuidOrNull(body?.parentCustomFolderId)
    const name = cleanFolderName(body?.name)

    if (!propertyId) {
      return NextResponse.json({ error: 'propertyId mancante' }, { status: 400 })
    }

    if (!name) {
      return NextResponse.json({ error: 'Nome cartella mancante' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('ai_os_custom_folders')
      .insert({
        property_id: propertyId,
        parent_folder_type: parentFolderType,
        parent_custom_folder_id: parentCustomFolderId,
        name,
      })
      .select('*')
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Errore creazione cartella custom' },
        { status: 500 },
      )
    }

    return NextResponse.json({ folder: data })
  } catch (error) {
    return NextResponse.json(
      { error: jsonError(error, 'Errore creazione cartella custom AI-OS') },
      { status: 500 },
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const profile = await requireAdminProfile()

    if (!canUseAIOS(profile)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    const body = await request.json().catch(() => null)

    const folderId = String(body?.folderId ?? '').trim()
    const name = cleanFolderName(body?.name)

    if (!folderId) {
      return NextResponse.json({ error: 'folderId mancante' }, { status: 400 })
    }

    if (!name) {
      return NextResponse.json({ error: 'Nome cartella mancante' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('ai_os_custom_folders')
      .update({
        name,
        updated_at: new Date().toISOString(),
      })
      .eq('id', folderId)
      .eq('is_deleted', false)
      .select('*')
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Errore rinomina cartella custom' },
        { status: 500 },
      )
    }

    return NextResponse.json({ folder: data })
  } catch (error) {
    return NextResponse.json(
      { error: jsonError(error, 'Errore rinomina cartella custom AI-OS') },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const profile = await requireAdminProfile()

    if (!canUseAIOS(profile)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    const body = await request.json().catch(() => null)
    const folderId = String(body?.folderId ?? '').trim()

    if (!folderId) {
      return NextResponse.json({ error: 'folderId mancante' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { count: filesCount, error: filesError } = await supabase
      .from('ai_os_files')
      .select('id', { count: 'exact', head: true })
      .eq('custom_folder_id', folderId)
      .eq('is_deleted', false)

    if (filesError) {
      return NextResponse.json(
        { error: filesError.message || 'Errore controllo file nella cartella' },
        { status: 500 },
      )
    }

    const { count: childFoldersCount, error: foldersError } = await supabase
      .from('ai_os_custom_folders')
      .select('id', { count: 'exact', head: true })
      .eq('parent_custom_folder_id', folderId)
      .eq('is_deleted', false)

    if (foldersError) {
      return NextResponse.json(
        { error: foldersError.message || 'Errore controllo sottocartelle' },
        { status: 500 },
      )
    }

    if ((filesCount ?? 0) > 0 || (childFoldersCount ?? 0) > 0) {
      return NextResponse.json(
        { error: 'La cartella non è vuota. Sposta o elimina prima file e sottocartelle.' },
        { status: 409 },
      )
    }

    const { data, error } = await supabase
      .from('ai_os_custom_folders')
      .update({
        is_deleted: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', folderId)
      .eq('is_deleted', false)
      .select('*')
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Errore eliminazione cartella custom' },
        { status: 500 },
      )
    }

    return NextResponse.json({ folder: data })
  } catch (error) {
    return NextResponse.json(
      { error: jsonError(error, 'Errore eliminazione cartella custom AI-OS') },
      { status: 500 },
    )
  }
}
