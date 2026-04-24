import Link from 'next/link'
import { requireOwner } from '@/lib/admin-auth'
import UserManagementPanel from '@/components/admin/UserManagementPanel'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  await requireOwner()

  return (
    <div className="space-y-6">
      <section className="theme-panel rounded-[26px] border p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/admin"
            className="inline-flex items-center justify-center rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-surface-2)]"
          >
            ← Torna alla dashboard
          </Link>

          <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-2.5 text-sm text-[var(--site-text-muted)]">
            Area riservata Admin Proprietario
          </div>
        </div>
      </section>

      <UserManagementPanel />
    </div>
  )
}