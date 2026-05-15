import { createServiceClient } from '@/lib/supabase/service'

type ServiceClient = ReturnType<typeof createServiceClient>

type WorkspacePermissionAction = 'view' | 'upload' | 'manage' | 'sync' | 'delete'

export type AiOsWorkspacePermission = {
  property_id: string
  access_level?: string | null
  can_view?: boolean | null
  can_upload?: boolean | null
  can_manage?: boolean | null
  can_sync_public_gallery?: boolean | null
  can_delete?: boolean | null
}

export type AiOsWorkspaceAccess = {
  profileId: string
  email: string
  profileRole: string
  workspaceRole: string
  workspaceUserId: string
  isActiveWorkspaceUser: boolean
  canSeeAllProperties: boolean
  isFullDesktop: boolean
  propertyIds: string[]
  permissionsByProperty: Map<string, AiOsWorkspacePermission>
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

function cleanString(value: unknown) {
  return String(value ?? '').trim()
}

function cleanEmail(value: unknown) {
  return cleanString(value).toLowerCase()
}

function profileId(profile: unknown) {
  return cleanString(asRecord(profile).id)
}

function profileEmail(profile: unknown) {
  const record = asRecord(profile)

  return (
    cleanEmail(record.login_email) ||
    cleanEmail(record.authorized_google_email) ||
    cleanEmail(record.email)
  )
}

function profileRole(profile: unknown) {
  return cleanString(asRecord(profile).role).toLowerCase()
}

function roleCanSeeAllProperties(role: string) {
  return role === 'administrator' || role === 'owner' || role === 'secretary'
}

function workspaceRoleCanSeeAllProperties(role: string) {
  return role === 'admin' || role === 'owner' || role === 'secretariat'
}

async function findWorkspaceUser(
  supabase: ServiceClient,
  id: string,
  email: string,
) {
  if (id) {
    const { data, error } = await supabase
      .from('ai_os_workspace_users')
      .select('*')
      .eq('auth_user_id', id)
      .maybeSingle()

    if (error) {
      console.error('AI-OS workspace user lookup by profile id error:', error)
    }

    if (data) return data as Record<string, unknown>
  }

  if (email) {
    const { data, error } = await supabase
      .from('ai_os_workspace_users')
      .select('*')
      .eq('email', email)
      .maybeSingle()

    if (error) {
      console.error('AI-OS workspace user lookup by email error:', error)
    }

    if (data) return data as Record<string, unknown>
  }

  return null
}

export async function getAiOsWorkspaceAccess(
  supabase: ServiceClient,
  profile: unknown,
): Promise<AiOsWorkspaceAccess> {
  const id = profileId(profile)
  const email = profileEmail(profile)
  const nativeRole = profileRole(profile)
  const nativeFullAccess = roleCanSeeAllProperties(nativeRole)

  const workspaceUser = await findWorkspaceUser(supabase, id, email)

  const workspaceUserId = cleanString(workspaceUser?.id)
  const workspaceRole = cleanString(workspaceUser?.role).toLowerCase()
  const isActiveWorkspaceUser = Boolean(workspaceUser?.is_active)

  const workspaceFullAccess =
    isActiveWorkspaceUser &&
    (
      Boolean(workspaceUser?.can_see_all_properties) ||
      workspaceRoleCanSeeAllProperties(workspaceRole)
    )

  const canSeeAllProperties = nativeFullAccess || workspaceFullAccess
  const isFullDesktop = canSeeAllProperties

  if (!workspaceUserId || canSeeAllProperties) {
    return {
      profileId: id,
      email,
      profileRole: nativeRole,
      workspaceRole: workspaceRole || nativeRole || 'agent',
      workspaceUserId,
      isActiveWorkspaceUser,
      canSeeAllProperties,
      isFullDesktop,
      propertyIds: [],
      permissionsByProperty: new Map(),
    }
  }

  const { data, error } = await supabase
    .from('ai_os_property_permissions')
    .select('property_id, access_level, can_view, can_upload, can_manage, can_sync_public_gallery, can_delete')
    .eq('workspace_user_id', workspaceUserId)
    .eq('can_view', true)

  if (error) {
    console.error('AI-OS property permissions lookup error:', error)

    return {
      profileId: id,
      email,
      profileRole: nativeRole,
      workspaceRole: workspaceRole || nativeRole || 'agent',
      workspaceUserId,
      isActiveWorkspaceUser,
      canSeeAllProperties: false,
      isFullDesktop: false,
      propertyIds: [],
      permissionsByProperty: new Map(),
    }
  }

  const permissions = (data ?? []) as AiOsWorkspacePermission[]
  const permissionsByProperty = new Map<string, AiOsWorkspacePermission>()

  for (const permission of permissions) {
    if (permission.property_id) {
      permissionsByProperty.set(permission.property_id, permission)
    }
  }

  return {
    profileId: id,
    email,
    profileRole: nativeRole,
    workspaceRole: workspaceRole || nativeRole || 'agent',
    workspaceUserId,
    isActiveWorkspaceUser,
    canSeeAllProperties: false,
    isFullDesktop: false,
    propertyIds: permissions.map((permission) => permission.property_id).filter(Boolean),
    permissionsByProperty,
  }
}

export function permissionAllowsAction(
  access: AiOsWorkspaceAccess,
  propertyId: string,
  action: WorkspacePermissionAction,
) {
  if (access.canSeeAllProperties) return true

  const permission = access.permissionsByProperty.get(propertyId)
  if (!permission) return false

  if (action === 'view') {
    return Boolean(permission.can_view)
  }

  if (action === 'upload') {
    return Boolean(
      permission.can_upload ||
      permission.can_manage ||
      permission.access_level === 'upload' ||
      permission.access_level === 'manage' ||
      permission.access_level === 'full',
    )
  }

  if (action === 'manage') {
    return Boolean(
      permission.can_manage ||
      permission.access_level === 'manage' ||
      permission.access_level === 'full',
    )
  }

  if (action === 'sync') {
    return Boolean(
      permission.can_sync_public_gallery ||
      permission.can_manage ||
      permission.access_level === 'full',
    )
  }

  if (action === 'delete') {
    return Boolean(permission.can_delete || permission.access_level === 'full')
  }

  return false
}

export async function canUseAiOsProperty(
  supabase: ServiceClient,
  profile: unknown,
  propertyId: string,
  action: WorkspacePermissionAction = 'view',
) {
  const cleanPropertyId = cleanString(propertyId)

  if (!cleanPropertyId) return false

  const access = await getAiOsWorkspaceAccess(supabase, profile)
  return permissionAllowsAction(access, cleanPropertyId, action)
}
