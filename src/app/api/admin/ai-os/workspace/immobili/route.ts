import { NextResponse } from 'next/server'
import { requireAdminProfile } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { jsonError } from '@/lib/ai-os'
import {
  getAiOsWorkspaceAccess,
  permissionAllowsAction,
} from '@/lib/ai-os/workspace-access'

export const dynamic = 'force-dynamic'

function cleanString(value: unknown) {
  return String(value ?? '').trim()
}

function buildAddress(property: Record<string, unknown>) {
  return [
    cleanString(property.address),
    cleanString(property.frazione),
    cleanString(property.comune),
    cleanString(property.province),
  ].filter(Boolean).join(' · ')
}

function folderName(property: Record<string, unknown>) {
  const title = cleanString(property.title)
  const reference = cleanString(property.reference_code)

  if (title) return title
  if (reference) return `Immobile ${reference}`

  return `Immobile ${cleanString(property.id).slice(0, 8)}`
}

function propertyReference(property: Record<string, unknown>) {
  return cleanString(property.reference_code) || cleanString(property.id).slice(0, 8)
}

export async function GET() {
  try {
    const profile = await requireAdminProfile()
    const supabase = createServiceClient()
    const workspaceAccess = await getAiOsWorkspaceAccess(supabase, profile)

    if (!workspaceAccess.canSeeAllProperties && !workspaceAccess.isActiveWorkspaceUser) {
      return NextResponse.json({
        ok: true,
        access: {
          role: workspaceAccess.workspaceRole,
          profileRole: workspaceAccess.profileRole,
          canSeeAllProperties: false,
          isFullDesktop: false,
          propertyCount: 0,
        },
        folders: [],
      })
    }

    let propertiesQuery = supabase
      .from('properties')
      .select('id, title, reference_code, address, frazione, comune, province, property_type, contract_type, status, created_at, updated_at')
      .order('updated_at', { ascending: false })
      .limit(1000)

    if (!workspaceAccess.canSeeAllProperties) {
      if (workspaceAccess.propertyIds.length === 0) {
        return NextResponse.json({
          ok: true,
          access: {
            role: workspaceAccess.workspaceRole,
            profileRole: workspaceAccess.profileRole,
            canSeeAllProperties: false,
            isFullDesktop: false,
            propertyCount: 0,
          },
          folders: [],
        })
      }

      propertiesQuery = propertiesQuery.in('id', workspaceAccess.propertyIds)
    }

    const { data: properties, error: propertiesError } = await propertiesQuery

    if (propertiesError) {
      return NextResponse.json(
        { error: propertiesError.message || 'Errore caricamento immobili workspace' },
        { status: 500 },
      )
    }

    const propertyIds = (properties ?? [])
      .map((property) => cleanString(property.id))
      .filter(Boolean)

    const driveFoldersByProperty = new Map<string, Record<string, unknown>>()
    const mediaCountByProperty = new Map<string, number>()

    if (propertyIds.length > 0) {
      const { data: driveFolders, error: driveFoldersError } = await supabase
        .from('property_drive_folders')
        .select('*')
        .in('property_id', propertyIds)

      if (driveFoldersError) {
        console.error('AI-OS workspace drive folders error:', driveFoldersError)
      }

      for (const driveFolder of driveFolders ?? []) {
        const propertyId = cleanString(driveFolder.property_id)

        if (propertyId) {
          driveFoldersByProperty.set(propertyId, driveFolder as Record<string, unknown>)
        }
      }

      const { data: mediaRows, error: mediaError } = await supabase
        .from('property_media')
        .select('property_id')
        .in('property_id', propertyIds)

      if (mediaError) {
        console.error('AI-OS workspace media count error:', mediaError)
      }

      for (const mediaRow of mediaRows ?? []) {
        const propertyId = cleanString(mediaRow.property_id)

        if (propertyId) {
          mediaCountByProperty.set(propertyId, (mediaCountByProperty.get(propertyId) ?? 0) + 1)
        }
      }
    }

    const folders = (properties ?? []).map((property) => {
      const propertyRecord = property as Record<string, unknown>
      const propertyId = cleanString(propertyRecord.id)
      const driveFolder = driveFoldersByProperty.get(propertyId) ?? null
      const driveFolderId = cleanString(driveFolder?.drive_folder_id)
      const syncStatus = cleanString(driveFolder?.sync_status)
      const permission = workspaceAccess.permissionsByProperty.get(propertyId) ?? null
      const hasDriveReady = Boolean(driveFolderId) && !driveFolderId.startsWith('aios-property-')

      return {
        id: propertyId,
        name: folderName(propertyRecord),
        propertyRef: propertyReference(propertyRecord),
        address: buildAddress(propertyRecord),
        owner: '',
        fileCount: mediaCountByProperty.get(propertyId) ?? 0,
        visualState: hasDriveReady ? 'green' : 'yellow',
        visualReason: hasDriveReady
          ? 'Drive Workspace collegato.'
          : syncStatus === 'pending_creation'
            ? 'Cartella Drive reale in attesa di creazione.'
            : 'Cartella Drive non ancora collegata.',
        files: [],
        driveFolder,
        workspacePermission: {
          canView: workspaceAccess.canSeeAllProperties || permissionAllowsAction(workspaceAccess, propertyId, 'view'),
          canUpload: workspaceAccess.canSeeAllProperties || permissionAllowsAction(workspaceAccess, propertyId, 'upload'),
          canManage: workspaceAccess.canSeeAllProperties || permissionAllowsAction(workspaceAccess, propertyId, 'manage'),
          canSyncPublicGallery: workspaceAccess.canSeeAllProperties || permissionAllowsAction(workspaceAccess, propertyId, 'sync'),
          canDelete: workspaceAccess.canSeeAllProperties || permissionAllowsAction(workspaceAccess, propertyId, 'delete'),
          accessLevel: cleanString(permission?.access_level) || (workspaceAccess.canSeeAllProperties ? 'full' : 'view'),
        },
      }
    })

    return NextResponse.json({
      ok: true,
      access: {
        role: workspaceAccess.workspaceRole,
        profileRole: workspaceAccess.profileRole,
        canSeeAllProperties: workspaceAccess.canSeeAllProperties,
        isFullDesktop: workspaceAccess.isFullDesktop,
        propertyCount: folders.length,
      },
      folders,
    })
  } catch (error) {
    return NextResponse.json(
      { error: jsonError(error, 'Errore caricamento workspace immobili') },
      { status: 500 },
    )
  }
}
