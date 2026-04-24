import type { ReactNode } from 'react'
import { requirePermission } from '@/lib/admin-auth'

export default async function AdminKpiLayout({
  children,
}: {
  children: ReactNode
}) {
  await requirePermission('can_view_kpis')
  return <>{children}</>
}