'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  getDefaultCookiePreferences,
  readCookiePreferences,
  saveCookiePreferences,
  type CookiePreferences,
} from '@/lib/cookie-consent'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [analytics, setAnalytics] = useState(false)
  const [marketing, setMarketing] = useState(false)

  useEffect(() => {
    const existing = readCookiePreferences()
    if (!existing) {
      setVisible(true)
      return
    }

    setVisible(false)
  }, [])

  useEffect(() => {
    const handleOpenBanner = () => {
      const existing = readCookiePreferences()
      setAnalytics(existing?.analytics ?? false)
      setMarketing(existing?.marketing ?? false)
      setVisible(true)
      setShowSettings(true)
    }

    window.addEventListener('open-cookie-banner', handleOpenBanner)

    return () => {
      window.removeEventListener('open-cookie-banner', handleOpenBanner)
    }
  }, [])

  const draftPreferences = useMemo<CookiePreferences>(
    () => ({
      necessary: true,
      analytics,
      marketing,
      updatedAt: new Date().toISOString(),
      status: 'custom',
    }),
    [analytics, marketing]
  )

  const acceptAll = () => {
    saveCookiePreferences({
      necessary: true,
      analytics: true,
      marketing: true,
      updatedAt: new Date().toISOString(),
      status: 'accepted',
    })
    setVisible(false)
    setShowSettings(false)
    window.dispatchEvent(new Event('cookie-preferences-updated'))
  }

  const rejectOptional = () => {
    saveCookiePreferences(getDefaultCookiePreferences())
    setVisible(false)
    setShowSettings(false)
    window.dispatchEvent(new Event('cookie-preferences-updated'))
  }

  const saveCustom = () => {
    saveCookiePreferences(draftPreferences)
    setVisible(false)
    setShowSettings(false)
    window.dispatchEvent(new Event('cookie-preferences-updated'))
  }

  if (!visible) return null

  return (
    <div className="fixed inset-x-0 bottom-4 z-[120] px-4">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-[28px] border border-white/10 bg-[#07111d]/96 shadow-[0_24px_80px_rgba(0,0,0,0.42)] backdrop-blur-2xl">
        <div className="p-5 md:p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.28em] text-white/35">
                Cookie e privacy
              </p>
              <h3 className="mt-3 text-2xl font-semibold text-white">
                Gestisci le preferenze di navigazione
              </h3>
              <p className="mt-3 text-sm leading-7 text-white/68">
                Utilizziamo cookie tecnici necessari al funzionamento del sito.
                Eventuali cookie analitici o di marketing restano disattivati fino
                a tua scelta. Puoi leggere i dettagli nella{' '}
                <Link href="/privacy" className="text-white underline underline-offset-4">
                  Privacy Policy
                </Link>{' '}
                e nella{' '}
                <Link href="/cookie" className="text-white underline underline-offset-4">
                  Cookie Policy
                </Link>
                .
              </p>
            </div>

            <div className="flex shrink-0 flex-col gap-3 md:w-[260px]">
              <button
                type="button"
                onClick={acceptAll}
                className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90"
              >
                Accetta tutti
              </button>

              <button
                type="button"
                onClick={rejectOptional}
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-white transition hover:bg-white/10"
              >
                Continua senza accettare
              </button>

              <button
                type="button"
                onClick={() => setShowSettings((prev) => !prev)}
                className="rounded-2xl border border-white/10 bg-transparent px-5 py-3 text-sm text-white/80 transition hover:bg-white/5 hover:text-white"
              >
                Personalizza
              </button>
            </div>
          </div>

          {showSettings && (
            <div className="mt-6 rounded-[24px] border border-white/10 bg-white/[0.03] p-4 md:p-5">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
                  <p className="text-sm font-semibold text-white">Tecnici</p>
                  <p className="mt-2 text-sm leading-6 text-white/62">
                    Sempre attivi. Servono per il funzionamento del sito.
                  </p>
                  <div className="mt-4 inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-black">
                    Sempre attivi
                  </div>
                </div>

                <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
                  <p className="text-sm font-semibold text-white">Analitici</p>
                  <p className="mt-2 text-sm leading-6 text-white/62">
                    Misurazione del traffico e uso del sito, solo se attivati.
                  </p>
                  <label className="mt-4 flex cursor-pointer items-center gap-3 text-sm text-white">
                    <input
                      type="checkbox"
                      checked={analytics}
                      onChange={(e) => setAnalytics(e.target.checked)}
                    />
                    Attiva cookie analitici
                  </label>
                </div>

                <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
                  <p className="text-sm font-semibold text-white">Marketing</p>
                  <p className="mt-2 text-sm leading-6 text-white/62">
                    Profilazione o contenuti promozionali personalizzati, solo se attivati.
                  </p>
                  <label className="mt-4 flex cursor-pointer items-center gap-3 text-sm text-white">
                    <input
                      type="checkbox"
                      checked={marketing}
                      onChange={(e) => setMarketing(e.target.checked)}
                    />
                    Attiva cookie marketing
                  </label>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={saveCustom}
                  className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90"
                >
                  Salva preferenze
                </button>

                <Link
                  href="/preferenze-cookie"
                  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-white transition hover:bg-white/10"
                >
                  Rivedi preferenze
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}