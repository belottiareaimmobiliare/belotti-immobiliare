'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function RouteBodyClass() {
  const pathname = usePathname()

  useEffect(() => {
    const isHome = pathname === '/'

    document.body.classList.toggle('is-home-route', isHome)
    document.body.classList.toggle('is-non-home-route', !isHome)

    return () => {
      document.body.classList.remove('is-home-route')
      document.body.classList.remove('is-non-home-route')
    }
  }, [pathname])

  return null
}
