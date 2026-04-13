import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function AdminPage() {
  const supabase = await createClient()

  const { data: properties } = await supabase
    .from('properties')
    .select('id, status, contract_type')

  const total = properties?.length || 0
  const published = properties?.filter((p) => p.status === 'published').length || 0
  const draft = properties?.filter((p) => p.status === 'draft').length || 0
  const saleCount =
    properties?.filter((p) => p.contract_type === 'vendita').length || 0
  const rentCount =
    properties?.filter((p) => p.contract_type === 'affitto').length || 0

  return (
    <section className="text-[var(--site-text)]">
      <p className="theme-admin-faint text-sm uppercase tracking-[0.2em]">
        Dashboard
      </p>

      <h2 className="mt-2 text-3xl font-semibold text-[var(--site-text)]">
        Benvenuto nel gestionale
      </h2>

      <p className="theme-admin-muted mt-3 max-w-2xl">
        Da qui gestirai immobili, pubblicazione, immagini e planimetrie.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Link
          href="/admin/immobili?contractType=vendita"
          className="theme-admin-button-primary inline-flex flex-col items-center justify-center rounded-2xl px-5 py-4 text-center text-sm font-medium transition hover:opacity-95"
        >
          <span>Immobili in vendita</span>
          <span className="mt-1 text-xs opacity-70">{saleCount} elementi</span>
        </Link>

        <Link
          href="/admin/immobili?contractType=affitto"
          className="theme-admin-button-secondary inline-flex flex-col items-center justify-center rounded-2xl px-5 py-4 text-center text-sm font-medium transition hover:opacity-95"
        >
          <span>Immobili in affitto</span>
          <span className="mt-1 text-xs opacity-70">{rentCount} elementi</span>
        </Link>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="theme-admin-card rounded-3xl p-6">
          <p className="theme-admin-muted text-sm">Totale immobili</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--site-text)]">{total}</p>
        </div>

        <div className="theme-admin-card rounded-3xl p-6">
          <p className="theme-admin-muted text-sm">Pubblicati</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--site-text)]">{published}</p>
        </div>

        <div className="theme-admin-card rounded-3xl p-6">
          <p className="theme-admin-muted text-sm">Bozze</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--site-text)]">{draft}</p>
        </div>
      </div>
    </section>
  )
}