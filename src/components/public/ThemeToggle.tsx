'use client'

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'area-immobiliare-theme'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const current =
      document.documentElement.getAttribute('data-theme') === 'light'
        ? 'light'
        : 'dark'

    setTheme(current)
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    document.documentElement.setAttribute('data-theme', nextTheme)
    localStorage.setItem(STORAGE_KEY, nextTheme)
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Attiva tema chiaro' : 'Attiva tema scuro'}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--site-border)] bg-[var(--site-surface-2)] text-[var(--site-text)] shadow-[var(--site-button-shadow)] transition hover:bg-[var(--site-surface-3)]"
      title={theme === 'dark' ? 'Passa al tema chiaro' : 'Passa al tema scuro'}
    >
      {mounted ? (theme === 'dark' ? '☾' : '☀') : '☾'}
    </button>
  )
}