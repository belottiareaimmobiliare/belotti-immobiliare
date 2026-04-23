'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, useTransition } from 'react'
import {
  HOME_CONTENT_KEY,
  defaultHomeContent,
  homeLimits,
  type HomeContent,
} from '@/lib/site-content'

type Props = {
  initialContent: HomeContent
}

type ThemeMode = 'light' | 'dark'

function getCounterClass(current: number, max: number) {
  if (current > max) return 'text-red-500'
  if (current > max * 0.85) return 'text-amber-500'
  return 'text-[var(--site-text-faint)]'
}

function FieldLabel({
  label,
  current,
  max,
}: {
  label: string
  current: number
  max: number
}) {
  return (
    <div className="mb-2 flex items-center justify-between gap-3">
      <label className="text-sm font-medium text-[var(--site-text)]">
        {label}
      </label>
      <span className={`text-xs ${getCounterClass(current, max)}`}>
        {current} / {max}
      </span>
    </div>
  )
}

function FacebookIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-current">
      <path d="M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.9.3-1.6 1.7-1.6H16.7V4.8c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4V11H8v3h2.5v8h3z" />
    </svg>
  )
}

function TikTokIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-current">
      <path d="M16.6 3c.2 1.6 1.1 3 2.4 3.8.8.5 1.6.8 2.5.9v2.7c-1.3 0-2.7-.4-3.9-1.1v5.7c0 1.6-.6 3.1-1.8 4.2A6.2 6.2 0 0 1 11.5 21a6 6 0 0 1-4.2-1.7A6 6 0 0 1 5.6 15c0-3.3 2.7-6 6-6 .3 0 .7 0 1 .1v2.9a3.2 3.2 0 0 0-1-.2 3.2 3.2 0 1 0 3.2 3.2V3h2.8z" />
    </svg>
  )
}

function applyTheme(nextTheme: ThemeMode) {
  const root = document.documentElement

  root.setAttribute('data-theme', nextTheme)
  root.style.colorScheme = nextTheme
  root.classList.toggle('dark', nextTheme === 'dark')
  root.classList.toggle('light', nextTheme === 'light')

  localStorage.setItem('site-theme', nextTheme)
  localStorage.setItem('theme', nextTheme)
}

function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'dark'

  const root = document.documentElement
  const attrTheme = root.getAttribute('data-theme')
  const storedTheme =
    localStorage.getItem('site-theme') || localStorage.getItem('theme')

  if (
    attrTheme === 'light' ||
    storedTheme === 'light' ||
    root.classList.contains('light')
  ) {
    return 'light'
  }

  return 'dark'
}

