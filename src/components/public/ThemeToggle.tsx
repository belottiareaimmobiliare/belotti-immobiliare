'use client'

import { useEffect, useState } from 'react'

type ThemeMode = 'dark' | 'light'

function MoonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.2 15.3A8.5 8.5 0 0 1 8.7 3.8a8.8 8.8 0 1 0 11.5 11.5Z" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.7v2.2" />
      <path d="M12 19.1v2.2" />
      <path d="M21.3 12h-2.2" />
      <path d="M4.9 12H2.7" />
      <path d="M18.6 5.4l-1.5 1.5" />
      <path d="M6.9 17.1l-1.5 1.5" />
      <path d="M18.6 18.6l-1.5-1.5" />
      <path d="M6.9 6.9 5.4 5.4" />
    </svg>
  )
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const root = document.documentElement
    const saved = localStorage.getItem('site-theme') as ThemeMode | null
    const initial: ThemeMode = saved === 'light' ? 'light' : 'dark'

    root.setAttribute('data-theme', initial)
    setTheme(initial)
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    const next: ThemeMode = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('site-theme', next)
    setTheme(next)
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Attiva tema chiaro' : 'Attiva tema scuro'}
      className="theme-toggle-button inline-flex h-12 w-12 items-center justify-center rounded-full transition"
    >
      {mounted && theme === 'dark' ? <MoonIcon /> : <SunIcon />}
    </button>
  )
}