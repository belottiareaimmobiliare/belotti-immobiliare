'use client'

import { useState } from 'react'

export default function CopyReferenceButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={copied ? 'Copiato' : 'Copia codice annuncio'}
      aria-label="Copia codice annuncio"
      className="ml-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-[var(--site-border)] bg-[var(--site-surface)] text-[var(--site-text-muted)] transition hover:bg-[var(--site-surface-2)] hover:text-[var(--site-text)]"
    >
      {copied ? (
        <span className="text-xs">✓</span>
      ) : (
        <svg
          viewBox="0 0 24 24"
          className="h-3.5 w-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="9" y="9" width="11" height="11" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </button>
  )
}
