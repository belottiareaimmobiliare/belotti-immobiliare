'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function DriveFolderJobsAutoProcessor() {
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname?.startsWith('/admin')) return

    let cancelled = false

    const run = async () => {
      if (cancelled || document.visibilityState === 'hidden') return

      try {
        await fetch('/api/admin/ai-os/drive-folders/process-jobs', {
          method: 'POST',
          cache: 'no-store',
        })
      } catch {
        // Silenzioso: non deve disturbare l'uso dell'admin.
      }
    }

    run()

    const interval = window.setInterval(run, 30000)

    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [pathname])

  return null
}
