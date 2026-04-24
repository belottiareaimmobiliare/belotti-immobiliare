import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getAdminProfileByAuthIdentity } from '@/lib/admin-auth'

type UserRole = 'owner' | 'agent' | 'editor'

type UpdateUserPayload = {
  full_name: string
  username: string
  login_email: string
  authorized_google_email?: string | null
  role: UserRole
  is_active: boolean
  new_password?: string
  can_manage_properties: boolean
  can_manage_news: boolean
  can_manage_site_content: boolean
  can_manage_users: boolean
  can_view_logs: boolean
  can_view_kpis: boolean
  can_publish_properties: boolean
}

function normalizeEmail(value: unknown) {
  const str = String(value ?? '').trim().toLowerCase()
  return str ? str : null
}

function normalizeRequiredEmail(value: unknown) {
  return String(value ?? '').trim().toLowerCase()
}

function normalizeUsername(value: unknown) {
  return String(value ?? '').trim().toLowerCase()
}

function normalizeName(value: unknown) {
  return String(value ?? '').trim()
}

function normalizePassword(value: unknown) {
  const str = String(value ?? '').trim()
  return str ? str : null
}

function parseBoolean(value: unknown) {
  return value === true
}

function parseRole(value: unknown): UserRole | null {
  if (value === 'owner' || value === 'agent' || value === 'editor') return value
  return null
}

async function getActorOwner() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      error: NextResponse.json({ error: 'Non autenticato.' }, { status: 401 }),
    }
  }

  const service = createServiceClient()

  const profile = await getAdminProfileByAuthIdentity({
    id: user.id,
    email: user.email,
  })

  if (!profile || profile.role !== 'owner' || !profile.is_active) {
    return {
      error: NextResponse.json(
        { error: 'Accesso riservato ai proprietari.' },
        { status: 403 }
      ),
    }
  }

  return { actor: profile, service }
}

