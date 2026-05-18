import { NextResponse } from 'next/server'
import { requireAdminProfile } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { jsonError } from '@/lib/ai-os'

export const dynamic = 'force-dynamic'

function canManageDriveSharing(role: string) {
  return role === 'administrator' || role === 'owner' || role === 'secretary'
}

function cleanString(value: unknown) {
  return String(value ?? '').trim()
}

function buildAiOsShareUrl(request: Request, token: string) {
  const origin = new URL(request.url).origin
  return `${origin}/ai-os/share/${token}`
}

function buildDriveFolderUrl(folderId: string) {
  return `https://drive.google.com/drive/folders/${encodeURIComponent(folderId)}`
}

export async function GET(request: Request) {
  try {
    const profile = await requireAdminProfile()

    if (!canManageDriveSharing(profile.role)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const propertyId = cleanString(searchParams.get('propertyId'))
    const limit = Math.min(Math.max(Number(searchParams.get('limit') || 50), 1), 100)

    const supabase = createServiceClient()

    let query = supabase
      .from('ai_os_share_links')
      .select(`
        id,
        token,
        property_id,
        drive_folder_id,
        target_folder_name,
        recipient_name,
        recipient_email,
        recipient_role,
        can_upload,
        direct_drive_folder,
        folder_key,
        drive_permission_role,
        is_active,
        expires_at,
        created_at,
        updated_at,
        revoked_at
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (propertyId) {
      query = query.eq('property_id', propertyId)
    }

    const { data: links, error } = await query

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Errore caricamento storico condivisioni' },
        { status: 500 },
      )
    }

    const propertyIds = Array.from(
      new Set((links ?? []).map((item) => cleanString(item.property_id)).filter(Boolean)),
    )

    const propertiesById = new Map<string, any>()

    if (propertyIds.length > 0) {
      const { data: properties } = await supabase
        .from('properties')
        .select('id, title, reference_code, contract_type, comune, address')
        .in('id', propertyIds)

      for (const property of properties ?? []) {
        propertiesById.set(property.id, property)
      }
    }

    const shares = (links ?? []).map((item) => {
      const folderId = cleanString(item.drive_folder_id)
      const property = propertiesById.get(item.property_id)

      return {
        id: item.id,
        propertyId: item.property_id,
        propertyTitle: property?.title ?? null,
        propertyRef: property?.reference_code ?? null,
        propertyContractType: property?.contract_type ?? null,
        propertyComune: property?.comune ?? null,
        folderKey: item.folder_key ?? null,
        folderName: item.target_folder_name ?? 'Cartella Drive',
        folderId,
        folderUrl: folderId ? buildDriveFolderUrl(folderId) : '',
        aiOsUrl: item.token ? buildAiOsShareUrl(request, item.token) : '',
        recipientEmail: item.recipient_email || item.recipient_name || '',
        recipientRole: item.recipient_role || '',
        permissionRole: item.drive_permission_role || (item.can_upload ? 'writer' : 'reader'),
        canUpload: item.can_upload === true,
        isActive: item.is_active === true && !item.revoked_at,
        expiresAt: item.expires_at,
        createdAt: item.created_at,
        revokedAt: item.revoked_at,
      }
    })

    return NextResponse.json({
      ok: true,
      shares,
    })
  } catch (error) {
    return NextResponse.json(
      { error: jsonError(error, 'Errore storico condivisioni Drive') },
      { status: 500 },
    )
  }
}
