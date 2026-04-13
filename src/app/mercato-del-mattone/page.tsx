import Link from 'next/link'
import SiteHeader from '@/components/public/SiteHeader'
import Footer from '@/components/public/Footer'
import FooterReveal from '@/components/public/FooterReveal'

type MetricCardProps = {
  label: string
  value: string
  delta: string
  tone?: 'up' | 'down' | 'neutral'
}

type ChartCardProps = {
  eyebrow: string
  title: string
  subtitle: string
  values: number[]
  footerLeft: string
  footerRight: string
}

function MetricCard({
  label,
  value,
  delta,
  tone = 'neutral',
}: MetricCardProps) {
  const toneClass =
    tone === 'up'
      ? 'text-emerald-300'
      : tone === 'down'
        ? 'text-red-300'
        : 'text-white/65'

  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.24)]">
      <p className="text-[11px] uppercase tracking-[0.24em] text-white/40">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
      <p className={`mt-2 text-sm ${toneClass}`}>{delta}</p>
    </div>
  )
}

function MiniLineChart({ values }: { values: number[] }) {
  const width = 100
  const height = 44
  const padding = 4

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

function ChartCard({
  eyebrow,
  title,
  subtitle,
  values,
  footerLeft,
  footerRight,
}: ChartCardProps) {
  return (
    <div className="rounded-[30px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.24)]">
      <p className="text-[11px] uppercase tracking-[0.24em] text-white/35">
        {eyebrow}
      </p>
      <h3 className="mt-3 text-2xl font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-white/62">{subtitle}</p>

      <div className="mt-6 rounded-[24px] border border-white/8 bg-black/30 px-4 py-5">
        <MiniLineChart values={values} />
      </div>

      <div className="mt-4 flex items-center justify-between text-xs uppercase tracking-[0.16em] text-white/40">
        <span>{footerLeft}</span>
        <span>{footerRight}</span>
      </div>
    </div>
  )
}

function InsightBullet({
  title,
  text,
}: {
  title: string
  text: string
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.035] p-5">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-3 text-sm leading-7 text-white/62">{text}</p>
    </div>
  )
}

