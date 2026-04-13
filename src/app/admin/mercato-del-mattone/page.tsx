import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

type Property = {
  id: string
  title: string | null
  price: number | null
  status: string | null
  contract_type: string | null
  comune: string | null
  province: string | null
  created_at: string | null
  updated_at: string | null
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(date: Date) {
  return date.toLocaleDateString('it-IT', { month: 'short' })
}

function MiniLineChart({ values }: { values: number[] }) {
  const width = 100
  const height = 44
  const padding = 4

  if (values.length === 0) {
    return <div className="h-12" />
  }

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const points = values
    .map((value, index) => {
      const x =
        padding + (index * (width - padding * 2)) / Math.max(values.length - 1, 1)
      const y =
        height -
        padding -
        ((value - min) / range) * (height - padding * 2)

      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-12 w-full overflow-visible"
      aria-hidden="true"
    >
      <line x1="0" y1="36" x2={width} y2="36" className="stroke-white/10" />
      <line x1="0" y1="22" x2={width} y2="22" className="stroke-white/10" />
      <line x1="0" y1="8" x2={width} y2="8" className="stroke-white/10" />
      <polyline
        fill="none"
        points={points}
        className="stroke-white"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function MetricBox({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint: string
}) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.24)]">
      <p className="text-[11px] uppercase tracking-[0.22em] text-white/35">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm text-white/58">{hint}</p>
    </div>
  )
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-[30px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.24)]">
      <h2 className="text-2xl font-semibold text-white">{title}</h2>
      {subtitle ? (
        <p className="mt-2 text-sm leading-7 text-white/60">{subtitle}</p>
      ) : null}
      <div className="mt-6">{children}</div>
    </section>
  )
}

