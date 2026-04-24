import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getAdminProfileByAuthIdentity } from '@/lib/admin-auth'

type UserRole = 'owner' | 'agent' | 'editor'

type PermissionPayload = {
  can_manage_properties: boolean
  can_manage_news: boolean
  can_manage_site_content: boolean
  can_manage_users: boolean
  can_view_logs: boolean
  can_view_kpis: boolean
  can_publish_properties: boolean
}

type CreateUserPayload = {
  full_name: string
  username: string
  login_email: string
  password: string
  authorized_google_email?: string | null
  role: UserRole
  is_active: boolean
} & PermissionPayload

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
  return String(value ?? '').trim()
}

function parseBoolean(value: unknown) {
  return value === true
}

function parseRole(value: unknown): UserRole | null {
  if (value === 'owner' || value === 'agent' || value === 'editor') return value
  return null
}

function getPermissions(payload: Partial<CreateUserPayload>): PermissionPayload {
  return {
    can_manage_properties: parseBoolean(payload.can_manage_properties),
    can_manage_news: parseBoolean(payload.can_manage_news),
    can_manage_site_content: parseBoolean(payload.can_manage_site_content),
    can_manage_users: parseBoolean(payload.can_manage_users),
    can_view_logs: parseBoolean(payload.can_view_logs),
    can_view_kpis: parseBoolean(payload.can_view_kpis),
    can_publish_properties: parseBoolean(payload.can_publish_properties),
  }
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
    entity_type: 'user'
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
      entity_type: input.entity_type,
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

export async function GET() {
  const auth = await getActorOwner()
  if ('error' in auth) return auth.error

  const { service } = auth

  const { data, error } = await service.from('profiles').select(`
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

  if (error) {
    return NextResponse.json(
      { error: 'Errore nel caricamento utenti.' },
      { status: 500 }
    )
  }

  const roleOrder = { owner: 0, agent: 1, editor: 2 }

  const users = [...(data ?? [])].sort((a, b) => {
    const roleDiff = roleOrder[a.role as UserRole] - roleOrder[b.role as UserRole]
    if (roleDiff !== 0) return roleDiff
    return a.full_name.localeCompare(b.full_name, 'it')
  })

  return NextResponse.json({ users })
}

export async function POST(request: Request) {
  const auth = await getActorOwner()
  if ('error' in auth) return auth.error

  const { actor, service } = auth
  const body = (await request.json()) as Partial<CreateUserPayload>

  const full_name = normalizeName(body.full_name)
  const username = normalizeUsername(body.username)
  const login_email = normalizeRequiredEmail(body.login_email)
  const password = normalizePassword(body.password)
  const authorized_google_email = normalizeEmail(body.authorized_google_email)
  const role = parseRole(body.role)
  const is_active = parseBoolean(body.is_active)
  const permissions = getPermissions(body)

  if (!full_name || !username || !login_email || !password || !role) {
    return NextResponse.json(
      { error: 'Compila nome, username, email login, password e ruolo.' },
      { status: 400 }
    )
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: 'La password temporanea deve avere almeno 8 caratteri.' },
      { status: 400 }
    )
  }

  if (role === 'owner' && is_active) {
    const { count } = await service
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'owner')
      .eq('is_active', true)

    if ((count ?? 0) >= 3) {
      return NextResponse.json(
        { error: 'Puoi avere al massimo 3 proprietari attivi.' },
        { status: 400 }
      )
    }
  }

  const createdAuth = await service.auth.admin.createUser({
    email: login_email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name,
      username,
      role,
    },
    app_metadata: {
      role,
    },
  })

  if (createdAuth.error || !createdAuth.data.user) {
    return NextResponse.json(
      {
        error:
          createdAuth.error?.message ?? 'Errore nella creazione utente auth.',
      },
      { status: 400 }
    )
  }

  const authUserId = createdAuth.data.user.id

  const { data: insertedProfile, error: profileError } = await service
    .from('profiles')
    .insert({
      id: authUserId,
      full_name,
      username,
      login_email,
      authorized_google_email,
      role,
      is_active,
      ...permissions,
    })
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

  if (profileError) {
    await service.auth.admin.deleteUser(authUserId)

    return NextResponse.json(
      { error: profileError.message || 'Errore nella creazione profilo.' },
      { status: 400 }
    )
  }

  await insertActivityLog(service, {
    actor_user_id: actor.id,
    actor_username: actor.username ?? null,
    actor_full_name: actor.full_name ?? null,
    entity_type: 'user',
    entity_id: authUserId,
    action: 'create',
    summary: `Creato utente ${full_name} (${role}).`,
    after_data: insertedProfile,
  })

  return NextResponse.json({ user: insertedProfile })
}