'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, useTransition } from 'react'
import {
  CONTACTS_CONTENT_KEY,
  contactsLimits,
  defaultContactsContent,
  type ContactsContent,
} from '@/lib/site-content'

type Props = {
  initialContent: ContactsContent
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

function PreviewHeader({ isDark }: { isDark: boolean }) {
  return (
    <div
      className={`border-b ${
        isDark ? 'border-white/10 bg-[#07101d]' : 'border-[#d9e2ec] bg-white'
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
          <span className={isDark ? 'opacity-75' : 'text-slate-600'}>Chi siamo</span>
          <span className={isDark ? 'font-medium text-white' : 'font-medium text-slate-900'}>
            Contatti
          </span>
        </div>
      </div>
    </div>
  )
}

export default function ContactsContentEditor({ initialContent }: Props) {
  const [form, setForm] = useState<ContactsContent>(initialContent)
  const [saved, setSaved] = useState<ContactsContent>(initialContent)
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

  const hasErrors = useMemo(() => {
    return [
      form.heroOverline.length > contactsLimits.heroOverline,
      form.heroTitle.length > contactsLimits.heroTitle,
      form.heroSubtitle.length > contactsLimits.heroSubtitle,
      form.phoneLabel.length > contactsLimits.phoneLabel,
      form.phoneHref.length > contactsLimits.phoneHref,
      form.whatsappNumber.length > contactsLimits.whatsappNumber,
      form.ownerCtaOverline.length > contactsLimits.ownerCtaOverline,
      form.ownerCtaTitle.length > contactsLimits.ownerCtaTitle,
      form.ownerCtaText.length > contactsLimits.ownerCtaText,
      form.ownerCtaButtonLabel.length > contactsLimits.ownerCtaButtonLabel,
      form.ownerCtaPhoneText.length > contactsLimits.ownerCtaPhoneText,
      form.directBoxTitle.length > contactsLimits.directBoxTitle,
      form.directBoxText.length > contactsLimits.directBoxText,
      form.mapBlockedOverline.length > contactsLimits.mapBlockedOverline,
      form.mapBlockedTitle.length > contactsLimits.mapBlockedTitle,
      form.mapBlockedText.length > contactsLimits.mapBlockedText,
      form.mapManageCookiesLabel.length > contactsLimits.mapManageCookiesLabel,
      form.mapOpenLabel.length > contactsLimits.mapOpenLabel,
      form.whatsappDefaultMessage.length > contactsLimits.whatsappDefaultMessage,
      form.whatsappPropertyMessage.length > contactsLimits.whatsappPropertyMessage,
    ].some(Boolean)
  }, [form])

  function updateField<K extends keyof ContactsContent>(
    key: K,
    value: ContactsContent[K]
  ) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }))
    setMessage('')
  }

  function cancelChanges() {
    setForm(saved)
    setMessage('')
  }

  function restoreDefaults() {
    setForm(defaultContactsContent)
    setMessage('')
  }

  async function save() {
    if (hasErrors) return

    setMessage('')

    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/site-content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: CONTACTS_CONTENT_KEY,
            value: form,
          }),
        })

        if (!res.ok) {
          setMessage('Errore durante il salvataggio.')
          return
        }

        setSaved(form)
        setMessage('Contatti salvati correttamente.')
      } catch {
        setMessage('Errore durante il salvataggio.')
      }
    })
  }

  return (
    <div className="space-y-6 text-[var(--site-text)]">
      <section className="theme-panel rounded-[26px] border p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/admin"
            className="inline-flex items-center justify-center rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-surface-2)]"
          >
            ← Torna alla dashboard
          </Link>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={save}
              disabled={isPending || hasErrors}
              className="theme-button-primary inline-flex items-center justify-center rounded-2xl px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
            >
              {isPending ? 'Salvataggio...' : 'Salva contatti'}
            </button>

            <button
              type="button"
              onClick={cancelChanges}
              disabled={isPending}
              className="inline-flex items-center justify-center rounded-2xl border border-[var(--site-border)] px-5 py-2.5 text-sm font-semibold text-[var(--site-text)]"
            >
              Annulla
            </button>

            <button
              type="button"
              onClick={restoreDefaults}
              disabled={isPending}
              className="inline-flex items-center justify-center rounded-2xl border border-[var(--site-border)] px-5 py-2.5 text-sm font-semibold text-[var(--site-text)]"
            >
              Ripristina default
            </button>
          </div>
        </div>

        {message ? (
          <p className="mt-4 text-sm text-[var(--site-text-muted)]">{message}</p>
        ) : null}

        {hasErrors ? (
          <p className="mt-4 text-sm text-red-500">
            Alcuni campi superano il limite e il salvataggio è bloccato.
          </p>
        ) : null}
      </section>

      <div className="grid gap-8 xl:grid-cols-[520px_minmax(0,1fr)]">
        <section className="theme-panel rounded-[30px] border p-6">
          <div className="mb-6">
            <p className="text-sm uppercase tracking-[0.24em] text-[var(--site-text-faint)]">
              Impostazioni sito
            </p>

            <h1 className="mt-3 text-3xl font-semibold">
              Modifica Contatti
            </h1>

            <p className="mt-4 text-sm leading-7 text-[var(--site-text-muted)]">
              Modifica hero, recapiti, box proprietari, box informativo,
              mappa/cookie e messaggi WhatsApp con anteprima live.
            </p>
          </div>

          <div className="space-y-8">
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

        <section
          className={`sticky top-6 max-h-[calc(100vh-3rem)] overflow-hidden rounded-[34px] border shadow-[0_24px_80px_rgba(0,0,0,0.18)] ${
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
            Anteprima Contatti
          </div>

          <PreviewHeader isDark={isDark} />

          <div className="max-h-[calc(100vh-10rem)] overflow-y-auto">
            <ContactPreview content={form} isDark={isDark} />
          </div>
        </section>
      </div>
    </div>
  )
}

function ContactPreview({
  content,
  isDark,
}: {
  content: ContactsContent
  isDark: boolean
}) {
  return (
    <div
      className={`px-6 py-8 ${
        isDark ? 'bg-[#040b16] text-white' : 'bg-[#f5f7fb] text-slate-950'
      }`}
    >
      <div className="mx-auto max-w-5xl">
        <p
          className={`text-xs uppercase tracking-[0.32em] ${
            isDark ? 'text-[#d6b25e]' : 'text-[#9b741d]'
          }`}
        >
          {content.heroOverline}
        </p>

        <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight md:text-5xl">
          {content.heroTitle}
        </h1>

        <p
          className={`mt-6 max-w-3xl text-sm leading-7 ${
            isDark ? 'text-white/68' : 'text-slate-600'
          }`}
        >
          {content.heroSubtitle}
        </p>

        <div className="mt-10 grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="space-y-5">
            <div
              className={`rounded-[30px] border p-6 ${
                isDark
                  ? 'border-white/10 bg-white/[0.04]'
                  : 'border-[#d9e2ec] bg-white'
              }`}
            >
              <p className="text-xs uppercase tracking-[0.28em] opacity-50">
                Recapiti
              </p>

              <div className="mt-5 space-y-4">
                <PreviewMiniBox
                  label="Telefono"
                  value={content.phoneLabel}
                  isDark={isDark}
                />

                <PreviewMiniBox
                  label="Email"
                  value="info@areaimmobiliare.com"
                  isDark={isDark}
                />

                <div
                  className={`rounded-[20px] border p-4 ${
                    isDark
                      ? 'border-white/10 bg-black/15'
                      : 'border-[#e8dcc8] bg-[#fbf7ee]'
                  }`}
                >
                  <p className="text-[11px] uppercase tracking-[0.28em] opacity-45">
                    Indirizzo
                  </p>
                  <div
                    className={`mt-4 space-y-1 text-sm ${
                      isDark ? 'text-white/68' : 'text-slate-600'
                    }`}
                  >
                    <p>Via A. Locatelli 62</p>
                    <p>24121 Bergamo</p>
                  </div>

                  <div className="mt-5 flex items-center justify-center gap-4">
                    <span
                      className={`flex h-11 w-11 items-center justify-center rounded-full border text-xs font-semibold ${
                        isDark
                          ? 'border-white/10 bg-white/5 text-white/70'
                          : 'border-[#e3d7c3] bg-white text-slate-700'
                      }`}
                    >
                      W
                    </span>
                    <span
                      className={`flex h-11 w-11 items-center justify-center rounded-full border text-xs font-semibold ${
                        isDark
                          ? 'border-white/10 bg-white/5 text-white/70'
                          : 'border-[#e3d7c3] bg-white text-slate-700'
                      }`}
                    >
                      G
                    </span>
                  </div>
                </div>
              </div>

              <button className="mt-6 w-full rounded-2xl bg-[#d6b25e] px-5 py-3 text-sm font-semibold text-black">
                {content.mapOpenLabel}
              </button>
            </div>

            <div className="rounded-[30px] border border-[#c8a24a] bg-[#dff3ff] p-6 text-black">
              <p className="text-xs uppercase tracking-[0.24em] text-black/55">
                {content.ownerCtaOverline}
              </p>
              <h2 className="mt-3 text-xl font-semibold">
                {content.ownerCtaTitle}
              </h2>
              <p className="mt-4 text-sm leading-7 text-black/70">
                {content.ownerCtaText}
              </p>
              <button className="mt-5 w-full rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white">
                {content.ownerCtaButtonLabel}
              </button>
            </div>
          </aside>

          <div className="space-y-5">
            <div
              className={`rounded-[30px] border p-6 ${
                isDark
                  ? 'border-white/10 bg-white/[0.04]'
                  : 'border-[#d9e2ec] bg-white'
              }`}
            >
              <h2 className="text-xl font-semibold">
                {content.directBoxTitle}
              </h2>
              <p
                className={`mt-4 text-sm leading-7 ${
                  isDark ? 'text-white/68' : 'text-slate-600'
                }`}
              >
                {content.directBoxText}
              </p>
            </div>

            <div
              className={`flex min-h-[340px] flex-col items-center justify-center rounded-[30px] border p-6 text-center ${
                isDark
                  ? 'border-white/10 bg-white/[0.04]'
                  : 'border-[#d9e2ec] bg-white'
              }`}
            >
              <p className="text-xs uppercase tracking-[0.24em] opacity-45">
                {content.mapBlockedOverline}
              </p>
              <h3 className="mt-3 text-2xl font-semibold">
                {content.mapBlockedTitle}
              </h3>
              <p
                className={`mt-4 max-w-xl text-sm leading-7 ${
                  isDark ? 'text-white/68' : 'text-slate-600'
                }`}
              >
                {content.mapBlockedText}
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button className="rounded-2xl bg-[#d6b25e] px-5 py-3 text-sm font-semibold text-black">
                  {content.mapManageCookiesLabel}
                </button>
                <button
                  className={`rounded-2xl border px-5 py-3 text-sm ${
                    isDark
                      ? 'border-white/10 text-white/80'
                      : 'border-[#d9e2ec] text-slate-700'
                  }`}
                >
                  {content.mapOpenLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PreviewMiniBox({
  label,
  value,
  isDark,
}: {
  label: string
  value: string
  isDark: boolean
}) {
  return (
    <div
      className={`rounded-[20px] border p-4 ${
        isDark
          ? 'border-white/10 bg-black/15'
          : 'border-[#e8dcc8] bg-[#fbf7ee]'
      }`}
    >
      <p className="text-[11px] uppercase tracking-[0.28em] opacity-45">
        {label}
      </p>
      <p
        className={`mt-3 text-sm ${
          isDark ? 'text-white/68' : 'text-slate-600'
        }`}
      >
        {value}
      </p>
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
  const isError = value.length > limit

  return (
    <div>
      <FieldLabel label={label} current={value.length} max={limit} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-2xl border bg-[var(--site-surface)] px-4 py-3 text-sm text-[var(--site-text)] outline-none placeholder:text-[var(--site-text-faint)] ${
          isError
            ? 'border-red-500'
            : 'border-[var(--site-border)] focus:border-[var(--site-border-strong)]'
        }`}
      />
    </div>
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
  const isError = value.length > limit

  return (
    <div>
      <FieldLabel label={label} current={value.length} max={limit} />
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className={`w-full rounded-2xl border bg-[var(--site-surface)] px-4 py-3 text-sm leading-7 text-[var(--site-text)] outline-none placeholder:text-[var(--site-text-faint)] ${
          isError
            ? 'border-red-500'
            : 'border-[var(--site-border)] focus:border-[var(--site-border-strong)]'
        }`}
      />
      {hint ? (
        <p className="mt-1 text-xs text-[var(--site-text-muted)]">{hint}</p>
      ) : null}
    </div>
  )
}
