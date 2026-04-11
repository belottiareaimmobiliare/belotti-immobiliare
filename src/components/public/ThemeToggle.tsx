'use client'

import { useEffect, useState } from 'react'

type ThemeMode = 'dark' | 'light'

function applyTheme(theme: ThemeMode) {
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem('site-theme', theme)
}

function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'dark'

  const saved = localStorage.getItem('site-theme')
  if (saved === 'light' || saved === 'dark') return saved

  const htmlTheme = document.documentElement.getAttribute('data-theme')
  if (htmlTheme === 'light' || htmlTheme === 'dark') return htmlTheme

  return 'dark'
}

function SunIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-[18px] w-[18px]"
      fill="none"
    >
      <circle cx="12" cy="12" r="4.2" fill="white" />
      <path
        d="M12 1.8V4.2M12 19.8v2.4M4.22 4.22l1.7 1.7M18.08 18.08l1.7 1.7M1.8 12h2.4M19.8 12h2.4M4.22 19.78l1.7-1.7M18.08 5.92l1.7-1.7"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-[18px] w-[18px]"
      fill="none"
    >
      <path
        d="M19.2 14.9A8.7 8.7 0 1 1 10.1 3.8a7.1 7.1 0 1 0 9.1 11.1Z"
        fill="white"
      />
    </svg>
  )
}

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const [theme, setTheme] = useState<ThemeMode>('dark')

  useEffect(() => {
    const initial = getInitialTheme()
    setTheme(initial)
    applyTheme(initial)
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    const next: ThemeMode = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    applyTheme(next)
  }

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Cambia tema"
        className="theme-toggle-button"
      >
        <MoonIcon />
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Attiva tema chiaro' : 'Attiva tema scuro'}
      className="theme-toggle-button"
      title={theme === 'dark' ? 'Tema chiaro' : 'Tema scuro'}
    >
      {theme === 'dark' ? <MoonIcon /> : <SunIcon />}
    </button>
  )
}