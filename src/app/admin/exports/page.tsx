import Link from 'next/link'
import { requireAdminProfile } from '@/lib/admin-auth'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type Property = {
  id: string
  title: string | null
  comune: string | null
  province: string | null
  price: number | null
  contract_type: string | null
  property_type: string | null
  export_immobiliare_it: boolean | null
  export_idealista: boolean | null
  export_casa_it: boolean | null
  export_immobiliare_it_status: string | null
  export_idealista_status: string | null
  export_casa_it_status: string | null
}

function ledClass(enabled: boolean | null, status: string | null) {
  if (status === 'synced') return 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]'
  if (enabled || status === 'generated') return 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.85)]'
  return 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.75)]'
}

function formatPrice(price: number | null) {
  if (!price) return 'Trattativa riservata'
  return `€ ${price.toLocaleString('it-IT')}`
}

export default async function AdminExportsPage() {
  const profile = await requireAdminProfile()
  const supabase = await createClient()

  if (profile.role !== 'owner' && !profile.can_manage_properties) {
    return (
      <div className="theme-panel rounded-[30px] border p-6">
        <h1 className="text-2xl font-semibold">Accesso non autorizzato</h1>
      </div>
    )
  }

  const { data } = await supabase
    .from('properties')
    .select('*')
    .eq('status', 'published')
    .order('updated_at', { ascending: false })

  const properties = ((data || []) as Property[]).filter(
    (p) => p.export_immobiliare_it || p.export_idealista || p.export_casa_it
  )

  return (
    <section className="mx-auto w-full max-w-7xl text-[var(--site-text)]">
      <p className="theme-admin-faint text-sm uppercase tracking-[0.2em]">
        Export portali
      </p>

      <h1 className="mt-2 text-3xl font-semibold">Immobili selezionati per export</h1>

      <p className="theme-admin-muted mt-3">
        Ogni tessera mostra su quali portali deve andare l’immobile. Il download genera il feed; la sincronizzazione remota sarà attivabile solo quando avremo metodo, API o credenziali ufficiali del portale.
      </p>

      <div className="mt-6 rounded-3xl border border-[var(--site-border)] bg-[var(--site-surface)] p-5">
        <div className="flex flex-wrap gap-4 text-sm text-[var(--site-text-muted)]">
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.75)]" />
            Non generato
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.85)]" />
            Generato / incluso nel feed
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
            Sync remoto completato
          </span>
        </div>
      </div>

      {properties.length === 0 ? (
        <div className="theme-admin-card mt-8 rounded-3xl border-dashed p-10 text-[var(--site-text-muted)]">
          Nessun immobile pubblicato selezionato per i portali.
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {properties.map((property) => (
            <article key={property.id} className="theme-admin-card rounded-[30px] p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="theme-admin-faint text-xs uppercase tracking-[0.18em]">
                    {property.contract_type || 'Contratto'} · {property.property_type || 'Tipologia'}
                  </p>

                  <h2 className="mt-2 text-2xl font-semibold">
                    {property.title || 'Immobile senza titolo'}
                  </h2>

                  <p className="theme-admin-muted mt-2 text-sm">
                    {property.comune || '—'} ({property.province || '—'})
                  </p>
                </div>

                <p className="text-xl font-semibold">{formatPrice(property.price)}</p>
              </div>

              <div className="mt-6 grid gap-3">
                <PortalRow
                  name="Immobiliare.it"
                  enabled={property.export_immobiliare_it}
                  status={property.export_immobiliare_it_status}
                  href={`/api/admin/exports/immobiliare-it?id=${property.id}`}
                  downloadLabel="Download XML"
                />

                <PortalRow
                  name="Idealista"
                  enabled={property.export_idealista}
                  status={property.export_idealista_status}
                  href={`/api/admin/exports/idealista?id=${property.id}`}
                  downloadLabel="Download JSON"
                />

                <PortalRow
                  name="Casa.it"
                  enabled={property.export_casa_it}
                  status={property.export_casa_it_status}
                  href={`/api/admin/exports/casa-it?id=${property.id}`}
                  downloadLabel="Download JSON"
                />
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

function PortalRow({
  name,
  enabled,
  status,
  href,
  downloadLabel,
}: {
  name: string
  enabled: boolean | null
  status: string | null
  href: string
  downloadLabel: string
}) {
  const active = Boolean(enabled)

  return (
    <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-strong)] p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <span className={`h-3.5 w-3.5 rounded-full ${ledClass(enabled, status)}`} />
          <div>
            <p className="font-semibold">{name}</p>
            <p className="text-xs text-[var(--site-text-muted)]">
              {status === 'synced'
                ? 'Sincronizzato sul sito remoto'
                : active
                  ? 'Incluso nel prossimo export'
                  : 'Non selezionato per export'}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          {active ? (
            <Link
              href={href}
              target="_blank"
              className="theme-admin-button-primary inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold"
            >
              {downloadLabel}
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex items-center justify-center rounded-xl border border-[var(--site-border)] px-4 py-2 text-sm text-[var(--site-text-faint)] opacity-60"
            >
              Download
            </button>
          )}

          <button
            type="button"
            disabled
            title="Sync remoto non configurato: servono API/FTP/credenziali del portale."
            className="inline-flex items-center justify-center rounded-xl border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-2 text-sm text-[var(--site-text-muted)] opacity-60"
          >
            Sync remoto
          </button>
        </div>
      </div>
    </div>
  )
}
