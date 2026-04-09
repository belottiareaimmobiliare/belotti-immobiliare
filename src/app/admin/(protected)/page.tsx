import { createClient } from '@/lib/supabase/server'

export default async function AdminPage() {
  const supabase = await createClient()

  const { data: properties } = await supabase
    .from('properties')
    .select('id, status')

  const total = properties?.length || 0
  const published = properties?.filter(p => p.status === 'published').length || 0
  const draft = properties?.filter(p => p.status === 'draft').length || 0

  return (
    <section>
      <p className="text-sm uppercase tracking-[0.2em] text-white/40">
        Dashboard
      </p>

      <h2 className="mt-2 text-3xl font-semibold text-white">
        Benvenuto nel gestionale
      </h2>

      <p className="mt-3 max-w-2xl text-white/60">
        Da qui gestirai immobili, pubblicazione, immagini e planimetrie.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-white/50">Totale immobili</p>
          <p className="mt-3 text-3xl font-semibold">{total}</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-white/50">Pubblicati</p>
          <p className="mt-3 text-3xl font-semibold">{published}</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-white/50">Bozze</p>
          <p className="mt-3 text-3xl font-semibold">{draft}</p>
        </div>
      </div>
    </section>
  )
}