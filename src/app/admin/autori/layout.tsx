import type { ReactNode } from 'react'
import { requireOwner } from '@/lib/admin-auth'

export default async function AdminAuthorsLayout({
  children,
}: {
  children: ReactNode
}) {
  await requireOwner()

  return <>{children}</>
}