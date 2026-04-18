'use client'

import ThemeToggle from '@/components/shared/ThemeToggle'

type HeaderProps = {
  onOpenMobileMenu?: () => void
}

export default function Header({ onOpenMobileMenu }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--site-border)] bg-[var(--site-bg)]/95 backdrop-blur">
      <div className="flex min-h-16 items-center justify-between px-4 py-3 lg:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label="Apri menu admin"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--site-border)] bg-[var(--site-surface)] text-[var(--site-text)] transition hover:bg-[var(--site-surface-2)] lg:hidden"
          >
            <span className="text-lg leading-none">☰</span>
          </button>

          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--site-text-muted)]">
              Gestionale
            </p>
            <h1 className="text-lg font-semibold text-[var(--site-text)]">
              Area Immobiliare Admin
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}