async function insertActivityLog(
  service: ReturnType<typeof createServiceClient>,
  input: {
    actor_user_id: string
    actor_username: string | null
    actor_full_name: string | null
    entity_id: string
    action:
      | 'create'
      | 'update'
      | 'delete'
      | 'publish'
      | 'unpublish'
      | 'assign'
      | 'login_success'
      | 'login_failed'
      | 'qr_approved'
      | 'qr_rejected'
      | 'role_change'
      | 'permission_change'
      | 'activate_user'
      | 'deactivate_user'
    summary: string
    before_data?: Record<string, unknown> | null
    after_data?: Record<string, unknown> | null
  }
) {
  try {
    await service.from('activity_log').insert({
      actor_user_id: input.actor_user_id,
      actor_username: input.actor_username,
      actor_full_name: input.actor_full_name,
      entity_type: 'user',
      entity_id: input.entity_id,
      action: input.action,
      summary: input.summary,
      before_data: input.before_data ?? null,
      after_data: input.after_data ?? null,
    })
  } catch {
    // non bloccare il flusso
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const auth = await getActorOwner()
  if ('error' in auth) return auth.error

  const { actor, service } = auth
  const { userId } = await context.params
  const body = (await request.json()) as Partial<UpdateUserPayload>

  const full_name = normalizeName(body.full_name)
  const username = normalizeUsername(body.username)
  const login_email = normalizeRequiredEmail(body.login_email)
  const authorized_google_email = normalizeEmail(body.authorized_google_email)
  const role = parseRole(body.role)
  const is_active = parseBoolean(body.is_active)
  const new_password = normalizePassword(body.new_password)

  if (!userId || !full_name || !username || !login_email || !role) {
    return NextResponse.json(
      { error: 'Dati utente incompleti.' },
      { status: 400 }
    )
  }

  if (new_password && new_password.length < 8) {
    return NextResponse.json(
      { error: 'La nuova password deve avere almeno 8 caratteri.' },
      { status: 400 }
    )
  }

  const { data: existingProfile, error: existingError } = await service
    .from('profiles')
    .select(`
      id,
      full_name,
      username,
      login_email,
      authorized_google_email,
      role,
      is_active,
      can_manage_properties,
      can_manage_news,
      can_manage_site_content,
      can_manage_users,
      can_view_logs,
      can_view_kpis,
      can_publish_properties
    `)
    .eq('id', userId)
    .maybeSingle()

  if (existingError || !existingProfile) {
    return NextResponse.json({ error: 'Utente non trovato.' }, { status: 404 })
  }

  if (role === 'owner' && is_active) {
    const { count } = await service
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'owner')
      .eq('is_active', true)
      .neq('id', userId)

    if ((count ?? 0) >= 3) {
      return NextResponse.json(
        { error: 'Puoi avere al massimo 3 proprietari attivi.' },
        { status: 400 }
      )
    }
  }

  const isRemovingOwner =
    existingProfile.role === 'owner' &&
    existingProfile.is_active &&
    (role !== 'owner' || !is_active)

  if (isRemovingOwner) {
    const { count } = await service
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'owner')
      .eq('is_active', true)

    if ((count ?? 0) <= 1) {
      return NextResponse.json(
        { error: 'Deve rimanere almeno 1 proprietario attivo.' },
        { status: 400 }
      )
    }
  }

  const authUpdatePayload: {
    email?: string
    password?: string
    user_metadata?: Record<string, unknown>
    app_metadata?: Record<string, unknown>
  } = {
    email: login_email,
    user_metadata: {
      full_name,
      username,
      role,
    },
    app_metadata: {
      role,
    },
  }

  if (new_password) {
    authUpdatePayload.password = new_password
  }

  const updatedAuth = await service.auth.admin.updateUserById(
    userId,
    authUpdatePayload
  )

  if (updatedAuth.error) {
    return NextResponse.json(
      { error: updatedAuth.error.message || 'Errore aggiornamento auth.' },
      { status: 400 }
    )
  }

  const updatePayload = {
    full_name,
    username,
    login_email,
    authorized_google_email,
    role,
    is_active,
    can_manage_properties: parseBoolean(body.can_manage_properties),
    can_manage_news: parseBoolean(body.can_manage_news),
    can_manage_site_content: parseBoolean(body.can_manage_site_content),
    can_manage_users: parseBoolean(body.can_manage_users),
    can_view_logs: parseBoolean(body.can_view_logs),
    can_view_kpis: parseBoolean(body.can_view_kpis),
    can_publish_properties: parseBoolean(body.can_publish_properties),
  }

  const { data: updatedProfile, error: updateError } = await service
    .from('profiles')
    .update(updatePayload)
    .eq('id', userId)
    .select(`
      id,
      full_name,
      username,
      login_email,
      authorized_google_email,
      role,
      is_active,
      can_manage_properties,
      can_manage_news,
      can_manage_site_content,
      can_manage_users,
      can_view_logs,
      can_view_kpis,
      can_publish_properties,
      created_at,
      updated_at
    `)
    .single()

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message || 'Errore aggiornamento profilo.' },
      { status: 400 }
    )
  }

  const permissionsChanged =
    existingProfile.can_manage_properties !== updatePayload.can_manage_properties ||
    existingProfile.can_manage_news !== updatePayload.can_manage_news ||
    existingProfile.can_manage_site_content !==
      updatePayload.can_manage_site_content ||
    existingProfile.can_manage_users !== updatePayload.can_manage_users ||
    existingProfile.can_view_logs !== updatePayload.can_view_logs ||
    existingProfile.can_view_kpis !== updatePayload.can_view_kpis ||
    existingProfile.can_publish_properties !==
      updatePayload.can_publish_properties

  await insertActivityLog(service, {
    actor_user_id: actor.id,
    actor_username: actor.username ?? null,
    actor_full_name: actor.full_name ?? null,
    entity_id: userId,
    action:
      existingProfile.is_active !== updatePayload.is_active
        ? updatePayload.is_active
          ? 'activate_user'
          : 'deactivate_user'
        : existingProfile.role !== updatePayload.role
          ? 'role_change'
          : permissionsChanged
            ? 'permission_change'
            : 'update',
    summary: `Aggiornato utente ${updatedProfile.full_name}.`,
    before_data: existingProfile,
    after_data: updatedProfile,
  })

  return NextResponse.json({ user: updatedProfile })
}