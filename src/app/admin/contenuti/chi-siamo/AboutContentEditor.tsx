'use client'

import { useMemo, useState, useTransition } from 'react'
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

export default function AboutContentEditor({ initialContent }: Props) {
  const [form, setForm] = useState<AboutContent>(initialContent)
  const [saved, setSaved] = useState<AboutContent>(initialContent)
  const [message, setMessage] = useState('')
  const [isPending, startTransition] = useTransition()

  const visibleQuadrants = form.quadrants.filter((item) => item.enabled)

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

  function cancelChanges() {
    setForm(saved)
    setMessage('')
  }

  function restoreDefaults() {
    setForm(defaultAboutContent)
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
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--site-text-faint)]">
              Box 1
            </h2>

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
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--site-text-faint)]">
              Box 2 + quadranti
            </h2>

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
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--site-text-faint)]">
              Box 3
            </h2>

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
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--site-text-faint)]">
              Box 4
            </h2>

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

      <section className="space-y-6">
        <div className="theme-panel rounded-[30px] border p-8">
          <p className="text-sm uppercase tracking-[0.3em] text-[var(--site-text-faint)]">
            Chi siamo
          </p>
          <h2 className="mt-4 text-4xl font-semibold leading-tight text-[var(--site-text)]">
            {form.heroTitle}
          </h2>
          <p className="mt-6 max-w-3xl text-base leading-8 text-[var(--site-text-muted)]">
            {form.heroIntro}
          </p>
        </div>

        <div className="mx-auto w-full max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-8">
              <div className="theme-panel rounded-[30px] border p-8">
                <h3 className="text-2xl font-semibold text-[var(--site-text)]">
                  {form.box1Title}
                </h3>
                <div className="mt-5 space-y-5 text-[var(--site-text-muted)]">
                  <p className="leading-8">{form.box1Paragraph1}</p>
                  <p className="leading-8">{form.box1Paragraph2}</p>
                  <p className="leading-8">{form.box1Paragraph3}</p>
                </div>
              </div>

              <div className="theme-panel rounded-[30px] border p-8">
                <h3 className="text-2xl font-semibold text-[var(--site-text)]">
                  {form.box2Title}
                </h3>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {visibleQuadrants.length > 0 ? (
                    visibleQuadrants.map((item, index) => (
                      <div
                        key={`${item.title}-${index}`}
                        className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-strong)] p-5"
                      >
                        <h4 className="text-lg font-medium text-[var(--site-text)]">
                          {item.title}
                        </h4>
                        <p className="mt-3 text-sm leading-7 text-[var(--site-text-muted)]">
                          {item.text}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-[var(--site-border)] bg-[var(--site-surface-strong)] p-5 text-sm text-[var(--site-text-faint)] md:col-span-2">
                      Nessun quadrante attivo.
                    </div>
                  )}
                </div>
              </div>

              <div className="theme-panel rounded-[30px] border p-8">
                <h3 className="text-2xl font-semibold text-[var(--site-text)]">
                  {form.box3Title}
                </h3>
                <div className="mt-5 space-y-5 text-[var(--site-text-muted)]">
                  <p className="leading-8">{form.box3Paragraph1}</p>
                  <p className="leading-8">{form.box3Paragraph2}</p>
                </div>
              </div>

              <div className="theme-panel rounded-[30px] border p-8">
                <h3 className="text-2xl font-semibold text-[var(--site-text)]">
                  {form.box4Title}
                </h3>
                <p className="mt-5 leading-8 text-[var(--site-text-muted)]">
                  {form.box4Text}
                </p>
              </div>
            </div>

            <aside className="hidden space-y-6 lg:block">
              <div className="theme-panel rounded-[30px] border p-7">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--site-text-faint)]">
                  Riferimenti
                </p>

                <div className="mt-5 space-y-4 text-sm text-[var(--site-text-soft)]">
                  <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-strong)] px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--site-text-faint)]">
                      Sede
                    </p>
                    <p className="mt-2 leading-6">
                      Via A. Locatelli 62
                      <br />
                      24121 Bergamo
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-strong)] px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--site-text-faint)]">
                      Telefono
                    </p>
                    <p className="mt-2">035 221206</p>
                  </div>

                  <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-strong)] px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--site-text-faint)]">
                      Email
                    </p>
                    <p className="mt-2 break-all">info@areaimmobiliare.com</p>
                  </div>
                </div>

                <div className="theme-button-primary mt-6 inline-flex w-full items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold opacity-80">
                  <span>Contattaci</span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  )
}