export default async function AdminMercatoDelMattonePage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('properties')
    .select(
      'id, title, price, status, contract_type, comune, province, created_at, updated_at'
    )
    .order('created_at', { ascending: false })

  const properties = (data || []) as Property[]
  const now = new Date()
  const days14 = 14 * 24 * 60 * 60 * 1000
  const days60 = 60 * 24 * 60 * 60 * 1000

  const total = properties.length
  const published = properties.filter((item) => item.status === 'published').length
  const draft = properties.filter((item) => item.status === 'draft').length
  const sale = properties.filter((item) => item.contract_type === 'vendita').length
  const rent = properties.filter((item) => item.contract_type === 'affitto').length

  const pricedPublished = properties.filter(
    (item) => item.status === 'published' && typeof item.price === 'number'
  )
  const avgPublishedPrice =
    pricedPublished.length > 0
      ? Math.round(
          pricedPublished.reduce((sum, item) => sum + Number(item.price || 0), 0) /
            pricedPublished.length
        )
      : 0

  const recentAdded = properties.filter((item) => {
    if (!item.created_at) return false
    return now.getTime() - new Date(item.created_at).getTime() <= days14
  }).length

  const stalePublished = properties.filter((item) => {
    if (item.status !== 'published' || !item.updated_at) return false
    return now.getTime() - new Date(item.updated_at).getTime() > days60
  }).length

  const comuniMap = new Map<string, number>()
  properties.forEach((item) => {
    const key = item.comune?.trim()
    if (!key) return
    comuniMap.set(key, (comuniMap.get(key) || 0) + 1)
  })

  const topComuni = [...comuniMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)

  const months = Array.from({ length: 6 }, (_, index) => {
    const date = startOfMonth(new Date(now.getFullYear(), now.getMonth() - (5 - index), 1))
    return date
  })

  const monthlyCounts = months.map((monthDate) => {
    const key = monthKey(monthDate)
    return properties.filter((item) => {
      if (!item.created_at) return false
      return monthKey(new Date(item.created_at)) === key
    }).length
  })

  const publishedMonthlyCounts = months.map((monthDate) => {
    const key = monthKey(monthDate)
    return properties.filter((item) => {
      if (!item.created_at || item.status !== 'published') return false
      return monthKey(new Date(item.created_at)) === key
    }).length
  })

  const brokerSummary =
    stalePublished > Math.max(3, Math.round(published * 0.18))
      ? 'Lo stock pubblicato sta iniziando a sedimentare: conviene controllare pricing, ordine delle foto e qualità dei titoli sugli immobili meno freschi.'
      : recentAdded > Math.max(2, Math.round(total * 0.12))
        ? 'Il caricamento recente è vivace: è un buon momento per monitorare velocemente coerenza dei prezzi e completezza delle schede prima che si disperda attenzione.'
        : rent > sale * 0.55
          ? 'La quota affitti è rilevante rispetto alla vendita: può valere la pena leggere separatamente il posizionamento locazioni per evitare segnali misti.'
          : 'Il portafoglio è abbastanza ordinato: il focus ora va tenuto su rotazione, qualità delle schede e verifica degli immobili pubblicati da più tempo.'

  return (
    <main className="min-h-screen bg-[#010409] px-4 py-8 text-white md:px-6">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-white/35">
              Admin · mercato del mattone
            </p>
            <h1 className="mt-2 text-4xl font-semibold text-white">
              Osservatorio operativo
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/62">
              Cruscotto interno per leggere rapidamente stock, ritmo di
              pubblicazione, peso vendita/affitto e concentrazione territoriale.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/immobili"
              className="rounded-2xl border border-white/14 bg-white/[0.04] px-5 py-3 text-sm font-medium text-white transition hover:bg-white/[0.08]"
            >
              Vai agli immobili
            </Link>
            <Link
              href="/mercato-del-mattone"
              target="_blank"
              className="rounded-2xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:opacity-90"
            >
              Apri pagina pubblica
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <MetricBox
            label="Totale stock"
            value={String(total)}
            hint="Immobili presenti in archivio"
          />
          <MetricBox
            label="Pubblicati"
            value={String(published)}
            hint="Schede attualmente online"
          />
          <MetricBox
            label="Bozze"
            value={String(draft)}
            hint="Da completare o rivedere"
          />
          <MetricBox
            label="Vendita"
            value={String(sale)}
            hint="Portafoglio vendita"
          />
          <MetricBox
            label="Affitto"
            value={String(rent)}
            hint="Portafoglio locazioni"
          />
          <MetricBox
            label="Prezzo medio"
            value={avgPublishedPrice ? `€ ${avgPublishedPrice.toLocaleString('it-IT')}` : '—'}
            hint="Media immobili pubblicati con prezzo"
          />
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Panel
            title="Lettura automatica interna"
            subtitle="Sintesi operativa generata sui numeri attualmente presenti nel gestionale."
          >
            <div className="rounded-[24px] border border-white/10 bg-black/30 p-5">
              <p className="text-sm leading-8 text-white/74">{brokerSummary}</p>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-white/35">
                  Inserimenti ultimi 14 giorni
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">{recentAdded}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-white/35">
                  Pubblicati fermi oltre 60 giorni
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">{stalePublished}</p>
              </div>
            </div>
          </Panel>

          <Panel
            title="Alert rapidi"
            subtitle="Cose da guardare prima di aprire il gestionale completo."
          >
            <div className="grid gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
                <p className="text-sm font-semibold text-white">Stock invecchiato</p>
                <p className="mt-2 text-sm leading-7 text-white/62">
                  {stalePublished > 0
                    ? `${stalePublished} immobili pubblicati risultano poco mossi o non aggiornati da oltre 60 giorni.`
                    : 'Nessun segnale forte di stock fermo oltre soglia.'}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
                <p className="text-sm font-semibold text-white">Mix portafoglio</p>
                <p className="mt-2 text-sm leading-7 text-white/62">
                  Vendita: {sale} · Affitto: {rent}. Tenere separata la lettura dei
                  due segmenti aiuta a non mescolare segnali diversi.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
                <p className="text-sm font-semibold text-white">Concentrazione territorio</p>
                <p className="mt-2 text-sm leading-7 text-white/62">
                  Le zone più presenti vanno presidiate meglio in termini di pricing,
                  ordine vetrina e qualità descrittiva.
                </p>
              </div>
            </div>
          </Panel>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-3">
          <Panel
            title="Nuovi inserimenti"
            subtitle="Andamento ultimi 6 mesi."
          >
            <div className="rounded-[24px] border border-white/10 bg-black/30 px-4 py-5">
              <MiniLineChart values={monthlyCounts} />
            </div>

            <div className="mt-4 grid grid-cols-6 gap-2 text-center text-xs uppercase tracking-[0.14em] text-white/38">
              {months.map((month) => (
                <div key={month.toISOString()}>{monthLabel(month)}</div>
              ))}
            </div>
          </Panel>

          <Panel
            title="Pubblicazioni"
            subtitle="Immobili creati e già online."
          >
            <div className="rounded-[24px] border border-white/10 bg-black/30 px-4 py-5">
              <MiniLineChart values={publishedMonthlyCounts} />
            </div>

            <div className="mt-4 grid grid-cols-6 gap-2 text-center text-xs uppercase tracking-[0.14em] text-white/38">
              {months.map((month) => (
                <div key={month.toISOString()}>{monthLabel(month)}</div>
              ))}
            </div>
          </Panel>

          <Panel
            title="Distribuzione portafoglio"
            subtitle="Lettura immediata del peso relativo."
          >
            <div className="space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between text-sm text-white/65">
                  <span>Vendita</span>
                  <span>{sale}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-white/8">
                  <div
                    className="h-full rounded-full bg-white"
                    style={{
                      width: `${total > 0 ? (sale / total) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-sm text-white/65">
                  <span>Affitto</span>
                  <span>{rent}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-white/8">
                  <div
                    className="h-full rounded-full bg-white/70"
                    style={{
                      width: `${total > 0 ? (rent / total) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-sm text-white/65">
                  <span>Bozze</span>
                  <span>{draft}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-white/8">
                  <div
                    className="h-full rounded-full bg-white/40"
                    style={{
                      width: `${total > 0 ? (draft / total) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </Panel>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_0.9fr]">
          <Panel
            title="Comuni più presenti"
            subtitle="Dove il portafoglio è più concentrato."
          >
            <div className="space-y-3">
              {topComuni.length > 0 ? (
                topComuni.map(([comune, count]) => (
                  <div
                    key={comune}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
                  >
                    <span className="text-sm text-white">{comune}</span>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs uppercase tracking-[0.16em] text-white/72">
                      {count} immobili
                    </span>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-white/58">
                  Nessun dato territoriale disponibile.
                </div>
              )}
            </div>
          </Panel>

          <Panel
            title="Nota pratica"
            subtitle="Questa pagina non usa ancora fonti esterne automatiche."
          >
            <div className="rounded-[24px] border border-white/10 bg-black/30 p-5">
              <p className="text-sm leading-8 text-white/68">
                Questo osservatorio admin sta già leggendo i dati interni del
                gestionale. Nel passo successivo si possono collegare fonti
                esterne ufficiali per tassi, prezzi e volumi di mercato e
                affiancarle ai dati interni per una lettura più completa.
              </p>
            </div>
          </Panel>
        </div>
      </section>
    </main>
  )
}