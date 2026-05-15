import { NextResponse } from 'next/server'
import { requireAdminProfile } from '@/lib/admin-auth'
import { canUseAIOS, jsonError } from '@/lib/ai-os'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

const ALLOWED_ROLES = new Set([
  'admin',
  'owner',
  'secretariat',
  'agent',
  'photographer',
  'collaborator',
  'client',
])

function cleanString(value: unknown) {
  return String(value ?? '').trim()
}

function cleanEmail(value: unknown) {
  return cleanString(value).toLowerCase()
}

function cleanRole(value: unknown) {
  const role = cleanString(value).toLowerCase()
  return ALLOWED_ROLES.has(role) ? role : 'agent'
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

export async function GET() {
  try {
    await requireWorkspaceManager()

    const supabase = createServiceClient()

    const { data: users, error: usersError } = await supabase
      .from('ai_os_workspace_users')
      .select('*')
      .order('created_at', { ascending: false })

    if (usersError) {
      return NextResponse.json(
        { error: usersError.message || 'Errore caricamento utenti workspace' },
        { status: 500 },
      )
    }

    const userIds = (users ?? []).map((user) => user.id).filter(Boolean)

    let permissions: any[] = []

    if (userIds.length > 0) {
      const { data: permissionRows, error: permissionsError } = await supabase
        .from('ai_os_property_permissions')
        .select('*')
        .in('workspace_user_id', userIds)

      if (permissionsError) {
        console.error('AI-OS workspace permissions GET error:', permissionsError)
      } else {
        permissions = permissionRows ?? []
      }
    }

    return NextResponse.json({
      ok: true,
      users: users ?? [],
      permissions,
    })
  } catch (error) {
    return NextResponse.json(
      { error: jsonError(error, 'Errore caricamento utenti workspace') },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    await requireWorkspaceManager()

    const body = await request.json().catch(() => null)

    const id = cleanString(body?.id)
    const authUserId = cleanString(body?.authUserId)
    const email = cleanEmail(body?.email)
    const displayName = cleanString(body?.displayName)
    const role = cleanRole(body?.role)
    const canSeeAllProperties = bool(body?.canSeeAllProperties)
    const isActive = bool(body?.isActive, true)
    const notes = cleanString(body?.notes)

    if (!email && !authUserId) {
      return NextResponse.json(
        { error: 'Inserisci almeno email o auth_user_id.' },
        { status: 400 },
      )
    }

    const supabase = createServiceClient()

    if (id) {
      const { data, error } = await supabase
        .from('ai_os_workspace_users')
        .update({
          auth_user_id: authUserId || null,
          email: email || null,
          display_name: displayName || null,
          role,
          can_see_all_properties: canSeeAllProperties,
          is_active: isActive,
          notes: notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*')
        .single()

      if (error) {
        return NextResponse.json(
          { error: error.message || 'Errore aggiornamento utente workspace' },
          { status: 500 },
        )
      }

      return NextResponse.json({ ok: true, user: data })
    }

    let existingUser: any = null

    if (email) {
      const { data } = await supabase
        .from('ai_os_workspace_users')
        .select('*')
        .eq('email', email)
        .maybeSingle()

      existingUser = data
    }

    if (!existingUser && authUserId) {
      const { data } = await supabase
        .from('ai_os_workspace_users')
        .select('*')
        .eq('auth_user_id', authUserId)
        .maybeSingle()

      existingUser = data
    }

    if (existingUser?.id) {
      const { data, error } = await supabase
        .from('ai_os_workspace_users')
        .update({
          auth_user_id: authUserId || existingUser.auth_user_id || null,
          email: email || existingUser.email || null,
          display_name: displayName || existingUser.display_name || null,
          role,
          can_see_all_properties: canSeeAllProperties,
          is_active: isActive,
          notes: notes || existingUser.notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingUser.id)
        .select('*')
        .single()

      if (error) {
        return NextResponse.json(
          { error: error.message || 'Errore aggiornamento utente workspace' },
          { status: 500 },
        )
      }

      return NextResponse.json({ ok: true, user: data })
    }

    const { data, error } = await supabase
      .from('ai_os_workspace_users')
      .insert({
        auth_user_id: authUserId || null,
        email: email || null,
        display_name: displayName || null,
        role,
        can_see_all_properties: canSeeAllProperties,
        is_active: isActive,
        notes: notes || null,
      })
      .select('*')
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Errore creazione utente workspace' },
        { status: 500 },
      )
    }

    return NextResponse.json({ ok: true, user: data })
  } catch (error) {
    return NextResponse.json(
      { error: jsonError(error, 'Errore salvataggio utente workspace') },
      { status: 500 },
    )
  }
}
