'use client'

import Link from 'next/link'

export default function HomeSearchBoxMobile() {
  return (
    <section className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl">
      <p className="text-xs uppercase tracking-[0.28em] text-white/40">
        Area Immobiliare
      </p>

      <h2 className="mt-3 text-3xl font-semibold">Trova il tuo spazio</h2>

      <p className="mt-3 text-sm leading-7 text-white/60">
        Un accesso rapido alle sezioni principali del sito, pensato per una navigazione
        più chiara da mobile.
      </p>

      <div className="mt-6 space-y-3">
        <Link
          href="/immobili"
          className="flex w-full items-center justify-center rounded-[18px] bg-white px-5 py-3.5 text-sm font-semibold text-black transition hover:opacity-90"
        >
          Esplora gli Immobili
        </Link>

        <div className="rounded-[18px] border border-white/10 bg-black/20 px-4 py-4 text-center">
          <p className="text-sm leading-7 text-white/72">
            Sei proprietario di un immobile e vuoi venderlo o affittarlo?
          </p>

          <Link
            href="/contatti"
            className="mt-3 inline-flex items-center justify-center rounded-[16px] border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
          >
            Contattaci qui
          </Link>
        </div>

        <Link
          href="/chi-siamo"
          className="flex w-full items-center justify-center rounded-[18px] border border-white/10 bg-white/5 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          Scopri Area Immobiliare
        </Link>
      </div>
    </section>
  )
}