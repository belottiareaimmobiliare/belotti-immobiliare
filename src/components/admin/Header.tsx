'use client'

import ThemeToggle from '@/components/shared/ThemeToggle'

export default function Header() {
  return (
    <header className="site-header-solid sticky top-0 z-[120] border-b border-[var(--site-border)]">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--site-text-faint)]">
            Gestionale
          </p>
          <h1 className="mt-1 text-lg font-semibold text-[var(--site-text)]">
            Area Immobiliare Admin
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}