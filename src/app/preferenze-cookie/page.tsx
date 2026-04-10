'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import SiteHeader from '@/components/public/SiteHeader'
import Footer from '@/components/public/Footer'
import FooterReveal from '@/components/public/FooterReveal'
import {
  getDefaultCookiePreferences,
  readCookiePreferences,
  saveCookiePreferences,
} from '@/lib/cookie-consent'

export default function CookiePreferencesPage() {
  const [analytics, setAnalytics] = useState(false)
  const [marketing, setMarketing] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const current = readCookiePreferences()
    if (!current) return

    setAnalytics(current.analytics)
    setMarketing(current.marketing)
  }, [])

  const savePreferences = () => {
    saveCookiePreferences({
      necessary: true,
      analytics,
      marketing,
      updatedAt: new Date().toISOString(),
      status: 'custom',
    })
    setSaved(true)
  }

  const rejectAll = () => {
    saveCookiePreferences(getDefaultCookiePreferences())
    setAnalytics(false)
    setMarketing(false)
    setSaved(true)
  }

  return (
    <main className="min-h-screen bg-[#050b16] text-white">
      <SiteHeader />

      <section className="mx-auto max-w-4xl px-6 py-16">
        <p className="text-sm uppercase tracking-[0.3em] text-white/40">
          Preferenze
        </p>
        <h1 className="mt-3 text-4xl font-semibold">Preferenze cookie</h1>

        <div className="mt-10 grid gap-5">
          <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6">
            <h2 className="text-xl font-semibold">Cookie tecnici</h2>
            <p className="mt-3 text-white/68">
              Sempre attivi. Necessari al funzionamento del sito.
            </p>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6">
            <h2 className="text-xl font-semibold">Cookie analitici</h2>
            <p className="mt-3 text-white/68">
              Attivabili solo su tua scelta.
            </p>
            <label className="mt-4 flex items-center gap-3 text-white">
              <input
                type="checkbox"
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
              />
              Attiva cookie analitici
            </label>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6">
            <h2 className="text-xl font-semibold">Cookie marketing</h2>
            <p className="mt-3 text-white/68">
              Attivabili solo su tua scelta.
            </p>
            <label className="mt-4 flex items-center gap-3 text-white">
              <input
                type="checkbox"
                checked={marketing}
                onChange={(e) => setMarketing(e.target.checked)}
              />
              Attiva cookie marketing
            </label>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={savePreferences}
            className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90"
          >
            Salva preferenze
          </button>

          <button
            type="button"
            onClick={rejectAll}
            className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-white transition hover:bg-white/10"
          >
            Rifiuta i cookie facoltativi
          </button>

          <Link
            href="/cookie"
            className="rounded-2xl border border-white/10 bg-transparent px-5 py-3 text-sm text-white/80 transition hover:bg-white/5 hover:text-white"
          >
            Leggi la Cookie Policy
          </Link>
        </div>

        {saved && (
          <div className="mt-6 rounded-[20px] border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            Preferenze salvate correttamente.
          </div>
        )}
      </section>
      <FooterReveal>
        <Footer />
      </FooterReveal>
    </main>
  )
}