export default function MercatoDelMattonePage() {
  const publicPulse = [
    {
      label: 'Costo del credito',
      value: 'Mutui ancora selettivi',
      delta: 'Il costo del denaro resta un filtro forte per la domanda finanziata.',
      tone: 'neutral' as const,
    },
    {
      label: 'Pressione sui prezzi',
      value: 'Tenuta su stock buono',
      delta: 'Gli immobili ben posizionati difendono meglio il prezzo.',
      tone: 'up' as const,
    },
    {
      label: 'Domanda reale',
      value: 'Più prudente',
      delta: 'I tempi decisionali si allungano rispetto alle fasi più calde.',
      tone: 'down' as const,
    },
    {
      label: 'Locazioni',
      value: 'Segmento vivace',
      delta: 'L’affitto continua a intercettare una parte rilevante della domanda.',
      tone: 'up' as const,
    },
  ]

  const charts = [
    {
      eyebrow: 'Credito',
      title: 'Sensibilità ai tassi',
      subtitle:
        'Quando il credito pesa, il mercato premia di più gli immobili correttamente valutati e con documentazione chiara.',
      values: [4.8, 4.6, 4.5, 4.3, 4.2, 4.1, 4.0, 4.1],
      footerLeft: '8 rilevazioni',
      footerRight: 'Scenario prudente',
    },
    {
      eyebrow: 'Prezzi',
      title: 'Tenuta delle abitazioni',
      subtitle:
        'Le fasce con stock limitato e domanda più sana mostrano maggiore resistenza rispetto al prodotto generico.',
      values: [100, 100.4, 100.8, 101.1, 101.4, 101.2, 101.7, 102.1],
      footerLeft: 'Base 100',
      footerRight: 'Trend stabile',
    },
    {
      eyebrow: 'Compravendite',
      title: 'Velocità del mercato',
      subtitle:
        'Non conta solo il numero di scambi: conta la qualità della domanda e la distanza tra prezzo richiesto e percezione del mercato.',
      values: [92, 96, 89, 94, 101, 97, 103, 99],
      footerLeft: 'Indice sintetico',
      footerRight: 'Rotazione selettiva',
    },
  ]

  return (
    <main className="min-h-screen bg-[#010409] text-white">
      <SiteHeader />

      <section className="border-b border-white/10 bg-[#05080f]">
        <div className="mx-auto max-w-7xl px-6 py-16 xl:px-10 2xl:px-14">
          <p className="text-sm uppercase tracking-[0.3em] text-white/35">
            Mercato del mattone
          </p>

          <div className="mt-6 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <h1 className="max-w-4xl text-4xl font-semibold leading-tight md:text-6xl">
                Lettura operativa del mercato immobiliare,
                <br />
                senza rumore inutile.
              </h1>

              <p className="mt-6 max-w-3xl text-base leading-8 text-white/68 md:text-lg">
                Una pagina pensata per offrire una visione chiara: credito,
                domanda, pressione sui prezzi, velocità del mercato e segnali
                utili per capire come si sta muovendo il comparto immobiliare.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/immobili"
                  className="rounded-2xl bg-white px-6 py-3.5 text-sm font-semibold text-black transition hover:opacity-90"
                >
                  Esplora gli immobili
                </Link>

                <Link
                  href="/contatti"
                  className="rounded-2xl border border-white/16 bg-white/[0.04] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
                >
                  Chiedi una valutazione
                </Link>
              </div>
            </div>

            <div className="rounded-[34px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
              <p className="text-[11px] uppercase tracking-[0.26em] text-white/35">
                Lettura automatica
              </p>
              <h2 className="mt-4 text-2xl font-semibold text-white">
                Sintesi professionale
              </h2>
              <p className="mt-4 text-sm leading-8 text-white/70">
                Il quadro attuale resta selettivo: il credito continua a
                influenzare la domanda finanziata, mentre gli immobili con buon
                posizionamento, documentazione chiara e prezzo coerente difendono
                meglio tempi e valore. Sul fronte locazioni la tensione resta
                più viva, soprattutto nelle fasce più accessibili. In questo
                scenario il mercato non premia l’improvvisazione: premia
                qualità, corretto pricing e capacità di lettura del territorio.
              </p>

              <div className="mt-6 grid gap-3">
                <div className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/35">
                    Focus operativo
                  </p>
                  <p className="mt-2 text-sm text-white/74">
                    Oggi conta più la qualità del posizionamento iniziale che la
                    semplice esposizione dell’annuncio.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/35">
                    Attenzione
                  </p>
                  <p className="mt-2 text-sm text-white/74">
                    Prezzi fuori mercato tendono ad allungare il tempo di
                    permanenza e a indebolire la trattativa.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {publicPulse.map((item) => (
              <MetricCard
                key={item.label}
                label={item.label}
                value={item.value}
                delta={item.delta}
                tone={item.tone}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 xl:px-10 2xl:px-14">
        <div className="grid gap-6 xl:grid-cols-3">
          {charts.map((chart) => (
            <ChartCard
              key={chart.title}
              eyebrow={chart.eyebrow}
              title={chart.title}
              subtitle={chart.subtitle}
              values={chart.values}
              footerLeft={chart.footerLeft}
              footerRight={chart.footerRight}
            />
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#05080f]">
        <div className="mx-auto max-w-7xl px-6 py-16 xl:px-10 2xl:px-14">
          <p className="text-sm uppercase tracking-[0.28em] text-white/35">
            Cosa guarda davvero un agente
          </p>

          <h2 className="mt-4 text-3xl font-semibold text-white md:text-4xl">
            I segnali che contano nel lavoro quotidiano
          </h2>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            <InsightBullet
              title="Prezzo e velocità devono stare insieme"
              text="Non basta pubblicare: bisogna capire se il prezzo consente davvero al mercato di reagire."
            />
            <InsightBullet
              title="Il credito non frena tutti allo stesso modo"
              text="Le fasce più finanziate sentono di più i tassi; segmenti diversi reagiscono con tempi e margini differenti."
            />
            <InsightBullet
              title="L’affitto resta una valvola importante"
              text="Quando l’acquisto rallenta, la locazione intercetta parte della domanda e torna centrale nella lettura del mercato."
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 xl:px-10 2xl:px-14">
        <div className="rounded-[34px] border border-white/10 bg-white/[0.04] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
          <p className="text-sm uppercase tracking-[0.26em] text-white/35">
            Nota importante
          </p>
          <p className="mt-5 max-w-4xl text-sm leading-8 text-white/68 md:text-base">
            Questa pagina è una lettura sintetica e informativa del mercato. Non
            costituisce consulenza finanziaria o previsione certa, ma un quadro
            ragionato dei principali segnali che possono aiutare nella lettura
            immobiliare.
          </p>
        </div>
      </section>

      <FooterReveal>
        <Footer />
      </FooterReveal>
    </main>
  )
}