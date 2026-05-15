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
  authUserId: string
  email: string
  role: string
  workspaceUserId: string
  isActiveWorkspaceUser: boolean
  canSeeAllProperties: boolean
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

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function profileAuthUserId(profile: unknown) {
  const record = asRecord(profile)

  const direct =
    cleanString(record.auth_user_id) ||
    cleanString(record.user_id) ||
    cleanString(record.supabase_user_id)

  if (isUuid(direct)) return direct

  const id = cleanString(record.id)
  return isUuid(id) ? id : ''
}

function profileEmail(profile: unknown) {
  const record = asRecord(profile)

  return (
    cleanEmail(record.email) ||
    cleanEmail(record.user_email) ||
    cleanEmail(record.admin_email)
  )
}

function profileRole(profile: unknown) {
  const record = asRecord(profile)

  return (
    cleanString(record.role) ||
    cleanString(record.user_role) ||
    cleanString(record.type)
  ).toLowerCase()
}

function profileHasNativeFullAccess(profile: unknown) {
  const record = asRecord(profile)
  const role = profileRole(profile)

  if (
    role.includes('admin') ||
    role.includes('owner') ||
    role.includes('proprietario') ||
    role.includes('segret') ||
    role.includes('secretariat')
  ) {
    return true
  }

  return Boolean(
    record.is_admin ||
      record.is_super_admin ||
      record.can_see_all_properties ||
      record.can_manage_all ||
      record.can_use_ai_os_full,
  )
}

async function findWorkspaceUser(
  supabase: ServiceClient,
  authUserId: string,
  email: string,
) {
  if (authUserId) {
    const { data, error } = await supabase
      .from('ai_os_workspace_users')
      .select('*')
      .eq('auth_user_id', authUserId)
      .maybeSingle()

    if (error) {
      console.error('AI-OS workspace user lookup by auth id error:', error)
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
  const authUserId = profileAuthUserId(profile)
  const email = profileEmail(profile)
  const nativeRole = profileRole(profile)
  const nativeFullAccess = profileHasNativeFullAccess(profile)

  const workspaceUser = await findWorkspaceUser(supabase, authUserId, email)

  const workspaceUserId = cleanString(workspaceUser?.id)
  const workspaceRole = cleanString(workspaceUser?.role).toLowerCase()
  const isActiveWorkspaceUser = Boolean(workspaceUser?.is_active)

  const workspaceFullAccess =
    isActiveWorkspaceUser &&
    (
      Boolean(workspaceUser?.can_see_all_properties) ||
      workspaceRole === 'admin' ||
      workspaceRole === 'owner' ||
      workspaceRole === 'secretariat'
    )

  const canSeeAllProperties = nativeFullAccess || workspaceFullAccess

  if (!workspaceUserId || canSeeAllProperties) {
    return {
      authUserId,
      email,
      role: workspaceRole || nativeRole || 'admin',
      workspaceUserId,
      isActiveWorkspaceUser,
      canSeeAllProperties,
      propertyIds: [],
      permissionsByProperty: new Map(),
    }
  }

  const { data, error } = await supabase
    .from('ai_os_property_permissions')
    .select('property_id, access_level, can_view, can_upload, can_manage, can_sync_public_gallery, can_delete')
    .eq('workspace_user_id', workspaceUserId)

  if (error) {
    console.error('AI-OS property permissions lookup error:', error)
    return {
      authUserId,
      email,
      role: workspaceRole || nativeRole || 'agent',
      workspaceUserId,
      isActiveWorkspaceUser,
      canSeeAllProperties: false,
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
    authUserId,
    email,
    role: workspaceRole || nativeRole || 'agent',
    workspaceUserId,
    isActiveWorkspaceUser,
    canSeeAllProperties: false,
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
    return Boolean(permission.can_upload || permission.can_manage || permission.access_level === 'upload' || permission.access_level === 'manage' || permission.access_level === 'full')
  }

  if (action === 'manage') {
    return Boolean(permission.can_manage || permission.access_level === 'manage' || permission.access_level === 'full')
  }

  if (action === 'sync') {
    return Boolean(permission.can_sync_public_gallery || permission.can_manage || permission.access_level === 'full')
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
