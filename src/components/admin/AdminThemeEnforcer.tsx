'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function AdminThemeEnforcer() {
  const pathname = usePathname()

  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const isNewsAdmin = pathname?.startsWith('/admin/news') === true

    body.classList.toggle('admin-news-theme-preview', isNewsAdmin)

    if (isNewsAdmin) {
      body.classList.remove('admin-force-dark')
      return () => {
        body.classList.remove('admin-news-theme-preview')
      }
    }

    body.classList.add('admin-force-dark')
    html.setAttribute('data-theme', 'dark')
    html.classList.add('dark')

    return () => {
      body.classList.remove('admin-force-dark')
      body.classList.remove('admin-news-theme-preview')
    }
  }, [pathname])

  return null
}
