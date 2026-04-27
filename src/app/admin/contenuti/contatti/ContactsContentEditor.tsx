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
          Contatti
        </h1>

        <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--site-text-muted)]">
          Modifica hero, recapiti, palloncino proprietari, box informativo,
          mappa/cookie e messaggi WhatsApp.
        </p>

        <div className="mt-8 space-y-10">
          <EditorSection title="Hero pagina contatti">
            <Field
              label="Sopratitolo hero"
              value={form.heroOverline}
              limit={contactsLimits.heroOverline}
              onChange={(v) => updateField('heroOverline', v)}
              placeholder="Contatti"
            />

            <Field
              label="Titolo hero"
              value={form.heroTitle}
              limit={contactsLimits.heroTitle}
              onChange={(v) => updateField('heroTitle', v)}
              placeholder="Siamo a disposizione..."
            />

            <TextArea
              label="Sottotitolo hero"
              value={form.heroSubtitle}
              limit={contactsLimits.heroSubtitle}
              onChange={(v) => updateField('heroSubtitle', v)}
              placeholder="Per richieste su immobili..."
            />
          </EditorSection>

          <EditorSection title="Recapiti e WhatsApp">
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
          </EditorSection>

          <EditorSection title="Palloncino proprietari">
            <Field
              label="Sopratitolo palloncino"
              value={form.ownerCtaOverline}
              limit={contactsLimits.ownerCtaOverline}
              onChange={(v) => updateField('ownerCtaOverline', v)}
              placeholder="Proprietari"
            />

            <Field
              label="Titolo palloncino"
              value={form.ownerCtaTitle}
              limit={contactsLimits.ownerCtaTitle}
              onChange={(v) => updateField('ownerCtaTitle', v)}
              placeholder="Hai un immobile da vendere o affittare?"
            />

            <TextArea
              label="Testo palloncino"
              value={form.ownerCtaText}
              limit={contactsLimits.ownerCtaText}
              onChange={(v) => updateField('ownerCtaText', v)}
              placeholder="Raccontaci cosa vuoi fare..."
            />

            <Field
              label="Testo pulsante palloncino"
              value={form.ownerCtaButtonLabel}
              limit={contactsLimits.ownerCtaButtonLabel}
              onChange={(v) => updateField('ownerCtaButtonLabel', v)}
              placeholder="Parla con l’agenzia"
            />

            <Field
              label="Frase prima del telefono"
              value={form.ownerCtaPhoneText}
              limit={contactsLimits.ownerCtaPhoneText}
              onChange={(v) => updateField('ownerCtaPhoneText', v)}
              placeholder="Chiamaci al"
            />
          </EditorSection>

          <EditorSection title="Box contatto diretto">
            <Field
              label="Titolo box"
              value={form.directBoxTitle}
              limit={contactsLimits.directBoxTitle}
              onChange={(v) => updateField('directBoxTitle', v)}
              placeholder="Un contatto diretto e professionale"
            />

            <TextArea
              label="Testo box"
              value={form.directBoxText}
              limit={contactsLimits.directBoxText}
              onChange={(v) => updateField('directBoxText', v)}
              placeholder="Ogni richiesta viene valutata..."
            />
          </EditorSection>

          <EditorSection title="Mappa e cookie">
            <Field
              label="Sopratitolo mappa bloccata"
              value={form.mapBlockedOverline}
              limit={contactsLimits.mapBlockedOverline}
              onChange={(v) => updateField('mapBlockedOverline', v)}
              placeholder="Contenuto esterno"
            />

            <Field
              label="Titolo mappa bloccata"
              value={form.mapBlockedTitle}
              limit={contactsLimits.mapBlockedTitle}
              onChange={(v) => updateField('mapBlockedTitle', v)}
              placeholder="La mappa è disattivata..."
            />

            <TextArea
              label="Testo mappa bloccata"
              value={form.mapBlockedText}
              limit={contactsLimits.mapBlockedText}
              onChange={(v) => updateField('mapBlockedText', v)}
              placeholder="Per visualizzare la mappa..."
            />

            <Field
              label="Pulsante gestione cookie"
              value={form.mapManageCookiesLabel}
              limit={contactsLimits.mapManageCookiesLabel}
              onChange={(v) => updateField('mapManageCookiesLabel', v)}
              placeholder="Gestisci cookie per visualizzare la mappa"
            />

            <Field
              label="Pulsante apertura mappa"
              value={form.mapOpenLabel}
              limit={contactsLimits.mapOpenLabel}
              onChange={(v) => updateField('mapOpenLabel', v)}
              placeholder="Apri su Google Maps"
            />
          </EditorSection>

          <EditorSection title="Messaggi WhatsApp">
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
          </EditorSection>
        </div>
      </section>
    </div>
  )
}

function EditorSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-[26px] border border-[var(--site-border)] bg-[var(--site-surface-strong)] p-5">
      <h2 className="text-xl font-semibold text-[var(--site-text)]">{title}</h2>
      <div className="mt-5 grid gap-5">{children}</div>
    </section>
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
        className="w-full rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-3 text-sm text-[var(--site-text)] outline-none placeholder:text-[var(--site-text-faint)]"
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
        className="w-full rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-3 text-sm leading-7 text-[var(--site-text)] outline-none placeholder:text-[var(--site-text-faint)]"
      />
      <span className="mt-1 block text-xs text-[var(--site-text-muted)]">
        {hint ? `${hint} · ` : ''}
        {value.length}/{limit}
      </span>
    </label>
  )
}
