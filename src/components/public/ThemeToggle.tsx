'use client'

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'area-immobiliare-theme'

type Props = {
  forceDark?: boolean
}

export default function ThemeToggle({ forceDark = false }: Props) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    if (forceDark) {
      setTheme('dark')
      return
    }

    const current =
      document.documentElement.getAttribute('data-theme') === 'light'
        ? 'light'
        : 'dark'

    setTheme(current)
  }, [forceDark])

  const toggleTheme = () => {
    if (forceDark) return

    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    document.documentElement.setAttribute('data-theme', nextTheme)
    localStorage.setItem(STORAGE_KEY, nextTheme)
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      disabled={forceDark}
      aria-label={
        forceDark
          ? 'Tema notte attivo nella home'
          : theme === 'dark'
            ? 'Attiva tema chiaro'
            : 'Attiva tema scuro'
      }
      className={`inline-flex h-11 w-11 items-center justify-center rounded-full border text-lg transition ${
        forceDark
          ? 'cursor-default border-white/15 bg-white/5 text-white'
          : 'border-[var(--site-border)] bg-[var(--site-surface-2)] text-[var(--site-text)] shadow-[var(--site-button-shadow)] hover:bg-[var(--site-surface-3)]'
      }`}
      title={
        forceDark
          ? 'Nella home alta resta il tema notte'
          : theme === 'dark'
            ? 'Passa al tema chiaro'
            : 'Passa al tema scuro'
      }
    >
      {forceDark ? '☾' : theme === 'dark' ? '☾' : '☀'}
    </button>
  )
}