export default function HomeContentEditor({ initialContent }: Props) {
  const [form, setForm] = useState<HomeContent>(initialContent)
  const [saved, setSaved] = useState<HomeContent>(initialContent)
  const [message, setMessage] = useState('')
  const [theme, setTheme] = useState<ThemeMode>('dark')
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const currentTheme = getInitialTheme()
    setTheme(currentTheme)
  }, [])

  const isDark = theme === 'dark'

  const errors = useMemo(() => {
    return {
      overline: form.overline.length > homeLimits.overline,
      title: form.title.length > homeLimits.title,
      subtitle: form.subtitle.length > homeLimits.subtitle,
      stat1: form.stat1.length > homeLimits.stat1,
      stat2: form.stat2.length > homeLimits.stat2,
      stat3: form.stat3.length > homeLimits.stat3,
    }
  }, [form])

  const hasErrors = Object.values(errors).some(Boolean)

  const visibleStats = [
    {
      enabled: form.stat1Enabled,
      label: 'Storia',
      value: form.stat1,
    },
    {
      enabled: form.stat2Enabled,
      label: 'Territorio',
      value: form.stat2,
    },
    {
      enabled: form.stat3Enabled,
      label: 'Metodo',
      value: form.stat3,
    },
  ].filter((item) => item.enabled)

  function update<K extends keyof HomeContent>(key: K, value: HomeContent[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setMessage('')
  }

  function updateStatEnabled(
    field: 'stat1Enabled' | 'stat2Enabled' | 'stat3Enabled',
    value: boolean
  ) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setMessage('')
  }

  function cancelChanges() {
    setForm(saved)
    setMessage('')
  }

  function restoreDefaults() {
    setForm(defaultHomeContent)
    setMessage('')
  }

  function toggleTheme() {
    const nextTheme: ThemeMode = theme === 'dark' ? 'light' : 'dark'
    applyTheme(nextTheme)
    setTheme(nextTheme)
  }

  async function save() {
    if (hasErrors) return

    setMessage('')

    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/site-content', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            key: HOME_CONTENT_KEY,
            value: form,
          }),
        })

        if (!res.ok) {
          setMessage('Errore durante il salvataggio.')
          return
        }

        setSaved(form)
        setMessage('Home aggiornata correttamente.')
      } catch {
        setMessage('Errore durante il salvataggio.')
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="theme-panel rounded-[26px] border p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/admin"
            className="inline-flex items-center justify-center rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-surface-2)]"
          >
            ← Torna alla dashboard
          </Link>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Attiva tema chiaro' : 'Attiva tema scuro'}
            title={isDark ? 'Attiva tema chiaro' : 'Attiva tema scuro'}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--site-border)] bg-[var(--site-surface)] text-[var(--site-text)] transition hover:bg-[var(--site-surface-2)]"
          >
            <span aria-hidden="true" className="text-base leading-none">
              {isDark ? '☀' : '☾'}
            </span>
          </button>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[440px_minmax(0,1fr)]">
        <section className="theme-panel rounded-[30px] border p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-[var(--site-text)]">
              Modifica Home
            </h1>
            <p className="mt-2 text-sm text-[var(--site-text-muted)]">
              Testi guidati con limiti di caratteri e anteprima live.
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <FieldLabel
                label="Sovratitolo"
                current={form.overline.length}
                max={homeLimits.overline}
              />
              <input
                value={form.overline}
                onChange={(e) => update('overline', e.target.value)}
                className={`w-full rounded-2xl border bg-[var(--site-surface)] px-4 py-3 text-sm text-[var(--site-text)] outline-none transition ${
                  errors.overline
                    ? 'border-red-500'
                    : 'border-[var(--site-border)] focus:border-[var(--site-border-strong)]'
                }`}
              />
            </div>

            <div>
              <FieldLabel
                label="Titolo"
                current={form.title.length}
                max={homeLimits.title}
              />
              <textarea
                value={form.title}
                onChange={(e) => update('title', e.target.value)}
                rows={4}
                className={`min-h-[110px] w-full rounded-2xl border bg-[var(--site-surface)] px-4 py-3 text-sm text-[var(--site-text)] outline-none transition ${
                  errors.title
                    ? 'border-red-500'
                    : 'border-[var(--site-border)] focus:border-[var(--site-border-strong)]'
                }`}
              />
            </div>

            <div>
              <FieldLabel
                label="Sottotitolo"
                current={form.subtitle.length}
                max={homeLimits.subtitle}
              />
              <textarea
                value={form.subtitle}
                onChange={(e) => update('subtitle', e.target.value)}
                rows={5}
                className={`min-h-[120px] w-full rounded-2xl border bg-[var(--site-surface)] px-4 py-3 text-sm text-[var(--site-text)] outline-none transition ${
                  errors.subtitle
                    ? 'border-red-500'
                    : 'border-[var(--site-border)] focus:border-[var(--site-border-strong)]'
                }`}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <FieldLabel
                  label="Box 1"
                  current={form.stat1.length}
                  max={homeLimits.stat1}
                />
                <label className="flex items-center gap-2 text-sm text-[var(--site-text)]">
                  <input
                    type="checkbox"
                    checked={form.stat1Enabled}
                    onChange={(e) => updateStatEnabled('stat1Enabled', e.target.checked)}
                  />
                  Mostra box
                </label>
              </div>

              <input
                value={form.stat1}
                onChange={(e) => update('stat1', e.target.value)}
                className={`w-full rounded-2xl border bg-[var(--site-surface)] px-4 py-3 text-sm text-[var(--site-text)] outline-none transition ${
                  errors.stat1
                    ? 'border-red-500'
                    : 'border-[var(--site-border)] focus:border-[var(--site-border-strong)]'
                }`}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <FieldLabel
                  label="Box 2"
                  current={form.stat2.length}
                  max={homeLimits.stat2}
                />
                <label className="flex items-center gap-2 text-sm text-[var(--site-text)]">
                  <input
                    type="checkbox"
                    checked={form.stat2Enabled}
                    onChange={(e) => updateStatEnabled('stat2Enabled', e.target.checked)}
                  />
                  Mostra box
                </label>
              </div>

              <input
                value={form.stat2}
                onChange={(e) => update('stat2', e.target.value)}
                className={`w-full rounded-2xl border bg-[var(--site-surface)] px-4 py-3 text-sm text-[var(--site-text)] outline-none transition ${
                  errors.stat2
                    ? 'border-red-500'
                    : 'border-[var(--site-border)] focus:border-[var(--site-border-strong)]'
                }`}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <FieldLabel
                  label="Box 3"
                  current={form.stat3.length}
                  max={homeLimits.stat3}
                />
                <label className="flex items-center gap-2 text-sm text-[var(--site-text)]">
                  <input
                    type="checkbox"
                    checked={form.stat3Enabled}
                    onChange={(e) => updateStatEnabled('stat3Enabled', e.target.checked)}
                  />
                  Mostra box
                </label>
              </div>

              <input
                value={form.stat3}
                onChange={(e) => update('stat3', e.target.value)}
                className={`w-full rounded-2xl border bg-[var(--site-surface)] px-4 py-3 text-sm text-[var(--site-text)] outline-none transition ${
                  errors.stat3
                    ? 'border-red-500'
                    : 'border-[var(--site-border)] focus:border-[var(--site-border-strong)]'
                }`}
              />
            </div>
          </div>

          {hasErrors ? (
            <p className="mt-5 text-sm text-red-500">
              Alcuni campi superano il limite e il salvataggio è bloccato.
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={save}
              disabled={isPending || hasErrors}
              className="theme-button-primary rounded-2xl px-5 py-3 text-sm font-semibold disabled:opacity-50"
            >
              {isPending ? 'Salvataggio...' : 'Salva'}
            </button>

            <button
              type="button"
              onClick={cancelChanges}
              disabled={isPending}
              className="rounded-2xl border border-[var(--site-border)] px-5 py-3 text-sm font-semibold text-[var(--site-text)]"
            >
              Annulla
            </button>

            <button
              type="button"
              onClick={restoreDefaults}
              disabled={isPending}
              className="rounded-2xl border border-[var(--site-border)] px-5 py-3 text-sm font-semibold text-[var(--site-text)]"
            >
              Ripristina default
            </button>
          </div>

          {message ? (
            <p className="mt-4 text-sm text-[var(--site-text-muted)]">{message}</p>
          ) : null}
        </section>

        <section
          className={`overflow-hidden rounded-[34px] border shadow-[0_24px_80px_rgba(0,0,0,0.18)] ${
            isDark
              ? 'border-white/10 bg-[#040b16]'
              : 'border-[#d9e2ec] bg-[#f5f7fb]'
          }`}
        >
          <div
            className={`border-b px-6 py-4 text-sm ${
              isDark
                ? 'border-white/10 bg-[#07101d] text-white/80'
                : 'border-[#d9e2ec] bg-white text-slate-600'
            }`}
          >
            Anteprima Home
          </div>

          <div
            className={`border-b ${
              isDark
                ? 'border-white/10 bg-[#07101d]'
                : 'border-[#d9e2ec] bg-white'
            }`}
          >
            <div
              className={`flex items-center justify-between gap-6 px-6 py-4 ${
                isDark ? 'text-white/80' : 'text-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <img
                  src="/images/brand/areaimmobiliare.png"
                  alt="Area Immobiliare"
                  className="h-10 w-auto object-contain opacity-95"
                />
              </div>

              <div className="hidden items-center gap-8 text-sm lg:flex">
                <span className={isDark ? 'font-medium text-white' : 'font-medium text-slate-900'}>
                  Home
                </span>
                <span className={isDark ? 'opacity-75' : 'text-slate-600'}>Immobili</span>
                <span className={isDark ? 'opacity-75' : 'text-slate-600'}>News</span>
                <span className={isDark ? 'opacity-75' : 'text-slate-600'}>Chi siamo</span>
                <span className={isDark ? 'opacity-75' : 'text-slate-600'}>Contatti</span>
              </div>

              <div className="hidden items-center gap-3 lg:flex">
                <div
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-full border ${
                    isDark
                      ? 'border-white/12 bg-white/[0.04] text-white/90'
                      : 'border-[#d9e2ec] bg-[#f8fafc] text-slate-700'
                  }`}
                >
                  {isDark ? '☾' : '☀'}
                </div>

                <div
                  className={`rounded-full border px-4 py-2.5 text-sm ${
                    isDark
                      ? 'border-white/12 bg-white/[0.04] text-white/88'
                      : 'border-[#d9e2ec] bg-[#f8fafc] text-slate-700'
                  }`}
                >
                  info@areaimmobiliare.com
                </div>

                <div
                  className={`rounded-full border px-4 py-2.5 text-sm ${
                    isDark
                      ? 'border-white/12 bg-white/[0.04] text-white/88'
                      : 'border-[#d9e2ec] bg-[#f8fafc] text-slate-700'
                  }`}
                >
                  035 221206
                </div>

                <div
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-full border ${
                    isDark
                      ? 'border-white/12 bg-white/[0.04] text-white/90'
                      : 'border-[#d9e2ec] bg-[#f8fafc] text-slate-700'
                  }`}
                >
                  <FacebookIcon />
                </div>

                <div
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-full border ${
                    isDark
                      ? 'border-white/12 bg-white/[0.04] text-white/90'
                      : 'border-[#d9e2ec] bg-[#f8fafc] text-slate-700'
                  }`}
                >
                  <TikTokIcon />
                </div>
              </div>
            </div>
          </div>

          <section
            className={`relative min-h-[92vh] overflow-hidden border-b ${
              isDark
                ? 'border-white/10 bg-[#09101b]'
                : 'border-[#d9e2ec] bg-[#eef3f8]'
            }`}
          >
            <div className="absolute inset-0">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: "url('/images/bergamo-1.jpg')" }}
              />

              {isDark ? (
                <>
                  <div className="absolute inset-0 bg-black/18" />
                  <div className="absolute inset-0 bg-white/[0.07] backdrop-blur-[3px]" />
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.10)_0%,rgba(255,255,255,0.04)_38%,rgba(255,255,255,0.08)_100%)]" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(255,255,255,0.10),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.06),transparent_22%)]" />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,10,18,0.18)_0%,rgba(4,10,18,0.10)_35%,rgba(4,10,18,0.22)_100%)]" />
                </>
              ) : (
                <>
                  <div className="absolute inset-0 bg-white/55" />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.68)_0%,rgba(255,255,255,0.62)_35%,rgba(242,247,252,0.82)_100%)]" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(255,255,255,0.34),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.22),transparent_22%)]" />
                </>
              )}
            </div>

            <div className="relative grid min-h-[92vh] w-full items-center gap-12 px-6 py-12 xl:grid-cols-[1.15fr_0.85fr] xl:px-10 2xl:px-14">
              <div className="max-w-[920px]">
                <div>
                  <p
                    className={`text-sm font-semibold uppercase tracking-[0.34em] ${
                      isDark
                        ? 'text-white/90 [text-shadow:0_1px_2px_rgba(0,0,0,0.72)]'
                        : 'text-slate-700'
                    }`}
                  >
                    {form.overline}
                  </p>

                  <h2
                    className={`mt-6 max-w-[900px] text-5xl font-semibold leading-[0.98] md:text-7xl xl:text-[5.5rem] ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {form.title}
                  </h2>

                  <p
                    className={`mt-7 max-w-[760px] text-base leading-8 md:text-lg xl:text-[1.15rem] ${
                      isDark
                        ? 'text-white/88 [text-shadow:0_2px_4px_rgba(0,0,0,0.6)]'
                        : 'text-slate-700'
                    }`}
                  >
                    {form.subtitle}
                  </p>

                  <div className="mt-8 hidden flex-wrap gap-3 md:flex">
                    <div
                      className={`rounded-2xl px-6 py-3.5 text-sm font-semibold ${
                        isDark
                          ? 'bg-white text-black'
                          : 'bg-slate-900 text-white'
                      }`}
                    >
                      Esplora gli immobili
                    </div>

                    <div
                      className={`rounded-2xl border px-6 py-3.5 text-sm font-semibold ${
                        isDark
                          ? 'border-white/20 bg-white/10 text-white backdrop-blur-sm'
                          : 'border-slate-300 bg-white/80 text-slate-900'
                      }`}
                    >
                      Disegna la tua area
                    </div>

                    <div
                      className={`rounded-2xl border px-6 py-3.5 text-sm font-semibold ${
                        isDark
                          ? 'border-white/18 bg-transparent text-white/90'
                          : 'border-slate-300 bg-transparent text-slate-800'
                      }`}
                    >
                      Scopri Area Immobiliare
                    </div>
                  </div>
                </div>

                {visibleStats.length > 0 ? (
                  <div
                    className={`mt-10 grid gap-4 ${
                      visibleStats.length === 1
                        ? 'md:grid-cols-1'
                        : visibleStats.length === 2
                          ? 'md:grid-cols-2'
                          : 'md:grid-cols-3'
                    }`}
                  >
                    {visibleStats.map((item) => (
                      <div
                        key={item.label}
                        className={`rounded-[24px] border px-5 py-5 shadow-[0_10px_24px_rgba(0,0,0,0.10)] ${
                          isDark
                            ? 'border-white/20 bg-white/[0.13] backdrop-blur-md'
                            : 'border-[#d9e2ec] bg-white/90 backdrop-blur-sm'
                        }`}
                      >
                        <p
                          className={`text-[12px] font-semibold uppercase tracking-[0.22em] ${
                            isDark ? 'text-white/86' : 'text-slate-500'
                          }`}
                        >
                          {item.label}
                        </p>
                        <p
                          className={`mt-2 text-2xl font-semibold ${
                            isDark ? 'text-white' : 'text-slate-900'
                          }`}
                        >
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="hidden xl:flex xl:justify-end xl:self-end">
                <div className="relative w-full max-w-[540px]">
                  <div
                    className={`absolute -left-8 top-10 h-32 w-32 rounded-full blur-3xl ${
                      isDark ? 'bg-white/18' : 'bg-white/45'
                    }`}
                  />
                  <div
                    className={`absolute -right-6 bottom-4 h-40 w-40 rounded-full blur-3xl ${
                      isDark ? 'bg-white/12' : 'bg-slate-200/70'
                    }`}
                  />

                  <div
                    className={`relative overflow-hidden rounded-[34px] border p-5 shadow-[0_24px_80px_rgba(0,0,0,0.16)] ${
                      isDark
                        ? 'border-white/20 bg-white/[0.08] backdrop-blur-md'
                        : 'border-[#d9e2ec] bg-white/88 backdrop-blur-sm'
                    }`}
                  >
                    <div
                      className={`absolute inset-0 ${
                        isDark ? 'bg-white/[0.06]' : 'bg-white/40'
                      }`}
                    />

                    <div className="relative grid gap-4">
                      <div
                        className={`overflow-hidden rounded-[26px] border ${
                          isDark ? 'border-white/18' : 'border-[#d9e2ec]'
                        }`}
                      >
                        <div
                          className="h-[240px] w-full bg-cover bg-center"
                          style={{
                            backgroundImage: "url('/images/bergamo-map.jpg')",
                          }}
                        />
                      </div>

                      <div className="grid grid-cols-[1.1fr_0.9fr] gap-4">
                        <div
                          className={`rounded-[24px] border p-4 ${
                            isDark
                              ? 'border-white/18 bg-white/[0.10] backdrop-blur-sm'
                              : 'border-[#d9e2ec] bg-[#f8fafc]'
                          }`}
                        >
                          <p
                            className={`text-[12px] font-semibold uppercase tracking-[0.2em] ${
                              isDark ? 'text-white/82' : 'text-slate-500'
                            }`}
                          >
                            Ricerca su mappa
                          </p>
                          <p
                            className={`mt-2 text-2xl font-semibold ${
                              isDark ? 'text-white' : 'text-slate-900'
                            }`}
                          >
                            Zone precise
                          </p>
                          <p
                            className={`mt-3 text-sm leading-7 ${
                              isDark ? 'text-white/76' : 'text-slate-600'
                            }`}
                          >
                            Disegna l’area che ti interessa e concentrati solo
                            sugli immobili coerenti con la tua ricerca.
                          </p>
                        </div>

                        <div
                          className={`group relative overflow-hidden rounded-[26px] border shadow-[0_10px_28px_rgba(0,0,0,0.12)] ${
                            isDark
                              ? 'border-white/18 bg-white/[0.10] backdrop-blur-sm'
                              : 'border-[#d9e2ec] bg-white'
                          }`}
                        >
                          <div
                            className="absolute inset-0 bg-cover bg-center opacity-100"
                            style={{
                              backgroundImage: "url('/images/bergamo-map.jpg')",
                            }}
                          />

                          {isDark ? (
                            <>
                              <div className="absolute inset-0 bg-white/68 backdrop-blur-[4px]" />
                              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.42)_0%,rgba(255,255,255,0.18)_100%)]" />
                            </>
                          ) : (
                            <>
                              <div className="absolute inset-0 bg-white/78 backdrop-blur-[3px]" />
                              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.74)_0%,rgba(248,250,252,0.48)_100%)]" />
                            </>
                          )}

                          <div className="relative flex h-full min-h-[220px] flex-col justify-between p-5">
                            <div>
                              <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-black/60">
                                Mappa interattiva
                              </p>
                              <p className="mt-3 text-[2rem] font-semibold leading-tight text-black">
                                Vai alla mappa
                              </p>
                              <p className="mt-3 max-w-[220px] text-sm leading-7 text-black/68">
                                Apri la vista mappa completa e disegna la zona
                                che vuoi analizzare.
                              </p>
                            </div>

                            <div className="mt-6 inline-flex w-fit items-center rounded-full border border-black/10 bg-black px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(0,0,0,0.18)]">
                              Apri
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </section>
      </div>
    </div>
  )
}