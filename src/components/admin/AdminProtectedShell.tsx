'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/admin/Sidebar'
import Header from '@/components/admin/Header'

export default function AdminProtectedShell({
  children,
}: {
  children: React.ReactNode
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (!mobileMenuOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [mobileMenuOpen])

  return (
    <div className="theme-admin-page min-h-screen">
      <div className="flex min-h-screen">
        <Sidebar />
        <Sidebar
          mobile
          mobileOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        />

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <Header onOpenMobileMenu={() => setMobileMenuOpen(true)} />

          <main className="flex-1 px-4 py-6 lg:px-6 lg:py-8">
            <div className="mx-auto max-w-7xl min-w-0">{children}</div>
          </main>
        </div>
      </div>
    </div>
  )
}