'use client'

import { useEffect } from 'react'

const STORAGE_KEY = 'area-immobiliare-theme'

export default function ThemeInitializer() {
  useEffect(() => {
    const savedTheme = localStorage.getItem(STORAGE_KEY)
    const theme = savedTheme === 'light' ? 'light' : 'dark'

    document.documentElement.setAttribute('data-theme', theme)
  }, [])

  return null
}