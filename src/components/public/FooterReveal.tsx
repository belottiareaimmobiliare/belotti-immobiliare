'use client'

import { useEffect, useRef, useState } from 'react'

export default function FooterReveal({
  children,
}: {
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      if (!ref.current) return

      const rect = ref.current.getBoundingClientRect()
      const triggerPoint = window.innerHeight * 0.92

      if (rect.top < triggerPoint) {
        setVisible(true)
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()

    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="relative mt-24">
      <div className="h-[38vh]" />

      <div
        ref={ref}
        className={`transition-all duration-700 ${
          visible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}
      >
        {children}
      </div>
    </div>
  )
}