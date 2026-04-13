import Link from 'next/link'
import SiteHeader from '@/components/public/SiteHeader'
import Footer from '@/components/public/Footer'
import FooterReveal from '@/components/public/FooterReveal'

type Tone = 'positive' | 'negative' | 'neutral'

type PulseCard = {
  label: string
  value: string
  change: string
  tone: Tone
  updatedAt: string
}

type NewsItem = {
  title: string
  source: string
  publishedAt: string
  category: string
  impact: 'alto' | 'medio' | 'basso'
}

type StructuralMetric = {
  label: string
  value: string
  updatedAt: string
  note: string
}

function getMockData() {
  const pulseCards: PulseCard[] = [
    {
      label: 'FTSE MIB',
      value: '+0,84%',
      change: 'Sessione positiva, clima risk-on moderato',
      tone: 'positive',
      updatedAt: 'Agg. 5 min',
    },
    {
      label: 'Spread BTP-Bund',
      value: '128 bp',
      change: '-4 bp rispetto al rilevamento precedente',
      tone: 'positive',
      updatedAt: 'Agg. 5 min',
    },
    {
      label: 'Rendimento BTP 10Y',
      value: '3,61%',
      change: 'Lieve compressione dei rendimenti',
      tone: 'positive',
      updatedAt: 'Agg. 5 min',
    },
    {
      label: 'Costo del credito casa',
      value: 'Ancora selettivo',
      change: 'Il finanziamento continua a influenzare la domanda',
      tone: 'neutral',
      updatedAt: 'Ultimo dato ufficiale',
    },
  ]

  const structuralMetrics: StructuralMetric[] = [
    {
      label: 'Prezzi abitazioni',
      value: 'Tenuta moderata',
      updatedAt: 'Ultimo aggiornamento ufficiale',
      note: 'Pressione ancora sana sugli immobili ben posizionati.',
    },
    {
      label: 'Compravendite',
      value: 'Mercato selettivo',
      updatedAt: 'Ultimo aggiornamento ufficiale',
      note: 'La rotazione favorisce prodotto corretto e ben presentato.',
    },
    {
      label: 'Quotazioni residenziali',
      value: 'Stabili / differenziate',
      updatedAt: 'Ultimo aggiornamento ufficiale',
      note: 'La distanza tra zone e qualità immobiliari pesa più della media generale.',
    },
  ]

  const news: NewsItem[] = [
    {
      title:
        'Tassi e credito: il mercato residenziale continua a premiare immobili con pricing coerente',
      source: 'Desk mercato',
      publishedAt: 'Oggi',
      category: 'Credito',
      impact: 'alto',
    },
    {
      title:
        'Locazioni ancora forti nelle fasce più richieste: domanda viva e stock contenuto',
      source: 'Desk locazioni',
      publishedAt: 'Oggi',
      category: 'Affitti',
      impact: 'medio',
    },
    {
      title:
        'Il differenziale tra immobili ben presentati e stock generico incide sempre di più sui tempi',
      source: 'Desk operatività',
      publishedAt: 'Oggi',
      category: 'Vendita',
      impact: 'alto',
    },
    {
      title:
        'Mercato più selettivo: cresce il peso della valutazione iniziale e della documentazione pulita',
      source: 'Desk immobiliare',
      publishedAt: 'Oggi',
      category: 'Scenario',
      impact: 'medio',
    },
  ]

  const intradayBrief =
    'Il quadro intraday resta favorevole a una lettura costruttiva ma non euforica: il contesto di mercato appare più disteso rispetto alle fasi di maggiore tensione, mentre il credito continua a rimanere un filtro reale per la domanda immobiliare finanziata. In pratica, il sentiment aiuta, ma nel mattone continuano a performare soprattutto gli immobili con prezzo corretto, buona liquidità e presentazione pulita.'

  const structuralBrief =
    'Sul piano strutturale il mercato non premia più la sola presenza online dell’immobile. La differenza la fanno coerenza del prezzo, qualità del posizionamento e leggibilità della scheda. Dove il prodotto è corretto, la tenuta resta buona; dove il pricing parte troppo alto, il tempo lavora contro il venditore e indebolisce la trattativa.'

  const marketSeries = {
    ftseMib: [100, 101.4, 100.8, 101.9, 102.6, 102.3, 103.1, 103.8],
    spread: [142, 140, 139, 137, 134, 132, 130, 128],
    housingMood: [100, 100.2, 100.4, 100.7, 100.9, 101, 101.2, 101.3],
  }

  return {
    pulseCards,
    structuralMetrics,
    news,
    intradayBrief,
    structuralBrief,
    marketSeries,
  }
}

function toneClasses(tone: Tone) {
  if (tone === 'positive') {
    return 'text-emerald-300 border-emerald-400/20 bg-emerald-500/10'
  }

  if (tone === 'negative') {
    return 'text-red-300 border-red-400/20 bg-red-500/10'
  }

  return 'text-white/70 border-white/10 bg-white/[0.05]'
}

