import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

type Property = {
  id: string
  title: string | null
  slug: string | null
  status: string | null
  contract_type: string | null
  price: number | null
  comune: string | null
  province: string | null
  created_at: string | null
  updated_at: string | null
}

type LeadRow = {
  id: string
  property_id: string | null
  created_at: string | null
}

function daysOnline(dateString: string | null) {
  if (!dateString) return null
  const now = new Date().getTime()
  const then = new Date(dateString).getTime()
  const diff = Math.max(0, now - then)
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

function humanAge(days: number | null) {
  if (days === null) return '—'
  if (days < 30) return `${days} gg`
  const months = Math.floor(days / 30)
  return `${months} mesi`
}

function formatPrice(price: number | null) {
  if (typeof price !== 'number') return 'Trattativa riservata'
  return `€ ${price.toLocaleString('it-IT')}`
}

function getAlertLevel(days: number | null) {
  if (days === null) {
    return {
      label: 'Nessun dato',
      className: 'border-white/10 bg-white/[0.04] text-white/70',
      order: 0,
    }
  }

  if (days >= 180) {
    return {
      label: 'Oltre 6 mesi',
      className: 'border-fuchsia-400/20 bg-fuchsia-500/10 text-fuchsia-200',
      order: 4,
    }
  }

  if (days >= 90) {
    return {
      label: 'Oltre 3 mesi',
      className: 'border-red-400/20 bg-red-500/10 text-red-200',
      order: 3,
    }
  }

  if (days >= 60) {
    return {
      label: 'Oltre 2 mesi',
      className: 'border-orange-400/20 bg-orange-500/10 text-orange-200',
      order: 2,
    }
  }

  if (days >= 30) {
    return {
      label: 'Oltre 1 mese',
      className: 'border-amber-400/20 bg-amber-500/10 text-amber-200',
      order: 1,
    }
  }

  return {
    label: 'Recente',
    className: 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200',
    order: 0,
  }
}

export default async function AdminPage() {
  const supabase = await createClient()

  const [{ data: propertiesData }, { data: leadsData, error: leadsError }] =
    await Promise.all([
      supabase
        .from('properties')
        .select(
          'id, title, slug, status, contract_type, price, comune, province, created_at, updated_at'
        ),
      supabase
        .from('leads')
        .select('id, property_id, created_at')
        .order('created_at', { ascending: false }),
    ])

  const properties = (propertiesData || []) as Property[]
  const leads = (leadsError ? [] : leadsData || []) as LeadRow[]

  const total = properties.length
  const published = properties.filter((p) => p.status === 'published').length
  const draft = properties.filter((p) => p.status === 'draft').length
  const saleCount = properties.filter((p) => p.contract_type === 'vendita').length
  const rentCount = properties.filter((p) => p.contract_type === 'affitto').length

  const publishedProperties = properties.filter((p) => p.status === 'published')

  const oldestPublished = [...publishedProperties]
    .sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : Infinity
      const bTime = b.created_at ? new Date(b.created_at).getTime() : Infinity
      return aTime - bTime
    })
    .slice(0, 6)

  const leadsCountByProperty = new Map<string, number>()
  for (const lead of leads) {
    if (!lead.property_id) continue
    leadsCountByProperty.set(
      lead.property_id,
      (leadsCountByProperty.get(lead.property_id) || 0) + 1
    )
  }

  const totalLeads = leads.length

  const topRequestedProperties = [...publishedProperties]
    .map((property) => ({
      property,
      leadsCount: leadsCountByProperty.get(property.id) || 0,
    }))
    .filter((item) => item.leadsCount > 0)
    .sort((a, b) => b.leadsCount - a.leadsCount)
    .slice(0, 6)

  const alertProperties = [...publishedProperties]
    .map((property) => {
      const ageDays = daysOnline(property.created_at)
      const alert = getAlertLevel(ageDays)

      return {
        property,
        ageDays,
        alert,
      }
    })
    .filter((item) => item.alert.order > 0)
    .sort((a, b) => b.alert.order - a.alert.order || (b.ageDays || 0) - (a.ageDays || 0))
    .slice(0, 8)

  const thinList = [...publishedProperties]
    .sort((a, b) => {
      const aDays = daysOnline(a.created_at) || 0
      const bDays = daysOnline(b.created_at) || 0
      return bDays - aDays
    })
    .slice(0, 12)
    .map((property) => {
      const leadsCount = leadsCountByProperty.get(property.id) || 0
      const ageDays = daysOnline(property.created_at)

      return {
        property,
        ageDays,
        leadsCount,
      }
    })

  const alertSummary =
    alertProperties.length === 0
      ? 'Nessun immobile pubblicato supera per ora le soglie di attenzione principali.'
      : `${alertProperties.length} immobili pubblicati meritano attenzione commerciale: conviene valutare aggiornamento scheda, verifica prezzo o ricontatto proprietario.`

  return (
    <section className="text-[var(--site-text)]">
      <p className="theme-admin-faint text-sm uppercase tracking-[0.2em]">
        Dashboard
      </p>

      <h2 className="mt-2 text-3xl font-semibold text-[var(--site-text)]">
        Benvenuto nel gestionale
      </h2>

      <p className="theme-admin-muted mt-3 max-w-2xl">
        Da qui controlli il portafoglio immobili, l’invecchiamento annunci e le richieste ricevute dal sito.
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

      <div className="mt-8 grid gap-4 md:grid-cols-4">
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

        <div className="theme-admin-card rounded-3xl p-6">
          <p className="theme-admin-muted text-sm">Richieste dal sito</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--site-text)]">{totalLeads}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <div className="theme-admin-card rounded-3xl p-6">
          <div>
            <p className="theme-admin-faint text-xs uppercase tracking-[0.2em]">
              Più tempo online
            </p>
            <h3 className="mt-2 text-xl font-semibold text-[var(--site-text)]">
              Immobili attivi da più tempo
            </h3>
          </div>

          <div className="mt-5 space-y-3">
            {oldestPublished.length === 0 ? (
              <div className="theme-admin-chip rounded-2xl px-4 py-4 text-sm">
                Nessun immobile pubblicato disponibile.
              </div>
            ) : (
              oldestPublished.map((property) => {
                const ageDays = daysOnline(property.created_at)

                return (
                  <div
                    key={property.id}
                    className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-2)] px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-[var(--site-text)]">
                          {property.title || 'Immobile senza titolo'}
                        </p>
                        <p className="mt-1 text-xs text-[var(--site-text-muted)]">
                          {property.comune || '—'} {property.province ? `(${property.province})` : ''}
                        </p>
                      </div>

                      <span className="theme-admin-chip rounded-full px-3 py-1 text-xs">
                        {humanAge(ageDays)}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div className="theme-admin-card rounded-3xl p-6">
          <div>
            <p className="theme-admin-faint text-xs uppercase tracking-[0.2em]">
              Interesse utenti
            </p>
            <h3 className="mt-2 text-xl font-semibold text-[var(--site-text)]">
              Immobili con più richieste
            </h3>
          </div>

          <div className="mt-5 space-y-3">
            {topRequestedProperties.length === 0 ? (
              <div className="theme-admin-chip rounded-2xl px-4 py-4 text-sm">
                Nessuna richiesta collegata agli immobili per ora.
              </div>
            ) : (
              topRequestedProperties.map(({ property, leadsCount }) => (
                <div
                  key={property.id}
                  className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-[var(--site-text)]">
                        {property.title || 'Immobile senza titolo'}
                      </p>
                      <p className="mt-1 text-xs text-[var(--site-text-muted)]">
                        {property.comune || '—'} {property.province ? `(${property.province})` : ''}
                      </p>
                    </div>

                    <span className="rounded-full border border-emerald-300/20 px-3 py-1 text-xs text-emerald-200">
                      {leadsCount} richieste
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 theme-admin-card rounded-3xl p-6">
        <p className="theme-admin-faint text-xs uppercase tracking-[0.2em]">
          Alert IA
        </p>

        <h3 className="mt-2 text-xl font-semibold text-[var(--site-text)]">
          Proprietari da risentire
        </h3>

        <p className="mt-3 text-sm text-[var(--site-text-muted)]">
          {alertSummary}
        </p>

        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {alertProperties.length === 0 ? (
            <div className="theme-admin-chip rounded-2xl px-4 py-4 text-sm">
              Nessun alert prioritario.
            </div>
          ) : (
            alertProperties.map(({ property, ageDays, alert }) => (
              <div
                key={property.id}
                className={`rounded-2xl border px-4 py-4 ${alert.className}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-[var(--site-text)]">
                      {property.title || 'Immobile senza titolo'}
                    </p>
                    <p className="mt-1 text-xs text-[var(--site-text-muted)]">
                      Online da {humanAge(ageDays)} · {formatPrice(property.price)}
                    </p>
                  </div>

                  <span className="rounded-full border border-current/20 px-3 py-1 text-xs">
                    {alert.label}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-8 theme-admin-card rounded-3xl p-6">
        <p className="theme-admin-faint text-xs uppercase tracking-[0.2em]">
          Lista rapida
        </p>

        <h3 className="mt-2 text-xl font-semibold text-[var(--site-text)]">
          Giorni online e richieste per immobile
        </h3>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-2">
            <thead>
              <tr>
                <th className="px-3 py-2 text-left text-xs uppercase tracking-[0.18em] text-[var(--site-text-faint)]">
                  Immobile
                </th>
                <th className="px-3 py-2 text-left text-xs uppercase tracking-[0.18em] text-[var(--site-text-faint)]">
                  Prezzo
                </th>
                <th className="px-3 py-2 text-left text-xs uppercase tracking-[0.18em] text-[var(--site-text-faint)]">
                  Online da
                </th>
                <th className="px-3 py-2 text-left text-xs uppercase tracking-[0.18em] text-[var(--site-text-faint)]">
                  Richieste sito
                </th>
              </tr>
            </thead>

            <tbody>
              {thinList.map(({ property, ageDays, leadsCount }) => (
                <tr key={property.id} className="rounded-2xl bg-[var(--site-surface-2)]">
                  <td className="rounded-l-2xl px-3 py-3 text-sm text-[var(--site-text)]">
                    {property.title || 'Immobile senza titolo'}
                  </td>

                  <td className="px-3 py-3 text-sm text-[var(--site-text-soft)]">
                    {formatPrice(property.price)}
                  </td>

                  <td className="px-3 py-3 text-sm text-[var(--site-text-soft)]">
                    {humanAge(ageDays)}
                  </td>

                  <td className="rounded-r-2xl px-3 py-3 text-sm text-[var(--site-text-soft)]">
                    {leadsCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {leadsError && (
          <p className="mt-4 text-xs text-[var(--site-text-faint)]">
            Nota: non sono riuscito a leggere la tabella leads.
          </p>
        )}
      </div>
    </section>
  )
}