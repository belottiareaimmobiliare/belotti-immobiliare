'use client'

import Link from 'next/link'
import { useMemo, useState, useTransition } from 'react'
import {
  GIANFEDERICO_BELOTTI_CONTENT_KEY,
  defaultGianfedericoBelottiContent,
  gianfedericoBelottiLimits,
  type GianfedericoBelottiContent,
} from '@/lib/site-content'

type Props = {
  initialContent: GianfedericoBelottiContent
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

function InputField({
  label,
  value,
  max,
  onChange,
}: {
  label: string
  value: string
  max: number
  onChange: (value: string) => void
}) {
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

function TextareaField({
  label,
  value,
  max,
  rows = 5,
  onChange,
}: {
  label: string
  value: string
  max: number
  rows?: number
  onChange: (value: string) => void
}) {
  const isError = value.length > max

  return (
    <div>
      <FieldLabel label={label} current={value.length} max={max} />
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className={`w-full rounded-2xl border bg-[var(--site-surface)] px-4 py-3 text-sm leading-7 text-[var(--site-text)] outline-none transition ${
          isError
            ? 'border-red-500'
            : 'border-[var(--site-border)] focus:border-[var(--site-border-strong)]'
        }`}
      />
    </div>
  )
}

export default function GianfedericoBelottiContentEditor({
  initialContent,
}: Props) {
  const [form, setForm] = useState<GianfedericoBelottiContent>(initialContent)
  const [saved, setSaved] = useState<GianfedericoBelottiContent>(initialContent)
  const [message, setMessage] = useState('')
  const [isPending, startTransition] = useTransition()

  const visibleBoxes = form.boxes.filter((item) => item.enabled)
  const noActiveBoxes = visibleBoxes.length === 0

  const hasErrors = useMemo(() => {
    const checks = [
      form.heroOverline.length > gianfedericoBelottiLimits.heroOverline,
      form.heroTitle.length > gianfedericoBelottiLimits.heroTitle,
      form.heroIntro1.length > gianfedericoBelottiLimits.heroIntro,
      form.heroIntro2.length > gianfedericoBelottiLimits.heroIntro,
      form.primaryCtaLabel.length > gianfedericoBelottiLimits.ctaLabel,
      form.secondaryCtaLabel.length > gianfedericoBelottiLimits.ctaLabel,
      form.methodTitle.length > gianfedericoBelottiLimits.methodTitle,
      form.sidebarOverline.length > gianfedericoBelottiLimits.sidebarOverline,
      form.sidebarTitle.length > gianfedericoBelottiLimits.sidebarTitle,
      form.sidebarText.length > gianfedericoBelottiLimits.sidebarText,
      form.phoneLabel.length > gianfedericoBelottiLimits.phoneLabel,
      form.phoneHref.length > gianfedericoBelottiLimits.phoneHref,
      form.consultationCtaLabel.length > gianfedericoBelottiLimits.ctaLabel,
      ...form.highlights.flatMap((item) => [
        item.label.length > gianfedericoBelottiLimits.highlightLabel,
        item.text.length > gianfedericoBelottiLimits.highlightText,
      ]),
      ...form.boxes.flatMap((item) => [
        item.title.length > gianfedericoBelottiLimits.boxTitle,
        item.paragraph1.length > gianfedericoBelottiLimits.boxParagraph,
        item.paragraph2.length > gianfedericoBelottiLimits.boxParagraph,
      ]),
      ...form.methodCards.flatMap((item) => [
        item.title.length > gianfedericoBelottiLimits.methodCardTitle,
        item.text.length > gianfedericoBelottiLimits.methodCardText,
      ]),
    ]

    return checks.some(Boolean)
  }, [form])

  const saveBlocked = hasErrors || noActiveBoxes

  function update<K extends keyof GianfedericoBelottiContent>(
    key: K,
    value: GianfedericoBelottiContent[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setMessage('')
  }

  function updateHighlight(
    index: number,
    field: 'enabled' | 'label' | 'text',
    value: boolean | string
  ) {
    setForm((prev) => ({
      ...prev,
      highlights: prev.highlights.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }))
    setMessage('')
  }

  function updateBox(
    index: number,
    field: 'enabled' | 'title' | 'paragraph1' | 'paragraph2',
    value: boolean | string
  ) {
    setForm((prev) => ({
      ...prev,
      boxes: prev.boxes.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }))
    setMessage('')
  }

  function updateMethodCard(
    index: number,
    field: 'enabled' | 'title' | 'text',
    value: boolean | string
  ) {
    setForm((prev) => ({
      ...prev,
      methodCards: prev.methodCards.map((item, i) =>
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
    setForm(defaultGianfedericoBelottiContent)
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
            key: GIANFEDERICO_BELOTTI_CONTENT_KEY,
            value: form,
          }),
        })

        if (!res.ok) {
          setMessage('Errore durante il salvataggio.')
          return
        }

        setSaved(form)
        setMessage('Pagina Gianfederico Belotti aggiornata correttamente.')
      } catch {
        setMessage('Errore durante il salvataggio.')
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="theme-panel rounded-[26px] border p-4 sm:p-5">
        <Link
          href="/admin"
          className="inline-flex items-center justify-center rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-surface-2)]"
        >
          ← Torna alla dashboard
        </Link>
      </div>

      <div className="grid gap-8 xl:grid-cols-[560px_minmax(0,1fr)]">
        <section className="theme-panel rounded-[30px] border p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-[var(--site-text)]">
              Modifica Gianfederico Belotti
            </h1>
            <p className="mt-2 text-sm text-[var(--site-text-muted)]">
              Gestisci testi, box principali, card laterali e CTA della pagina personale SEO.
            </p>
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--site-text-faint)]">
                Hero
              </h2>

              <InputField
                label="Sopratitolo"
                value={form.heroOverline}
                max={gianfedericoBelottiLimits.heroOverline}
                onChange={(value) => update('heroOverline', value)}
              />

              <TextareaField
                label="Titolo hero"
                value={form.heroTitle}
                max={gianfedericoBelottiLimits.heroTitle}
                rows={3}
                onChange={(value) => update('heroTitle', value)}
              />

              <TextareaField
                label="Introduzione 1"
                value={form.heroIntro1}
                max={gianfedericoBelottiLimits.heroIntro}
                rows={5}
                onChange={(value) => update('heroIntro1', value)}
              />

              <TextareaField
                label="Introduzione 2"
                value={form.heroIntro2}
                max={gianfedericoBelottiLimits.heroIntro}
                rows={5}
                onChange={(value) => update('heroIntro2', value)}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <InputField
                  label="CTA primaria"
                  value={form.primaryCtaLabel}
                  max={gianfedericoBelottiLimits.ctaLabel}
                  onChange={(value) => update('primaryCtaLabel', value)}
                />

                <InputField
                  label="CTA secondaria"
                  value={form.secondaryCtaLabel}
                  max={gianfedericoBelottiLimits.ctaLabel}
                  onChange={(value) => update('secondaryCtaLabel', value)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--site-text-faint)]">
                Box sintetici
              </h2>

              {form.highlights.map((item, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] p-4"
                >
                  <label className="mb-4 flex items-center gap-3 text-sm text-[var(--site-text)]">
                    <input
                      type="checkbox"
                      checked={item.enabled}
                      onChange={(e) => updateHighlight(index, 'enabled', e.target.checked)}
                    />
                    Mostra box sintetico {index + 1}
                  </label>

                  <InputField
                    label={`Titolo box sintetico ${index + 1}`}
                    value={item.label}
                    max={gianfedericoBelottiLimits.highlightLabel}
                    onChange={(value) => updateHighlight(index, 'label', value)}
                  />

                  <div className="mt-4">
                    <TextareaField
                      label={`Testo box sintetico ${index + 1}`}
                      value={item.text}
                      max={gianfedericoBelottiLimits.highlightText}
                      rows={3}
                      onChange={(value) => updateHighlight(index, 'text', value)}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--site-text-faint)]">
                Box principali pagina
              </h2>

              {form.boxes.map((item, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] p-4"
                >
                  <label className="mb-4 flex items-center gap-3 text-sm text-[var(--site-text)]">
                    <input
                      type="checkbox"
                      checked={item.enabled}
                      onChange={(e) => updateBox(index, 'enabled', e.target.checked)}
                    />
                    Mostra box principale {index + 1}
                  </label>

                  <InputField
                    label={`Titolo box ${index + 1}`}
                    value={item.title}
                    max={gianfedericoBelottiLimits.boxTitle}
                    onChange={(value) => updateBox(index, 'title', value)}
                  />

                  <div className="mt-4">
                    <TextareaField
                      label={`Paragrafo 1 box ${index + 1}`}
                      value={item.paragraph1}
                      max={gianfedericoBelottiLimits.boxParagraph}
                      rows={6}
                      onChange={(value) => updateBox(index, 'paragraph1', value)}
                    />
                  </div>

                  <div className="mt-4">
                    <TextareaField
                      label={`Paragrafo 2 box ${index + 1}`}
                      value={item.paragraph2}
                      max={gianfedericoBelottiLimits.boxParagraph}
                      rows={6}
                      onChange={(value) => updateBox(index, 'paragraph2', value)}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--site-text-faint)]">
                Sidebar metodo
              </h2>

              <InputField
                label="Titolo gruppo metodo"
                value={form.methodTitle}
                max={gianfedericoBelottiLimits.methodTitle}
                onChange={(value) => update('methodTitle', value)}
              />

              {form.methodCards.map((item, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] p-4"
                >
                  <label className="mb-4 flex items-center gap-3 text-sm text-[var(--site-text)]">
                    <input
                      type="checkbox"
                      checked={item.enabled}
                      onChange={(e) => updateMethodCard(index, 'enabled', e.target.checked)}
                    />
                    Mostra card metodo {index + 1}
                  </label>

                  <InputField
                    label={`Titolo card metodo ${index + 1}`}
                    value={item.title}
                    max={gianfedericoBelottiLimits.methodCardTitle}
                    onChange={(value) => updateMethodCard(index, 'title', value)}
                  />

                  <div className="mt-4">
                    <TextareaField
                      label={`Testo card metodo ${index + 1}`}
                      value={item.text}
                      max={gianfedericoBelottiLimits.methodCardText}
                      rows={4}
                      onChange={(value) => updateMethodCard(index, 'text', value)}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--site-text-faint)]">
                Sidebar contatto
              </h2>

              <InputField
                label="Sopratitolo sidebar"
                value={form.sidebarOverline}
                max={gianfedericoBelottiLimits.sidebarOverline}
                onChange={(value) => update('sidebarOverline', value)}
              />

              <InputField
                label="Titolo sidebar"
                value={form.sidebarTitle}
                max={gianfedericoBelottiLimits.sidebarTitle}
                onChange={(value) => update('sidebarTitle', value)}
              />

              <TextareaField
                label="Testo sidebar"
                value={form.sidebarText}
                max={gianfedericoBelottiLimits.sidebarText}
                rows={4}
                onChange={(value) => update('sidebarText', value)}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <InputField
                  label="Telefono visibile"
                  value={form.phoneLabel}
                  max={gianfedericoBelottiLimits.phoneLabel}
                  onChange={(value) => update('phoneLabel', value)}
                />

                <InputField
                  label="Telefono link tel:"
                  value={form.phoneHref}
                  max={gianfedericoBelottiLimits.phoneHref}
                  onChange={(value) => update('phoneHref', value)}
                />
              </div>

              <InputField
                label="CTA consulenza"
                value={form.consultationCtaLabel}
                max={gianfedericoBelottiLimits.ctaLabel}
                onChange={(value) => update('consultationCtaLabel', value)}
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
              Deve rimanere almeno 1 box principale attivo.
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

        <section className="theme-panel h-fit rounded-[30px] border p-6 xl:sticky xl:top-24">
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--site-text-faint)]">
            Anteprima rapida
          </p>

          <h2 className="mt-3 text-3xl font-semibold leading-tight text-[var(--site-text)]">
            {form.heroTitle}
          </h2>

          <div className="mt-5 space-y-4 text-sm leading-7 text-[var(--site-text-muted)]">
            <p>{form.heroIntro1}</p>
            <p>{form.heroIntro2}</p>
          </div>

          <div className="mt-6 grid gap-3">
            {form.highlights
              .filter((item) => item.enabled)
              .map((item, index) => (
                <div
                  key={`${item.label}-${index}`}
                  className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-strong)] p-4"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--site-text-faint)]">
                    {item.label}
                  </p>
                  <p className="mt-2 text-xs leading-6 text-[var(--site-text-muted)]">
                    {item.text}
                  </p>
                </div>
              ))}
          </div>

          <div className="mt-6 space-y-4">
            {visibleBoxes.slice(0, 3).map((item, index) => (
              <div
                key={`${item.title}-${index}`}
                className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-strong)] p-4"
              >
                <h3 className="text-sm font-semibold text-[var(--site-text)]">
                  {item.title}
                </h3>
                <p className="mt-2 line-clamp-4 text-xs leading-6 text-[var(--site-text-muted)]">
                  {item.paragraph1}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
