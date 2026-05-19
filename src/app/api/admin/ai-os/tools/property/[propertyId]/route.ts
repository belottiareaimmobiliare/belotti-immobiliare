import { NextResponse } from 'next/server'
import { requireAdminProfile } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { jsonError } from '@/lib/ai-os'

export const dynamic = 'force-dynamic'

function cleanString(value: unknown) {
  return String(value ?? '').trim()
}

async function canReadProperty(
  supabase: ReturnType<typeof createServiceClient>,
  profile: Awaited<ReturnType<typeof requireAdminProfile>>,
  property: Record<string, any>,
) {
  if (profile.role === 'administrator' || profile.role === 'owner' || profile.role === 'secretary') {
    return true
  }

  if (
    cleanString(property.created_by) === profile.id ||
    cleanString(property.updated_by) === profile.id ||
    cleanString(property.assigned_agent_id) === profile.id
  ) {
    return true
  }

  const emails = [
    cleanString(profile.login_email).toLowerCase(),
    cleanString(profile.authorized_google_email).toLowerCase(),
  ].filter(Boolean)

  let workspaceUser: any = null

  const { data: byAuthUser } = await supabase
    .from('ai_os_workspace_users')
    .select('id, can_see_all_properties')
    .eq('auth_user_id', profile.id)
    .maybeSingle()

  if (byAuthUser) {
    workspaceUser = byAuthUser
  }

  if (!workspaceUser) {
    for (const email of emails) {
      const { data: byEmail } = await supabase
        .from('ai_os_workspace_users')
        .select('id, can_see_all_properties')
        .eq('email', email)
        .maybeSingle()

      if (byEmail) {
        workspaceUser = byEmail
        break
      }
    }
  }

  if (workspaceUser?.can_see_all_properties) {
    return true
  }

  if (workspaceUser?.id) {
    const { data: permission } = await supabase
      .from('ai_os_property_permissions')
      .select('id, can_view, can_upload, can_manage')
      .eq('workspace_user_id', workspaceUser.id)
      .eq('property_id', property.id)
      .maybeSingle()

    if (permission?.can_view || permission?.can_upload || permission?.can_manage) {
      return true
    }
  }

  return false
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ propertyId: string }> },
) {
  try {
    const profile = await requireAdminProfile()
    const { propertyId } = await context.params

    if (!propertyId) {
      return NextResponse.json({ error: 'propertyId mancante' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select(`
        id,
        title,
        slug,
        reference_code,
        status,
        description,
        price,
        previous_price,
        contract_type,
        property_type,
        condition,
        availability,
        comune,
        province,
        frazione,
        city,
        area,
        address,
        rooms,
        bathrooms,
        surface,
        floor,
        total_floors,
        year_built,
        energy_class,
        energy_epgl,
        heating_type,
        heating_source,
        condo_fees,
        condo_fees_amount,
        condo_fees_period,
        has_garage,
        has_parking,
        has_garden,
        has_elevator,
        is_auction,
        furnished_status,
        deposit_amount,
        advance_amount,
        advance_deposit_amount,
        created_by,
        updated_by,
        assigned_agent_id,
        created_at,
        updated_at
      `)
      .eq('id', propertyId)
      .maybeSingle()

    if (propertyError) {
      return NextResponse.json(
        { error: propertyError.message || 'Errore caricamento immobile' },
        { status: 500 },
      )
    }

    if (!property) {
      return NextResponse.json({ error: 'Immobile non trovato' }, { status: 404 })
    }

    const allowed = await canReadProperty(supabase, profile, property)

    if (!allowed) {
      return NextResponse.json({ error: 'Non autorizzato su questo immobile' }, { status: 403 })
    }

    const [
      ownersResult,
      ownerDocumentsResult,
      checklistResult,
      driveFolderResult,
      subfoldersResult,
      mediaResult,
    ] = await Promise.all([
      supabase
        .from('property_owners')
        .select('id, owner_type, role, full_name, email, phone, tax_code, notes, created_at, updated_at')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: true }),
      supabase
        .from('property_owner_documents')
        .select('id, owner_id, document_key, label, status, notes, updated_at')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: true }),
      supabase
        .from('property_checklist_items')
        .select('id, item_key, label, status, notes, updated_at')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: true }),
      supabase
        .from('property_drive_folders')
        .select('property_id, folder_name, drive_folder_id, drive_folder_url, sync_status')
        .eq('property_id', propertyId)
        .maybeSingle(),
      supabase
        .from('property_drive_subfolders')
        .select('folder_key, folder_name, drive_folder_id, drive_folder_url')
        .eq('property_id', propertyId)
        .order('folder_name', { ascending: true }),
      supabase
        .from('property_media')
        .select('id, media_type, file_url, label, sort_order, is_cover, created_at')
        .eq('property_id', propertyId)
        .order('sort_order', { ascending: true }),
    ])

    return NextResponse.json({
      ok: true,
      property,
      owners: ownersResult.data ?? [],
      ownerDocuments: ownerDocumentsResult.data ?? [],
      checklist: checklistResult.data ?? [],
      driveFolder: driveFolderResult.data ?? null,
      driveSubfolders: subfoldersResult.data ?? [],
      propertyMedia: mediaResult.data ?? [],
    })
  } catch (error) {
    return NextResponse.json(
      { error: jsonError(error, 'Errore caricamento dati strumento immobile') },
      { status: 500 },
    )
  }
}
