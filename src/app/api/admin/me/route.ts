import { NextResponse } from 'next/server'
import { getCurrentAdminProfile, getSidebarLinks } from '@/lib/admin-auth'

export async function GET() {
  const profile = await getCurrentAdminProfile()

  if (!profile || !profile.is_active) {
    return NextResponse.json(
      { profile: null, links: [{ href: '/admin', label: 'Dashboard' }] },
      { status: 401 }
    )
  }

  return NextResponse.json({
    profile: {
      id: profile.id,
      full_name: profile.full_name,
      username: profile.username,
      role: profile.role,
      is_active: profile.is_active,
    },
    links: getSidebarLinks(profile),
  })
}