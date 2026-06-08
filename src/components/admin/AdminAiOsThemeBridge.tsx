'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function AdminAiOsThemeBridge() {
  const pathname = usePathname()

  useEffect(() => {
    const isAiOsRoute = pathname?.startsWith('/admin/ai-os') === true
    const html = document.documentElement
    const body = document.body

    const previousTheme = html.getAttribute('data-theme')
    const previousHadDarkClass = html.classList.contains('dark')

    if (isAiOsRoute) {
      body.classList.add('admin-aios-shell')
      html.setAttribute('data-theme', 'dark')
      html.classList.add('dark')
    } else {
      body.classList.remove('admin-aios-shell')
    }

    return () => {
      body.classList.remove('admin-aios-shell')

      if (previousTheme) {
        html.setAttribute('data-theme', previousTheme)
      } else {
        html.removeAttribute('data-theme')
      }

      if (previousHadDarkClass) {
        html.classList.add('dark')
      } else {
        html.classList.remove('dark')
      }
    }
  }, [pathname])

  return null
}
