import type { ReactNode } from 'react'
import { requireAdminProfile } from '@/lib/admin-auth'

export default async function AdminProtectedLayout({
  children,
}: {
  children: ReactNode
}) {
  await requireAdminProfile()

  return <>{children}</>
}
