'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { MessageCircle } from 'lucide-react'
import { readCookiePreferences } from '@/lib/cookie-consent'

const WHATSAPP_NUMBER = '393938149279'
// SOSTITUISCI con il numero WhatsApp reale in formato internazionale senza +
// esempio: 393471234567

const DEFAULT_MESSAGE =
  'Ciao, vorrei avere informazioni su un immobile pubblicato sul vostro sito.'

export default function WhatsAppChatButton() {
  const pathname = usePathname()
  const [hasCookieChoice, setHasCookieChoice] = useState(true)

  useEffect(() => {
    const syncCookieState = () => {
      const preferences = readCookiePreferences()
      setHasCookieChoice(Boolean(preferences))
    }

    syncCookieState()

    window.addEventListener('cookie-preferences-updated', syncCookieState)

    return () => {
      window.removeEventListener('cookie-preferences-updated', syncCookieState)
    }
  }, [])

  const isPublicPage = useMemo(() => {
    return !pathname.startsWith('/admin')
  }, [pathname])

  const whatsappHref = useMemo(() => {
    const text = encodeURIComponent(DEFAULT_MESSAGE)
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`
  }, [])

  if (!isPublicPage) return null

  return (
    <a
      href={whatsappHref}
      target="_blank"
      rel="noreferrer"
      aria-label="Chatta con noi su WhatsApp"
      className={`group fixed right-4 z-[110] inline-flex items-center gap-3 rounded-full border border-white/10 bg-[#25D366] px-4 py-3 text-black shadow-[0_18px_40px_rgba(0,0,0,0.28)] transition hover:scale-[1.02] hover:shadow-[0_22px_50px_rgba(0,0,0,0.34)] md:right-6 ${
        hasCookieChoice ? 'bottom-6' : 'bottom-28'
      }`}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/10">
        <MessageCircle className="h-5 w-5" strokeWidth={2.2} />
      </div>

      <div className="hidden md:block">
        <p className="text-[11px] uppercase tracking-[0.2em] text-black/60">
          WhatsApp
        </p>
        <p className="text-sm font-semibold text-black">Chatta con noi</p>
      </div>
    </a>
  )
}