'use client'

import { useEffect, useMemo, useState } from 'react'

type Props = {
  role: string
}

type AdminSection = {
  id: string
  hrefs: string[]
  exactOnly?: boolean
}

const sections: AdminSection[] = [
  { id: 'dashboard', hrefs: ['/admin'], exactOnly: true },
  { id: 'immobili', hrefs: ['/admin/immobili'] },
  { id: 'news', hrefs: ['/admin/news'] },
  { id: 'autori', hrefs: ['/admin/autori'] },
  { id: 'leads', hrefs: ['/admin/leads'] },
  { id: 'ricerche-salvate', hrefs: ['/admin/ricerche-salvate'] },
  { id: 'contenuti', hrefs: ['/admin/contenuti'] },
  { id: 'utenti', hrefs: ['/admin/utenti'] },
  { id: 'kpi', hrefs: ['/admin/kpi'] },
  { id: 'exports', hrefs: ['/admin/exports'] },
  { id: 'logs', hrefs: ['/admin/logs'] },
  { id: 'privacy', hrefs: ['/admin/privacy'] },
]

function selectorsFor(section: AdminSection) {
  return section.hrefs.flatMap((href) => {
    if (section.exactOnly) {
      return [`a[href="${href}"]`]
    }

    return [
      `a[href="${href}"]`,
      `a[href^="${href}/"]`,
      `a[href^="${href}?"]`,
    ]
  })
}

export default function AdminHiddenSectionsApplier({ role }: Props) {
  const [hiddenIds, setHiddenIds] = useState<string[]>([])

  useEffect(() => {
    if (role === 'administrator') {
      setHiddenIds([])
      return
    }

    let active = true

    fetch('/api/admin/ui-settings', { cache: 'no-store' })
      .then((response) => response.json())
      .then((data) => {
        if (!active) return

        const nextHiddenIds = Array.isArray(data?.hiddenSections)
          ? data.hiddenSections.filter((item: unknown) => typeof item === 'string')
          : []

        setHiddenIds(nextHiddenIds)
      })
      .catch((error) => {
        console.error('Errore caricamento sezioni admin nascoste:', error)
        setHiddenIds([])
      })

    return () => {
      active = false
    }
  }, [role])

  const hiddenCss = useMemo(() => {
    const hiddenSet = new Set(hiddenIds)

    const selectors = sections
      .filter((section) => hiddenSet.has(section.id))
      .flatMap(selectorsFor)

    if (selectors.length === 0) return ''

    return `
${selectors.join(',\n')} {
  display: none !important;
}
`
  }, [hiddenIds])

  if (!hiddenCss) return null

  return <style>{hiddenCss}</style>
}
