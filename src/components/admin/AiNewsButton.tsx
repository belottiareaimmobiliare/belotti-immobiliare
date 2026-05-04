'use client'

import { useState } from 'react'
import AiSparklesMark from '@/components/admin/AiSparklesMark'

type GeneratedPayload = {
  title: string
  brief: string
  content: string
  plainContent: string
  sourceName?: string
  sourceUrl?: string
  externalUrl?: string
  sourcePdfUrl?: string
  pdfFileName?: string
}

type AiNewsButtonProps = {
  pdfFile: File | null
  onGenerated: (payload: GeneratedPayload) => void
}

type ApiResponse = Partial<GeneratedPayload> & {
  ok?: boolean
  error?: string
  keyPoints?: string[]
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

export default function AiNewsButton({
  pdfFile,
  onGenerated,
}: AiNewsButtonProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!pdfFile) {
      setMessage('Carica prima un PDF.')
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const formData = new FormData()
      formData.append('file', pdfFile)

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

      const sourcePdfUrl = data.sourcePdfUrl || ''

      onGenerated({
        title: data.title || '',
        brief: data.brief || '',
        content: data.content || '',
        plainContent: data.plainContent || '',
        sourceName: sourcePdfUrl ? 'PDF completo' : 'PDF caricato',
        sourceUrl: sourcePdfUrl,
        externalUrl: sourcePdfUrl,
        sourcePdfUrl,
        pdfFileName: data.pdfFileName || '',
      })

      setMessage(
        sourcePdfUrl
          ? 'Bozza generata e PDF salvato come fonte.'
          : 'Bozza news generata.'
      )
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Errore durante l’analisi del PDF.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleGenerate}
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
        <p className="max-w-[240px] text-xs leading-5 text-[var(--site-text-muted)]">
          {message}
        </p>
      ) : null}
    </div>
  )
}
