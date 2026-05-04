'use client'

import { useRef, useState } from 'react'
import AiSparklesMark from '@/components/admin/AiSparklesMark'

type GeneratedNews = {
  title: string
  brief: string
  content: string
  plainContent: string
  keyPoints: string[]
  sourcePdfUrl?: string
  pdfFileName?: string
}

type ApiResponse = Partial<GeneratedNews> & {
  ok?: boolean
  error?: string
}

async function readApiResponse(response: Response): Promise<ApiResponse> {
  const contentType = response.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    return response.json()
  }

  const text = await response.text()
  const clean = text
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 220)

  return {
    error:
      clean ||
      `Risposta non JSON dal server. HTTP ${response.status} ${response.statusText}`,
  }
}

function CopyButton({
  value,
  label = 'Copia',
}: {
  value: string
  label?: string
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1400)
    } catch {
      setCopied(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded-xl border border-[var(--site-border)] bg-[var(--site-surface)] px-3 py-2 text-xs font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-surface-2)]"
    >
      {copied ? 'Copiato' : label}
    </button>
  )
}

function CopyHtmlButton({
  html,
  plain,
}: {
  html: string
  plain: string
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      if ('ClipboardItem' in window) {
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': new Blob([html], { type: 'text/html' }),
            'text/plain': new Blob([plain], { type: 'text/plain' }),
          }),
        ])
      } else {
        await navigator.clipboard.writeText(plain)
      }

      setCopied(true)
      window.setTimeout(() => setCopied(false), 1400)
    } catch {
      try {
        await navigator.clipboard.writeText(plain)
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1400)
      } catch {
        setCopied(false)
      }
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded-xl border border-[var(--site-border)] bg-[var(--site-surface)] px-3 py-2 text-xs font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-surface-2)]"
    >
      {copied ? 'Copiato' : 'Copia formattato'}
    </button>
  )
}

export default function AiNewsButton() {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [generated, setGenerated] = useState<GeneratedNews | null>(null)

  const openPicker = () => {
    if (loading) return
    inputRef.current?.click()
  }

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    setLoading(true)
    setMessage(null)
    setGenerated(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/admin/news/ai-from-pdf', {
        method: 'POST',
        body: formData,
        credentials: 'same-origin',
      })

      const data = await readApiResponse(response)

      if (!response.ok) {
        throw new Error(
          data?.error ||
            `Errore server AI News. HTTP ${response.status} ${response.statusText}`
        )
      }

      setGenerated({
        title: data.title || '',
        brief: data.brief || '',
        content: data.content || '',
        plainContent: data.plainContent || '',
        keyPoints: Array.isArray(data.keyPoints) ? data.keyPoints : [],
        sourcePdfUrl: data.sourcePdfUrl || '',
        pdfFileName: data.pdfFileName || '',
      })

      setMessage(
        'Bozza news generata. Il PDF è stato salvato e il link è stato aggiunto in fondo al testo.'
      )
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Errore durante l’analisi del PDF.'
      )
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <section className="theme-admin-card rounded-3xl p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="theme-admin-faint text-xs uppercase tracking-[0.22em]">
            Assistente editoriale
          </p>
          <h3 className="mt-2 text-xl font-semibold text-[var(--site-text)]">
            Genera una bozza news da PDF
          </h3>
          <p className="theme-admin-muted mt-2 max-w-2xl text-sm">
            Carica un PDF: il sistema legge il testo, genera la bozza news,
            rinomina il file e lo rende disponibile come fonte PDF completa.
          </p>
        </div>

        <div className="flex flex-col items-start gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={handleFileChange}
          />

          <button
            type="button"
            onClick={openPicker}
            disabled={loading}
            className="ai-premium-button inline-flex min-w-[185px] items-center justify-center px-5 py-3 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="ai-premium-button__content">
              <AiSparklesMark
                variant="gradient"
                className="ai-premium-button__icon h-[24px] w-auto shrink-0"
              />
              <span className="ai-premium-button__text text-sm font-semibold">
                {loading ? 'Analisi PDF...' : 'AI News'}
              </span>
            </span>
          </button>

          {message ? (
            <p className="max-w-xs text-xs leading-5 text-[var(--site-text-muted)]">
              {message}
            </p>
          ) : null}
        </div>
      </div>

      {generated ? (
        <div className="mt-5 grid gap-4">
          <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="theme-admin-faint text-xs uppercase tracking-[0.2em]">
                Titolo
              </p>
              <CopyButton value={generated.title} />
            </div>
            <p className="text-base font-semibold text-[var(--site-text)]">
              {generated.title}
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="theme-admin-faint text-xs uppercase tracking-[0.2em]">
                Brief
              </p>
              <CopyButton value={generated.brief} />
            </div>
            <p className="text-sm leading-7 text-[var(--site-text-muted)]">
              {generated.brief}
            </p>
          </div>

          {generated.sourcePdfUrl ? (
            <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="theme-admin-faint text-xs uppercase tracking-[0.2em]">
                  PDF salvato
                </p>
                <CopyButton value={generated.sourcePdfUrl} />
              </div>
              <p className="text-sm font-semibold text-[var(--site-text)]">
                {generated.pdfFileName}
              </p>
              <p className="mt-2 break-all text-sm leading-7 text-[var(--site-text-muted)]">
                {generated.sourcePdfUrl}
              </p>
            </div>
          ) : null}

          <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="theme-admin-faint text-xs uppercase tracking-[0.2em]">
                Corpo news
              </p>
              <div className="flex flex-wrap gap-2">
                <CopyHtmlButton
                  html={generated.content}
                  plain={generated.plainContent || generated.content}
                />
                <CopyButton
                  value={generated.plainContent || generated.content}
                  label="Copia testo"
                />
              </div>
            </div>
            <div
              className="prose prose-sm max-h-[360px] max-w-none overflow-auto rounded-xl bg-[var(--site-bg-soft)] p-4 leading-7 text-[var(--site-text-muted)] prose-headings:text-[var(--site-text)] prose-p:text-[var(--site-text-muted)] prose-li:text-[var(--site-text-muted)]"
              dangerouslySetInnerHTML={{ __html: generated.content }}
            />
          </div>
        </div>
      ) : null}
    </section>
  )
}
