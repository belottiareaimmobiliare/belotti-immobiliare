import { redirect } from 'next/navigation'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export type AdminProfile = {
  id: string
  full_name: string
  username: string
  login_email: string
  authorized_google_email: string | null
  role: 'owner' | 'agent' | 'editor'
  is_active: boolean
  can_manage_properties: boolean
  can_manage_news: boolean
  can_manage_site_content: boolean
  can_manage_users: boolean
  can_view_logs: boolean
  can_view_kpis: boolean
  can_publish_properties: boolean
}

export type SidebarLink = {
  href: string
  label: string
}

export type AdminPermission =
  | 'can_manage_properties'
  | 'can_manage_news'
  | 'can_manage_site_content'
  | 'can_manage_users'
  | 'can_view_logs'
  | 'can_view_kpis'
  | 'can_publish_properties'

export function isOwner(profile: AdminProfile | null) {
  return profile?.role === 'owner'
}

export function getSidebarLinks(profile: AdminProfile | null): SidebarLink[] {
  const links: SidebarLink[] = [{ href: '/admin', label: 'Dashboard' }]

  if (!profile || !profile.is_active) {
    return links
  }

  if (profile.can_manage_properties) {
    links.push(
      { href: '/admin/immobili', label: 'Tutti gli immobili' },
      { href: '/admin/immobili?contractType=affitto', label: 'Affitti' },
      { href: '/admin/immobili?contractType=vendita', label: 'Vendite' }
    )
  }

  if (profile.can_manage_news) {
    links.push({ href: '/admin/news', label: 'News' })
  }

  if (profile.can_view_kpis) {
    links.push({ href: '/admin/kpi', label: 'KPI agenti' })
  }

  if (profile.role === 'owner') {
    links.push(
      { href: '/admin/autori', label: 'Editors' },
      { href: '/admin/contenuti/home', label: 'Modifica Home' },
      { href: '/admin/contenuti/chi-siamo', label: 'Modifica Chi siamo' },
      { href: '/admin/utenti', label: 'Active Directory' },
      { href: '/admin/logs', label: 'Logs' }
    )
  }

  return links
}

export async function getCurrentAdminProfile(): Promise<AdminProfile | null> {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const service = createServiceClient()

  const { data, error } = await service
    .from('profiles')
    .select(
      `
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
    `
    )
    .eq('id', user.id)
    .maybeSingle()

  if (error || !data) return null

  return data as AdminProfile
}

export async function requireAdminProfile() {
  const profile = await getCurrentAdminProfile()

  if (!profile || !profile.is_active) {
    redirect('/admin/login')
  }

  return profile
}

export async function requireOwner() {
  const profile = await requireAdminProfile()

  if (profile.role !== 'owner') {
    redirect('/admin')
  }

  return profile
}

export async function requirePermission(permission: AdminPermission) {
  const profile = await requireAdminProfile()

  if (profile.role === 'owner') {
    return profile
  }

  if (!profile[permission]) {
    redirect('/admin')
  }

  return profile
}