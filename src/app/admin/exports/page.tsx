import Link from 'next/link'
import { requireAdminProfile } from '@/lib/admin-auth'
import { createClient } from '@/lib/supabase/server'

export default async function AdminExportsPage() {
  await requireAdminProfile()
  const supabase = await createClient()

  const { data: all } = await supabase
    .from('properties')
    .select('export_immobiliare_it, export_idealista, export_casa_it')
    .eq('status', 'published')

  const counts = {
    immobiliare: all?.filter(p => p.export_immobiliare_it).length || 0,
    idealista: all?.filter(p => p.export_idealista).length || 0,
    casa: all?.filter(p => p.export_casa_it).length || 0,
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Export Portali</h1>

      <div className="grid gap-6 md:grid-cols-3">

        {/* IMMOBILIARE.IT */}
        <div className="rounded-2xl border p-6 bg-[var(--site-surface)]">
          <h2 className="text-lg font-semibold">Immobiliare.it</h2>
          <p className="text-sm opacity-70 mt-1">
            XML pronto per portale
          </p>

          <p className="mt-4 text-2xl font-bold">
            {counts.immobiliare}
          </p>

          <a
            href="/api/admin/exports/immobiliare-it"
            target="_blank"
            className="mt-4 inline-block rounded-xl px-4 py-2 bg-black text-white text-sm"
          >
            Apri XML
          </a>
        </div>

        {/* IDEALISTA */}
        <div className="rounded-2xl border p-6 bg-[var(--site-surface)]">
          <h2 className="text-lg font-semibold">Idealista</h2>
          <p className="text-sm opacity-70 mt-1">
            JSON (da adattare)
          </p>

          <p className="mt-4 text-2xl font-bold">
            {counts.idealista}
          </p>

          <a
            href="/api/admin/exports/idealista"
            target="_blank"
            className="mt-4 inline-block rounded-xl px-4 py-2 bg-black text-white text-sm"
          >
            Apri feed
          </a>
        </div>

        {/* CASA.IT */}
        <div className="rounded-2xl border p-6 bg-[var(--site-surface)]">
          <h2 className="text-lg font-semibold">Casa.it</h2>
          <p className="text-sm opacity-70 mt-1">
            JSON (da adattare)
          </p>

          <p className="mt-4 text-2xl font-bold">
            {counts.casa}
          </p>

          <a
            href="/api/admin/exports/casa-it"
            target="_blank"
            className="mt-4 inline-block rounded-xl px-4 py-2 bg-black text-white text-sm"
          >
            Apri feed
          </a>
        </div>

      </div>
    </div>
  )
}
