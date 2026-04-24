import type { ReactNode } from 'react'
import { requireOwner } from '@/lib/admin-auth'

export default async function AdminContentLayout({
  children,
}: {
  children: ReactNode
}) {
  await requireOwner()

  return <>{children}</>
}