import type { ReactNode } from 'react'
import { requirePermission } from '@/lib/admin-auth'

export default async function AdminNewsLayout({
  children,
}: {
  children: ReactNode
}) {
  await requirePermission('can_manage_news')
  return <>{children}</>
}