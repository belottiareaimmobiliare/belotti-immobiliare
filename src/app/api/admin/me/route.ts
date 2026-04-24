import { NextResponse } from 'next/server'
import { getCurrentAdminProfile, getSidebarLinks } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const profile = await getCurrentAdminProfile()

  return NextResponse.json({
    profile,
    links: getSidebarLinks(profile),
  })
}