function impactClasses(impact: NewsItem['impact']) {
  if (impact === 'alto') {
    return 'border-red-400/20 bg-red-500/10 text-red-200'
  }

  if (impact === 'medio') {
    return 'border-amber-400/20 bg-amber-500/10 text-amber-200'
  }

  return 'border-white/10 bg-white/[0.04] text-white/70'
}

function MiniLineChart({
  values,
  lineClassName = 'stroke-white',
  areaClassName = 'fill-white/10',
}: {
  values: number[]
  lineClassName?: string
  areaClassName?: string
}) {
  const width = 100
  const height = 48
  const padding = 6

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const points = values.map((value, index) => {
    const x = padding + (index * (width - padding * 2)) / Math.max(values.length - 1, 1)
    const y =
      height - padding - ((value - min) / range) * (height - padding * 2)
    return { x, y }
  })

  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ')

  const areaPath = `
    ${linePath}
    L ${points[points.length - 1].x} ${height - padding}
    L ${points[0].x} ${height - padding}
    Z
  `

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-16 w-full">
      <path d={areaPath} className={areaClassName} />
      <path
        d={linePath}
        className={lineClassName}
        fill="none"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function PulseCardItem({ item }: { item: PulseCard }) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.26)]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] uppercase tracking-[0.24em] text-white/35">
          {item.label}
        </p>
        <span className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] ${toneClasses(item.tone)}`}>
          {item.updatedAt}
        </span>
      </div>

      <p className="mt-4 text-3xl font-semibold text-white">{item.value}</p>
      <p className="mt-3 text-sm leading-7 text-white/68">{item.change}</p>
    </div>
  )
}

function ChartPanel({
  eyebrow,
  title,
  text,
  values,
  lineClassName,
  areaClassName,
}: {
  eyebrow: string
  title: string
  text: string
  values: number[]
  lineClassName?: string
  areaClassName?: string
}) {
  return (
    <div className="rounded-[30px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.26)]">
      <p className="text-[11px] uppercase tracking-[0.24em] text-white/35">
        {eyebrow}
      </p>

      <h3 className="mt-3 text-2xl font-semibold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-white/62">{text}</p>

      <div className="mt-6 rounded-[24px] border border-white/8 bg-black/35 px-4 py-5">
        <MiniLineChart
          values={values}
          lineClassName={lineClassName}
          areaClassName={areaClassName}
        />
      </div>
    </div>
  )
}

export default function MercatoDelMattonePage() {
  const {
    pulseCards,
    structuralMetrics,
    news,
    intradayBrief,
    structuralBrief,
    marketSeries,
  } = getMockData()

  return (
    <main className="min-h-screen bg-[#010409] text-white">
      <div className="bg-[#010409]">
        <SiteHeader />
      </div>

      <section className="border-b border-white/10 bg-[#03060c]">
        <div className="mx-auto max-w-7xl px-6 py-16 xl:px-10 2xl:px-14">
          <p className="text-sm uppercase tracking-[0.32em] text-white/35">
            Mercato del mattone
          </p>

          <div className="mt-6 grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
            <div>
              <h1 className="max-w-5xl text-4xl font-semibold leading-tight md:text-6xl">
                Mercati, credito, mattone e segnali utili
                <br />
                letti in modo serio.
              </h1>

              <p className="mt-6 max-w-3xl text-base leading-8 text-white/68 md:text-lg">
                Una pagina pensata per osservare il contesto finanziario che può
                influenzare il real estate, i segnali strutturali del mercato
                immobiliare e una lettura automatica utile a chi ragiona da
                professionista, non da spettatore.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/immobili"
                  className="rounded-2xl bg-white px-6 py-3.5 text-sm font-semibold text-black transition hover:opacity-90"
                >
                  Esplora immobili
                </Link>

                <Link
                  href="/contatti"
                  className="rounded-2xl border border-white/16 bg-white/[0.04] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
                >
                  Contatta l’agenzia
                </Link>
              </div>
            </div>

            <div className="rounded-[34px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] uppercase tracking-[0.26em] text-white/35">
                  Brief IA intraday
                </p>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-white/60">
                  Refresh orario
                </span>
              </div>

              <h2 className="mt-4 text-2xl font-semibold text-white">
                Lettura sintetica di contesto
              </h2>

              <p className="mt-4 text-sm leading-8 text-white/72">
                {intradayBrief}
              </p>

              <div className="mt-6 grid gap-3">
                <div className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/35">
                    Focus del momento
                  </p>
                  <p className="mt-2 text-sm text-white/72">
                    Il mercato continua a distinguere sempre di più tra prodotto
                    corretto e prodotto semplicemente esposto.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/35">
                    Impatto potenziale
                  </p>
                  <p className="mt-2 text-sm text-white/72">
                    Clima macro più disteso, ma il credito resta una variabile
                    che seleziona ancora la domanda reale.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {pulseCards.map((item) => (
              <PulseCardItem key={item.label} item={item} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 xl:px-10 2xl:px-14">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-white/35">
              Grafici di contesto
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-white md:text-4xl">
              Segnali finanziari che possono toccare il mattone
            </h2>
          </div>

          <span className="hidden rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-white/60 md:inline-flex">
            Update mercati: 5 min
          </span>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <ChartPanel
            eyebrow="Azionario"
            title="Mood borsa"
            text="L’azionario non sposta da solo il mercato immobiliare, ma aiuta a leggere il clima generale di rischio e fiducia."
            values={marketSeries.ftseMib}
            lineClassName="stroke-emerald-300"
            areaClassName="fill-emerald-400/10"
          />

          <ChartPanel
            eyebrow="Obbligazionario"
            title="Stress spread"
            text="Spread e rendimenti influenzano il contesto del credito, la percezione del rischio e il costo del denaro."
            values={marketSeries.spread}
            lineClassName="stroke-white"
            areaClassName="fill-white/10"
          />

          <ChartPanel
            eyebrow="Scenario immobiliare"
            title="Tenuta mercato casa"
            text="Indicatore sintetico di scenario: non è quotazione diretta, ma una lettura visiva del tono complessivo del comparto."
            values={marketSeries.housingMood}
            lineClassName="stroke-sky-300"
            areaClassName="fill-sky-400/10"
          />
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#03060c]">
        <div className="mx-auto max-w-7xl px-6 py-16 xl:px-10 2xl:px-14">
          <div className="grid gap-8 xl:grid-cols-[1fr_0.95fr]">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-white/35">
                Mercato immobiliare ufficiale
              </p>

              <h2 className="mt-4 text-3xl font-semibold text-white md:text-4xl">
                Lettura strutturale del comparto
              </h2>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {structuralMetrics.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5"
                  >
                    <p className="text-[11px] uppercase tracking-[0.22em] text-white/35">
                      {item.label}
                    </p>
                    <p className="mt-3 text-2xl font-semibold text-white">
                      {item.value}
                    </p>
                    <p className="mt-3 text-sm leading-7 text-white/62">
                      {item.note}
                    </p>
                    <p className="mt-4 text-[11px] uppercase tracking-[0.18em] text-white/35">
                      {item.updatedAt}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[34px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] uppercase tracking-[0.26em] text-white/35">
                  Brief IA strutturale
                </p>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-white/60">
                  Al cambio dati ufficiali
                </span>
              </div>

              <h3 className="mt-4 text-2xl font-semibold text-white">
                Quadro di mercato non rumoroso
              </h3>

              <p className="mt-4 text-sm leading-8 text-white/72">
                {structuralBrief}
              </p>

              <div className="mt-6 rounded-2xl border border-white/10 bg-black/35 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-white/35">
                  Lettura operativa
                </p>
                <p className="mt-2 text-sm leading-7 text-white/72">
                  In uno scenario selettivo, il valore iniziale attribuito
                  all’immobile conta più della sola esposizione online.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 xl:px-10 2xl:px-14">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-white/35">
              News rilevanti
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-white md:text-4xl">
              Notizie che possono toccare il mercato del mattone
            </h2>
          </div>

          <span className="hidden rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-white/60 md:inline-flex">
            Refresh giornaliero / orario
          </span>
        </div>

        <div className="grid gap-4">
          {news.map((item) => (
            <article
              key={item.title}
              className="rounded-[26px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_16px_44px_rgba(0,0,0,0.2)]"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-white/65">
                  {item.category}
                </span>

                <span className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] ${impactClasses(item.impact)}`}>
                  Impatto {item.impact}
                </span>

                <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-white/45">
                  {item.source}
                </span>

                <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-white/45">
                  {item.publishedAt}
                </span>
              </div>

              <h3 className="mt-4 text-xl font-semibold text-white">
                {item.title}
              </h3>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16 xl:px-10 2xl:px-14">
        <div className="rounded-[34px] border border-white/10 bg-white/[0.04] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
          <p className="text-sm uppercase tracking-[0.28em] text-white/35">
            Nota di metodo
          </p>
          <p className="mt-5 max-w-4xl text-sm leading-8 text-white/66 md:text-base">
            Questa pagina è pensata per unire contesto finanziario, lettura
            immobiliare e sintesi automatica. I blocchi intraday e quelli
            strutturali possono avere frequenze di aggiornamento diverse, per
            evitare di confondere il rumore di giornata con i segnali reali del
            mercato.
          </p>
        </div>
      </section>

      <FooterReveal>
        <Footer />
      </FooterReveal>
    </main>
  )
}