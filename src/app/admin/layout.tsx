import type { ReactNode } from 'react'
import ThemeToggle from '@/components/shared/ThemeToggle'

export default function AdminRootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <>
      <div className="fixed right-4 top-4 z-[200] md:right-6">
        <ThemeToggle />
      </div>
      {children}
    </>
  )
}
