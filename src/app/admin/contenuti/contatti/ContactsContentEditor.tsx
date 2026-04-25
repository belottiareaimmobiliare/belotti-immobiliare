'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  CONTACTS_CONTENT_KEY,
  contactsLimits,
  type ContactsContent,
} from '@/lib/site-content'

type Props = {
  initialContent: ContactsContent
}

export default function ContactsContentEditor({ initialContent }: Props) {
  const [form, setForm] = useState<ContactsContent>(initialContent)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  function updateField<K extends keyof ContactsContent>(
    key: K,
    value: ContactsContent[K]
  ) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  async function save() {
    setSaving(true)
    setMessage('')

    const res = await fetch('/api/admin/site-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: CONTACTS_CONTENT_KEY,
        value: form,
      }),
    })

    setSaving(false)

    if (!res.ok) {
      setMessage('Errore durante il salvataggio.')
      return
    }

    setMessage('Contatti salvati correttamente.')
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 text-[var(--site-text)]">
      <section className="theme-panel rounded-[26px] border p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/admin"
            className="inline-flex items-center justify-center rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-surface-2)]"
          >
            ← Torna alla dashboard
          </Link>

          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="theme-button-primary inline-flex items-center justify-center rounded-2xl px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            {saving ? 'Salvataggio...' : 'Salva contatti'}
          </button>
        </div>

        {message ? (
          <p className="mt-4 text-sm text-[var(--site-text-muted)]">{message}</p>
        ) : null}
      </section>

      <section className="theme-panel rounded-[34px] border p-6 md:p-8">
        <p className="text-sm uppercase tracking-[0.24em] text-[var(--site-text-faint)]">
          Impostazioni sito
        </p>

        <h1 className="mt-3 text-3xl font-semibold md:text-4xl">
          Contatti e WhatsApp
        </h1>

        <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--site-text-muted)]">
          Modifica telefono, numero WhatsApp, testo del palloncino e messaggi
          precompilati usati nel sito pubblico.
        </p>

        <div className="mt-8 grid gap-5">
          <Field
            label="Telefono visualizzato"
            value={form.phoneLabel}
            limit={contactsLimits.phoneLabel}
            onChange={(v) => updateField('phoneLabel', v)}
            placeholder="035 221206"
          />

          <Field
            label="Telefono per link chiamata"
            value={form.phoneHref}
            limit={contactsLimits.phoneHref}
            onChange={(v) => updateField('phoneHref', v.replace(/\s+/g, ''))}
            placeholder="035221206"
          />

          <Field
            label="Numero WhatsApp"
            value={form.whatsappNumber}
            limit={contactsLimits.whatsappNumber}
            onChange={(v) => updateField('whatsappNumber', v.replace(/[^\d]/g, ''))}
            placeholder="393938149279"
          />

          <Field
            label="Titolo palloncino"
            value={form.ownerCtaTitle}
            limit={contactsLimits.ownerCtaTitle}
            onChange={(v) => updateField('ownerCtaTitle', v)}
            placeholder="Sei proprietario di un immobile?"
          />

          <TextArea
            label="Testo palloncino"
            value={form.ownerCtaText}
            limit={contactsLimits.ownerCtaText}
            onChange={(v) => updateField('ownerCtaText', v)}
            placeholder="Vuoi venderlo, affittarlo o farlo valutare?"
          />

          <Field
            label="Frase prima del telefono"
            value={form.ownerCtaPhoneText}
            limit={contactsLimits.ownerCtaPhoneText}
            onChange={(v) => updateField('ownerCtaPhoneText', v)}
            placeholder="Chiamaci al"
          />

          <TextArea
            label="Messaggio WhatsApp generico"
            value={form.whatsappDefaultMessage}
            limit={contactsLimits.whatsappDefaultMessage}
            onChange={(v) => updateField('whatsappDefaultMessage', v)}
            placeholder="Ciao, sono proprietario..."
          />

          <TextArea
            label="Messaggio WhatsApp da scheda immobile"
            value={form.whatsappPropertyMessage}
            limit={contactsLimits.whatsappPropertyMessage}
            onChange={(v) => updateField('whatsappPropertyMessage', v)}
            placeholder="Ciao, ho visto questo immobile: {url}"
            hint="Usa {url} dove vuoi inserire il link dell’immobile."
          />
        </div>
      </section>
    </div>
  )
}

function Field({
  label,
  value,
  limit,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  limit: number
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold">{label}</span>
      <input
        value={value}
        maxLength={limit}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-3 text-sm outline-none"
      />
      <span className="mt-1 block text-xs text-[var(--site-text-muted)]">
        {value.length}/{limit}
      </span>
    </label>
  )
}

function TextArea({
  label,
  value,
  limit,
  onChange,
  placeholder,
  hint,
}: {
  label: string
  value: string
  limit: number
  onChange: (value: string) => void
  placeholder: string
  hint?: string
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold">{label}</span>
      <textarea
        value={value}
        maxLength={limit}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-3 text-sm leading-7 outline-none"
      />
      <span className="mt-1 block text-xs text-[var(--site-text-muted)]">
        {hint ? `${hint} · ` : ''}
        {value.length}/{limit}
      </span>
    </label>
  )
}
