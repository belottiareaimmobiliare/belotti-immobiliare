import type { ReactNode } from 'react'
import { requirePermission } from '@/lib/admin-auth'

export default async function AdminImmobiliLayout({
  children,
}: {
  children: ReactNode
}) {
  await requirePermission('can_manage_properties')
  return <>{children}</>
}