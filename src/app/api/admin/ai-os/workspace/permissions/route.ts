import { NextResponse } from 'next/server'
import { requireAdminProfile } from '@/lib/admin-auth'
import { canUseAIOS, jsonError } from '@/lib/ai-os'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

const ALLOWED_ACCESS_LEVELS = new Set(['view', 'upload', 'manage', 'full'])

function cleanString(value: unknown) {
  return String(value ?? '').trim()
}

function cleanAccessLevel(value: unknown) {
  const accessLevel = cleanString(value).toLowerCase()
  return ALLOWED_ACCESS_LEVELS.has(accessLevel) ? accessLevel : 'view'
}

function bool(value: unknown, fallback = false) {
  if (typeof value === 'boolean') return value
  return fallback
}

async function requireWorkspaceManager() {
  const profile = await requireAdminProfile()

  if (!canUseAIOS(profile)) {
    throw new Error('Non autorizzato')
  }

  return profile
}

function defaultsFromAccessLevel(accessLevel: string) {
  if (accessLevel === 'full') {
    return {
      can_view: true,
      can_upload: true,
      can_manage: true,
      can_sync_public_gallery: true,
      can_delete: true,
    }
  }

  if (accessLevel === 'manage') {
    return {
      can_view: true,
      can_upload: true,
      can_manage: true,
      can_sync_public_gallery: true,
      can_delete: false,
    }
  }

  if (accessLevel === 'upload') {
    return {
      can_view: true,
      can_upload: true,
      can_manage: false,
      can_sync_public_gallery: false,
      can_delete: false,
    }
  }

  return {
    can_view: true,
    can_upload: false,
    can_manage: false,
    can_sync_public_gallery: false,
    can_delete: false,
  }
}

export async function POST(request: Request) {
  try {
    await requireWorkspaceManager()

    const body = await request.json().catch(() => null)

    const workspaceUserId = cleanString(body?.workspaceUserId)
    const propertyId = cleanString(body?.propertyId)
    const accessLevel = cleanAccessLevel(body?.accessLevel)
    const defaults = defaultsFromAccessLevel(accessLevel)

    if (!workspaceUserId || !propertyId) {
      return NextResponse.json(
        { error: 'workspaceUserId e propertyId sono obbligatori.' },
        { status: 400 },
      )
    }

    const supabase = createServiceClient()

    const row = {
      workspace_user_id: workspaceUserId,
      property_id: propertyId,
      access_level: accessLevel,
      can_view: bool(body?.canView, defaults.can_view),
      can_upload: bool(body?.canUpload, defaults.can_upload),
      can_manage: bool(body?.canManage, defaults.can_manage),
      can_sync_public_gallery: bool(body?.canSyncPublicGallery, defaults.can_sync_public_gallery),
      can_delete: bool(body?.canDelete, defaults.can_delete),
      notes: cleanString(body?.notes) || null,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('ai_os_property_permissions')
      .upsert(row, {
        onConflict: 'workspace_user_id,property_id',
      })
      .select('*')
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Errore salvataggio permesso workspace' },
        { status: 500 },
      )
    }

    return NextResponse.json({ ok: true, permission: data })
  } catch (error) {
    return NextResponse.json(
      { error: jsonError(error, 'Errore salvataggio permesso workspace') },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request) {
  try {
    await requireWorkspaceManager()

    const body = await request.json().catch(() => null)

    const workspaceUserId = cleanString(body?.workspaceUserId)
    const propertyId = cleanString(body?.propertyId)

    if (!workspaceUserId || !propertyId) {
      return NextResponse.json(
        { error: 'workspaceUserId e propertyId sono obbligatori.' },
        { status: 400 },
      )
    }

    const supabase = createServiceClient()

    const { error } = await supabase
      .from('ai_os_property_permissions')
      .delete()
      .eq('workspace_user_id', workspaceUserId)
      .eq('property_id', propertyId)

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Errore rimozione permesso workspace' },
        { status: 500 },
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: jsonError(error, 'Errore rimozione permesso workspace') },
      { status: 500 },
    )
  }
}
