import type { ReactNode } from 'react'
import { requireAdminProfile } from '@/lib/admin-auth'
import AdminSectionVisibilityGate from '@/components/admin/AdminSectionVisibilityGate'

export default async function AdminProtectedLayout({
  children,
}: {
  children: ReactNode
}) {
  await requireAdminProfile()

  return <>{children}
      <AdminSectionVisibilityGate /></>
}
