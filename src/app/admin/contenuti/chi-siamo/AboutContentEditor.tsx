'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, useTransition } from 'react'
import {
  ABOUT_CONTENT_KEY,
  aboutLimits,
  defaultAboutContent,
  type AboutContent,
} from '@/lib/site-content'

type Props = {
  initialContent: AboutContent
}

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

type InputFieldProps = {
  label: string
  value: string
  max: number
  onChange: (value: string) => void
}

function InputField({ label, value, max, onChange }: InputFieldProps) {
  const isError = value.length > max

  return (
    <div>
      <FieldLabel label={label} current={value.length} max={max} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-2xl border bg-[var(--site-surface)] px-4 py-3 text-sm text-[var(--site-text)] outline-none transition ${
          isError
            ? 'border-red-500'
            : 'border-[var(--site-border)] focus:border-[var(--site-border-strong)]'
        }`}
      />
    </div>
  )
}

type TextareaFieldProps = {
  label: string
  value: string
  max: number
  rows?: number
  onChange: (value: string) => void
}

function TextareaField({
  label,
  value,
  max,
  rows = 5,
  onChange,
}: TextareaFieldProps) {
  const isError = value.length > max

  return (
    <div>
      <FieldLabel label={label} current={value.length} max={max} />
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className={`w-full rounded-2xl border bg-[var(--site-surface)] px-4 py-3 text-sm text-[var(--site-text)] outline-none transition ${
          isError
            ? 'border-red-500'
            : 'border-[var(--site-border)] focus:border-[var(--site-border-strong)]'
        }`}
      />
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


export default function AboutContentEditor({ initialContent }: Props) {
  const [form, setForm] = useState<AboutContent>(initialContent)
  const [saved, setSaved] = useState<AboutContent>(initialContent)
  const [message, setMessage] = useState('')
  const [isDark, setIsDark] = useState(true)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const syncTheme = () => {
      setIsDark(document.documentElement.getAttribute('data-theme') !== 'light')
    }

    syncTheme()

    const observer = new MutationObserver(syncTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })

    return () => observer.disconnect()
  }, [])


  const visibleQuadrants = form.quadrants.filter((item) => item.enabled)
  const activeBoxCount = [
    form.box1Enabled,
    form.box2Enabled,
    form.box3Enabled,
    form.box4Enabled,
  ].filter(Boolean).length
  const noActiveBoxes = activeBoxCount === 0

  const hasErrors = useMemo(() => {
    const checks = [
      form.heroTitle.length > aboutLimits.heroTitle,
      form.heroIntro.length > aboutLimits.heroIntro,

      form.box1Title.length > aboutLimits.boxTitle,
      form.box1Paragraph1.length > aboutLimits.paragraph,
      form.box1Paragraph2.length > aboutLimits.paragraph,
      form.box1Paragraph3.length > aboutLimits.paragraph,

      form.box2Title.length > aboutLimits.boxTitle,

      form.box3Title.length > aboutLimits.boxTitle,
      form.box3Paragraph1.length > aboutLimits.paragraph,
      form.box3Paragraph2.length > aboutLimits.paragraph,

      form.box4Title.length > aboutLimits.boxTitle,
      form.box4Text.length > aboutLimits.box4Text,

      ...form.quadrants.flatMap((q) => [
        q.title.length > aboutLimits.quadrantTitle,
        q.text.length > aboutLimits.quadrantText,
      ]),
    ]

    return checks.some(Boolean)
  }, [form])

  const saveBlocked = hasErrors || noActiveBoxes

  function update<K extends keyof AboutContent>(key: K, value: AboutContent[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setMessage('')
  }

  function updateQuadrant(
    index: number,
    field: 'enabled' | 'title' | 'text',
    value: boolean | string
  ) {
    setForm((prev) => ({
      ...prev,
      quadrants: prev.quadrants.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }))
    setMessage('')
  }

  function updateBoxEnabled(
    field: 'box1Enabled' | 'box2Enabled' | 'box3Enabled' | 'box4Enabled',
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
    setForm(defaultAboutContent)
    setMessage('')
  }


  async function save() {
    if (saveBlocked) return

    setMessage('')

    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/site-content', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            key: ABOUT_CONTENT_KEY,
            value: form,
          }),
        })

        if (!res.ok) {
          setMessage('Errore durante il salvataggio.')
          return
        }

        setSaved(form)
        setMessage('Chi siamo aggiornato correttamente.')
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
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[520px_minmax(0,1fr)]">
        <section className="theme-panel rounded-[30px] border p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-[var(--site-text)]">
              Modifica Chi siamo
            </h1>
            <p className="mt-2 text-sm text-[var(--site-text-muted)]">
              Modifica guidata dei blocchi testuali e dei quadranti con anteprima live.
            </p>
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--site-text-faint)]">
                Hero
              </h2>

              <TextareaField
                label="Titolo hero"
                value={form.heroTitle}
                max={aboutLimits.heroTitle}
                rows={4}
                onChange={(value) => update('heroTitle', value)}
              />

              <TextareaField
                label="Testo hero"
                value={form.heroIntro}
                max={aboutLimits.heroIntro}
                rows={5}
                onChange={(value) => update('heroIntro', value)}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--site-text-faint)]">
                  Box 1
                </h2>

                <label className="flex items-center gap-2 text-sm text-[var(--site-text)]">
                  <input
                    type="checkbox"
                    checked={form.box1Enabled}
                    onChange={(e) => updateBoxEnabled('box1Enabled', e.target.checked)}
                  />
                  Mostra box
                </label>
              </div>

              <InputField
                label="Titolo box 1"
                value={form.box1Title}
                max={aboutLimits.boxTitle}
                onChange={(value) => update('box1Title', value)}
              />

              <TextareaField
                label="Paragrafo 1"
                value={form.box1Paragraph1}
                max={aboutLimits.paragraph}
                rows={5}
                onChange={(value) => update('box1Paragraph1', value)}
              />

              <TextareaField
                label="Paragrafo 2"
                value={form.box1Paragraph2}
                max={aboutLimits.paragraph}
                rows={5}
                onChange={(value) => update('box1Paragraph2', value)}
              />

              <TextareaField
                label="Paragrafo 3"
                value={form.box1Paragraph3}
                max={aboutLimits.paragraph}
                rows={5}
                onChange={(value) => update('box1Paragraph3', value)}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--site-text-faint)]">
                  Box 2 + quadranti
                </h2>

                <label className="flex items-center gap-2 text-sm text-[var(--site-text)]">
                  <input
                    type="checkbox"
                    checked={form.box2Enabled}
                    onChange={(e) => updateBoxEnabled('box2Enabled', e.target.checked)}
                  />
                  Mostra box
                </label>
              </div>

              <InputField
                label="Titolo box 2"
                value={form.box2Title}
                max={aboutLimits.boxTitle}
                onChange={(value) => update('box2Title', value)}
              />

              <div className="space-y-4">
                {form.quadrants.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] p-4"
                  >
                    <label className="mb-4 flex items-center gap-3 text-sm text-[var(--site-text)]">
                      <input
                        type="checkbox"
                        checked={item.enabled}
                        onChange={(e) =>
                          updateQuadrant(index, 'enabled', e.target.checked)
                        }
                      />
                      Mostra quadrante {index + 1}
                    </label>

                    <InputField
                      label={`Titolo quadrante ${index + 1}`}
                      value={item.title}
                      max={aboutLimits.quadrantTitle}
                      onChange={(value) =>
                        updateQuadrant(index, 'title', value)
                      }
                    />

                    <div className="mt-4">
                      <TextareaField
                        label={`Testo quadrante ${index + 1}`}
                        value={item.text}
                        max={aboutLimits.quadrantText}
                        rows={4}
                        onChange={(value) =>
                          updateQuadrant(index, 'text', value)
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--site-text-faint)]">
                  Box 3
                </h2>

                <label className="flex items-center gap-2 text-sm text-[var(--site-text)]">
                  <input
                    type="checkbox"
                    checked={form.box3Enabled}
                    onChange={(e) => updateBoxEnabled('box3Enabled', e.target.checked)}
                  />
                  Mostra box
                </label>
              </div>

              <InputField
                label="Titolo box 3"
                value={form.box3Title}
                max={aboutLimits.boxTitle}
                onChange={(value) => update('box3Title', value)}
              />

              <TextareaField
                label="Paragrafo 1"
                value={form.box3Paragraph1}
                max={aboutLimits.paragraph}
                rows={5}
                onChange={(value) => update('box3Paragraph1', value)}
              />

              <TextareaField
                label="Paragrafo 2"
                value={form.box3Paragraph2}
                max={aboutLimits.paragraph}
                rows={5}
                onChange={(value) => update('box3Paragraph2', value)}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--site-text-faint)]">
                  Box 4
                </h2>

                <label className="flex items-center gap-2 text-sm text-[var(--site-text)]">
                  <input
                    type="checkbox"
                    checked={form.box4Enabled}
                    onChange={(e) => updateBoxEnabled('box4Enabled', e.target.checked)}
                  />
                  Mostra box
                </label>
              </div>

              <InputField
                label="Titolo box 4"
                value={form.box4Title}
                max={aboutLimits.boxTitle}
                onChange={(value) => update('box4Title', value)}
              />

              <TextareaField
                label="Testo box 4"
                value={form.box4Text}
                max={aboutLimits.box4Text}
                rows={6}
                onChange={(value) => update('box4Text', value)}
              />
            </div>
          </div>

          {hasErrors ? (
            <p className="mt-5 text-sm text-red-500">
              Alcuni campi superano il limite e il salvataggio è bloccato.
            </p>
          ) : null}

          {noActiveBoxes ? (
            <p className="mt-3 text-sm text-red-500">
              Deve rimanere almeno 1 box attivo tra Box 1, 2, 3 e 4.
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={save}
              disabled={isPending || saveBlocked}
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
                <span className={isDark ? 'opacity-75' : 'text-slate-600'}>Home</span>
                <span className={isDark ? 'opacity-75' : 'text-slate-600'}>Immobili</span>
                <span className={isDark ? 'opacity-75' : 'text-slate-600'}>News</span>
                <span className={isDark ? 'font-medium text-white' : 'font-medium text-slate-900'}>
                  Chi siamo
                </span>
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

          <div className={isDark ? 'bg-[#040b16]' : 'bg-[#f5f7fb]'}>
            <section
              className={`relative overflow-hidden border-b ${
                isDark
                  ? 'border-white/10 bg-[linear-gradient(180deg,#061022_0%,#061021_100%)]'
                  : 'border-[#d9e2ec] bg-[linear-gradient(180deg,#f6f9fc_0%,#eef3f8_100%)]'
              }`}
            >
              {isDark ? (
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_34%,rgba(255,255,255,0.04),transparent_24%),radial-gradient(circle_at_84%_30%,rgba(255,255,255,0.025),transparent_28%)]" />
              ) : (
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_34%,rgba(15,23,42,0.06),transparent_24%),radial-gradient(circle_at_84%_30%,rgba(15,23,42,0.04),transparent_28%)]" />
              )}

              <div className="relative z-10 mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-center">
                <div className="flex flex-col items-center justify-center lg:items-start lg:justify-start">
                  <div
                    className={`relative h-[240px] w-[240px] overflow-hidden rounded-full border-2 shadow-[0_10px_40px_rgba(0,0,0,0.18)] lg:h-[270px] lg:w-[270px] ${
                      isDark
                        ? 'border-white/12 bg-white/5'
                        : 'border-[#d9e2ec] bg-white'
                    }`}
                  >
                    <img
                      src="/images/gianfederico-belotti.jpg"
                      alt="Gianfederico Belotti"
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="mt-5 flex w-[270px] items-center justify-center gap-3">
                    <div
                      className={`inline-flex h-11 w-11 items-center justify-center rounded-full border ${
                        isDark
                          ? 'border-white/12 bg-white/[0.03] text-white/90'
                          : 'border-[#d9e2ec] bg-white text-slate-700'
                      }`}
                    >
                      <FacebookIcon />
                    </div>

                    <span className={isDark ? 'text-base text-white/35' : 'text-base text-slate-300'}>
                      |
                    </span>

                    <div
                      className={`inline-flex h-11 w-11 items-center justify-center rounded-full border ${
                        isDark
                          ? 'border-white/12 bg-white/[0.03] text-white/90'
                          : 'border-[#d9e2ec] bg-white text-slate-700'
                      }`}
                    >
                      <TikTokIcon />
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <div
                    className={`pointer-events-none absolute right-0 top-0 hidden h-[280px] w-[360px] opacity-[0.10] xl:block ${
                      isDark ? '' : 'opacity-[0.08]'
                    }`}
                  >
                    <div
                      className={`absolute left-8 top-10 h-24 w-24 rounded-full border ${
                        isDark ? 'border-white/30' : 'border-slate-500/30'
                      }`}
                    />
                    <div
                      className={`absolute right-10 top-2 h-16 w-24 rounded-[18px] border ${
                        isDark ? 'border-white/20' : 'border-slate-500/20'
                      }`}
                    />
                    <div
                      className={`absolute left-20 top-28 h-[2px] w-36 ${
                        isDark ? 'bg-white/30' : 'bg-slate-500/30'
                      }`}
                    />
                    <div
                      className={`absolute left-20 top-48 h-[2px] w-40 ${
                        isDark ? 'bg-white/20' : 'bg-slate-500/22'
                      }`}
                    />
                    <div
                      className={`absolute left-24 top-68 h-[2px] w-56 ${
                        isDark ? 'bg-white/15' : 'bg-slate-500/18'
                      }`}
                    />
                    <div
                      className={`absolute left-28 top-92 h-[2px] w-52 ${
                        isDark ? 'bg-white/12' : 'bg-slate-500/14'
                      }`}
                    />
                    <div
                      className={`absolute left-[82px] top-[76px] h-[130px] w-[130px] rounded-full border ${
                        isDark ? 'border-white/20' : 'border-slate-500/22'
                      }`}
                    />
                    <div
                      className={`absolute left-[180px] top-[154px] h-[56px] w-[2px] rotate-[-44deg] ${
                        isDark ? 'bg-white/18' : 'bg-slate-500/20'
                      }`}
                    />
                  </div>

                  <p
                    className={`text-sm uppercase tracking-[0.3em] ${
                      isDark ? 'text-white/45' : 'text-slate-500'
                    }`}
                  >
                    Chi siamo
                  </p>

                  <h2
                    className={`mt-4 max-w-4xl text-4xl font-semibold leading-tight md:text-5xl xl:text-[3.8rem] ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {form.heroTitle}
                  </h2>

                  <p
                    className={`mt-6 max-w-3xl text-base leading-8 md:text-lg ${
                      isDark ? 'text-white/70' : 'text-slate-700'
                    }`}
                  >
                    {form.heroIntro}
                  </p>
                </div>
              </div>
            </section>

            <section className="mx-auto max-w-7xl px-6 py-16">
              <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="space-y-8">
                  {form.box1Enabled ? (
                    <div
                      className={`rounded-[30px] border p-8 shadow-[0_18px_48px_rgba(0,0,0,0.10)] ${
                        isDark
                          ? 'border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))]'
                          : 'border-[#d9e2ec] bg-white'
                      }`}
                    >
                      <h3
                        className={`text-2xl font-semibold ${
                          isDark ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        {form.box1Title}
                      </h3>

                      <div className={`mt-5 space-y-5 ${isDark ? 'text-white/62' : 'text-slate-700'}`}>
                        <p className="leading-8">{form.box1Paragraph1}</p>
                        <p className="leading-8">{form.box1Paragraph2}</p>
                        <p className="leading-8">{form.box1Paragraph3}</p>
                      </div>
                    </div>
                  ) : null}

                  {form.box2Enabled ? (
                    <div
                      className={`rounded-[30px] border p-8 shadow-[0_18px_48px_rgba(0,0,0,0.10)] ${
                        isDark
                          ? 'border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))]'
                          : 'border-[#d9e2ec] bg-white'
                      }`}
                    >
                      <h3
                        className={`text-2xl font-semibold ${
                          isDark ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        {form.box2Title}
                      </h3>

                      <div className="mt-6 grid gap-4 md:grid-cols-2">
                        {visibleQuadrants.length > 0 ? (
                          visibleQuadrants.map((item, index) => (
                            <div
                              key={`${item.title}-${index}`}
                              className={`rounded-2xl border p-5 ${
                                isDark
                                  ? 'border-white/10 bg-[rgba(3,9,19,0.72)]'
                                  : 'border-[#d9e2ec] bg-[#f8fafc]'
                              }`}
                            >
                              <h4
                                className={`text-lg font-medium ${
                                  isDark ? 'text-white' : 'text-slate-900'
                                }`}
                              >
                                {item.title}
                              </h4>
                              <p
                                className={`mt-3 text-sm leading-7 ${
                                  isDark ? 'text-white/58' : 'text-slate-600'
                                }`}
                              >
                                {item.text}
                              </p>
                            </div>
                          ))
                        ) : (
                          <div
                            className={`rounded-2xl border border-dashed p-5 text-sm md:col-span-2 ${
                              isDark
                                ? 'border-white/12 bg-[rgba(3,9,19,0.55)] text-white/45'
                                : 'border-[#d9e2ec] bg-[#f8fafc] text-slate-500'
                            }`}
                          >
                            Nessun quadrante attivo.
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}

                  {form.box3Enabled ? (
                    <div
                      className={`rounded-[30px] border p-8 shadow-[0_18px_48px_rgba(0,0,0,0.10)] ${
                        isDark
                          ? 'border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))]'
                          : 'border-[#d9e2ec] bg-white'
                      }`}
                    >
                      <h3
                        className={`text-2xl font-semibold ${
                          isDark ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        {form.box3Title}
                      </h3>

                      <div className={`mt-5 space-y-5 ${isDark ? 'text-white/62' : 'text-slate-700'}`}>
                        <p className="leading-8">{form.box3Paragraph1}</p>
                        <p className="leading-8">{form.box3Paragraph2}</p>
                      </div>
                    </div>
                  ) : null}

                  {form.box4Enabled ? (
                    <div
                      className={`rounded-[30px] border p-8 shadow-[0_18px_48px_rgba(0,0,0,0.10)] ${
                        isDark
                          ? 'border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))]'
                          : 'border-[#d9e2ec] bg-white'
                      }`}
                    >
                      <h3
                        className={`text-2xl font-semibold ${
                          isDark ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        {form.box4Title}
                      </h3>

                      <p className={`mt-5 leading-8 ${isDark ? 'text-white/62' : 'text-slate-700'}`}>
                        {form.box4Text}
                      </p>
                    </div>
                  ) : null}

                  {noActiveBoxes ? (
                    <div
                      className={`rounded-[30px] border border-dashed p-8 text-sm ${
                        isDark
                          ? 'border-white/12 bg-[rgba(3,9,19,0.55)] text-white/45'
                          : 'border-[#d9e2ec] bg-[#f8fafc] text-slate-500'
                      }`}
                    >
                      Attiva almeno un box per vedere l’anteprima corretta.
                    </div>
                  ) : null}
                </div>

                <aside className="hidden space-y-6 lg:block">
                  <div
                    className={`rounded-[30px] border p-7 shadow-[0_18px_48px_rgba(0,0,0,0.10)] ${
                      isDark
                        ? 'border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))]'
                        : 'border-[#d9e2ec] bg-white'
                    }`}
                  >
                    <p
                      className={`text-xs uppercase tracking-[0.24em] ${
                        isDark ? 'text-white/45' : 'text-slate-500'
                      }`}
                    >
                      Riferimenti
                    </p>

                    <div className={`mt-5 space-y-4 text-sm ${isDark ? 'text-white/72' : 'text-slate-700'}`}>
                      <div
                        className={`rounded-2xl border px-4 py-4 ${
                          isDark
                            ? 'border-white/10 bg-[rgba(3,9,19,0.55)]'
                            : 'border-[#d9e2ec] bg-[#f8fafc]'
                        }`}
                      >
                        <p
                          className={`text-xs uppercase tracking-[0.2em] ${
                            isDark ? 'text-white/40' : 'text-slate-500'
                          }`}
                        >
                          Sede
                        </p>
                        <p className={`mt-2 leading-6 ${isDark ? 'text-white/80' : 'text-slate-800'}`}>
                          Via A. Locatelli 62
                          <br />
                          24121 Bergamo
                        </p>
                      </div>

                      <div
                        className={`rounded-2xl border px-4 py-4 ${
                          isDark
                            ? 'border-white/10 bg-[rgba(3,9,19,0.55)]'
                            : 'border-[#d9e2ec] bg-[#f8fafc]'
                        }`}
                      >
                        <p
                          className={`text-xs uppercase tracking-[0.2em] ${
                            isDark ? 'text-white/40' : 'text-slate-500'
                          }`}
                        >
                          Telefono
                        </p>
                        <p className={`mt-2 ${isDark ? 'text-white/80' : 'text-slate-800'}`}>
                          035 221206
                        </p>
                      </div>

                      <div
                        className={`rounded-2xl border px-4 py-4 ${
                          isDark
                            ? 'border-white/10 bg-[rgba(3,9,19,0.55)]'
                            : 'border-[#d9e2ec] bg-[#f8fafc]'
                        }`}
                      >
                        <p
                          className={`text-xs uppercase tracking-[0.2em] ${
                            isDark ? 'text-white/40' : 'text-slate-500'
                          }`}
                        >
                          Email
                        </p>
                        <p
                          className={`mt-2 break-all ${
                            isDark ? 'text-white/80' : 'text-slate-800'
                          }`}
                        >
                          info@areaimmobiliare.com
                        </p>
                      </div>
                    </div>

                    <div
                      className={`mt-6 inline-flex w-full items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold ${
                        isDark
                          ? 'bg-white text-black opacity-95'
                          : 'bg-slate-900 text-white'
                      }`}
                    >
                      <span>Contattaci</span>
                    </div>
                  </div>
                </aside>
              </div>
            </section>
          </div>
        </section>
      </div>
    </div>
  )
}