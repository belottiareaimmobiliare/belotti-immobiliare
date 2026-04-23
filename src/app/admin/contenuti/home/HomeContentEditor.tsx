'use client'

import { useMemo, useState, useTransition } from 'react'
import {
  HOME_CONTENT_KEY,
  defaultHomeContent,
  homeLimits,
  type HomeContent,
} from '@/lib/site-content'

type Props = {
  initialContent: HomeContent
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

export default function HomeContentEditor({ initialContent }: Props) {
  const [form, setForm] = useState<HomeContent>(initialContent)
  const [saved, setSaved] = useState<HomeContent>(initialContent)
  const [message, setMessage] = useState('')
  const [isPending, startTransition] = useTransition()

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

  function update<K extends keyof HomeContent>(key: K, value: HomeContent[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
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

          <div>
            <FieldLabel
              label="Box 1"
              current={form.stat1.length}
              max={homeLimits.stat1}
            />
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

          <div>
            <FieldLabel
              label="Box 2"
              current={form.stat2.length}
              max={homeLimits.stat2}
            />
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

          <div>
            <FieldLabel
              label="Box 3"
              current={form.stat3.length}
              max={homeLimits.stat3}
            />
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

      <section className="overflow-hidden rounded-[34px] border border-white/15 bg-[#09101b]">
        <div className="border-b border-white/10 px-6 py-4 text-sm text-white/72">
          Anteprima Home
        </div>

        <div className="p-6 md:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.34em] text-white/90">
            {form.overline}
          </p>

          <h2 className="mt-6 max-w-[820px] text-4xl font-semibold leading-tight text-white md:text-6xl">
            {form.title}
          </h2>

          <p className="mt-6 max-w-[760px] text-base leading-8 text-white/84 md:text-lg">
            {form.subtitle}
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              ['Storia', form.stat1],
              ['Territorio', form.stat2],
              ['Metodo', form.stat3],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-[24px] border border-white/20 bg-white/[0.10] px-5 py-5 backdrop-blur-md"
              >
                <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-white/80">
                  {label}
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}