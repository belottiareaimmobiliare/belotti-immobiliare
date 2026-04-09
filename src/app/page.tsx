import SiteHeader from '@/components/public/SiteHeader'
import HomeHero from '@/components/public/HomeHero'
import HomeSearchBoxDesktop from '@/components/public/HomeSearchBoxDesktop'
import HomeSearchBoxMobile from '@/components/public/HomeSearchBoxMobile'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0a0f1a] text-white">
      <SiteHeader />

      <HomeHero />

      <section className="relative z-20 bg-[rgba(8,18,34,0.72)]">
        <div className="mx-auto max-w-7xl px-6 pt-8 pb-20 md:pt-10 md:pb-24">
          <div className="md:sticky md:top-[84px] md:z-30">
            <div className="rounded-[34px] border border-white/10 bg-[rgba(58,70,94,0.72)] backdrop-blur-2xl shadow-[0_30px_90px_rgba(0,0,0,0.32)]">
              <div className="p-0">
                <div className="hidden md:block">
                  <HomeSearchBoxDesktop />
                </div>

                <div className="md:hidden">
                  <HomeSearchBoxMobile />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 md:mt-10 md:pt-[24vh]">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
                <p className="text-xs uppercase tracking-[0.24em] text-white/35">
                  Valutazione
                </p>
                <h2 className="mt-3 text-2xl font-semibold">
                  Il prezzo corretto conta davvero
                </h2>
                <p className="mt-4 text-sm leading-7 text-white/65">
                  Una scelta immobiliare richiede attenzione al mercato, equilibrio
                  e capacità di leggere il valore reale di un immobile.
                </p>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
                <p className="text-xs uppercase tracking-[0.24em] text-white/35">
                  Verifica
                </p>
                <h2 className="mt-3 text-2xl font-semibold">
                  Ogni immobile va controllato bene
                </h2>
                <p className="mt-4 text-sm leading-7 text-white/65">
                  Provenienze, conformità e aspetti documentali meritano un esame
                  serio, prima di ogni decisione importante.
                </p>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
                <p className="text-xs uppercase tracking-[0.24em] text-white/35">
                  Territorio
                </p>
                <h2 className="mt-3 text-2xl font-semibold">
                  Bergamo letta con esperienza
                </h2>
                <p className="mt-4 text-sm leading-7 text-white/65">
                  Città Alta, Città Bassa, Colli e hinterland vengono interpretati
                  con una sensibilità maturata in anni di lavoro sul territorio.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}