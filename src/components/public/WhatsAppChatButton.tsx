'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { MessageCircle, X } from 'lucide-react'
import { readCookiePreferences } from '@/lib/cookie-consent'

const WHATSAPP_NUMBER = '393938149279'
const PHONE_LABEL = '035 221206'
const OWNER_CTA_STORAGE_KEY = 'area-owner-whatsapp-cta-closed'

export default function WhatsAppChatButton() {
  const pathname = usePathname()
  const [hasCookieChoice, setHasCookieChoice] = useState(true)
  const [siteOrigin, setSiteOrigin] = useState('')
  const [showOwnerCta, setShowOwnerCta] = useState(false)

  useEffect(() => {
    const syncCookieState = () => {
      const preferences = readCookiePreferences()
      setHasCookieChoice(Boolean(preferences))
    }

    syncCookieState()

    if (typeof window !== 'undefined') {
      setSiteOrigin(window.location.origin)

      const closedAt = window.localStorage.getItem(OWNER_CTA_STORAGE_KEY)
      if (!closedAt) {
        setShowOwnerCta(true)
      }
    }

    window.addEventListener('cookie-preferences-updated', syncCookieState)

    return () => {
      window.removeEventListener('cookie-preferences-updated', syncCookieState)
    }
  }, [])

  const isPublicPage = useMemo(() => {
    return !pathname.startsWith('/admin')
  }, [pathname])

  const messageText = useMemo(() => {
    const propertyPage =
      pathname.startsWith('/immobili/') && pathname !== '/immobili/mappa-area'

    if (propertyPage && siteOrigin) {
      return `Ciao, ho visto questo immobile sul vostro sito Area Immobiliare: ${siteOrigin}${pathname}. Vorrei ricevere maggiori informazioni. Grazie.`
    }

    return 'Ciao, sono proprietario di un immobile e vorrei ricevere informazioni per venderlo, affittarlo o farlo valutare. Grazie.'
  }, [pathname, siteOrigin])

  const whatsappHref = useMemo(() => {
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(messageText)}`
  }, [messageText])

  function closeOwnerCta() {
    setShowOwnerCta(false)

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(OWNER_CTA_STORAGE_KEY, new Date().toISOString())
    }
  }

  if (!isPublicPage) return null

  const bottomClass = hasCookieChoice ? 'bottom-6' : 'bottom-28'
  const bubbleBottomClass = hasCookieChoice ? 'bottom-[104px]' : 'bottom-[190px]'

  return (
    <>
      {showOwnerCta ? (
        <div
          className={`fixed right-4 z-[109] w-[calc(100vw-2rem)] max-w-[340px] rounded-[24px] border border-[var(--site-border)] bg-[var(--site-surface)] p-4 text-[var(--site-text)] shadow-[0_18px_50px_rgba(0,0,0,0.28)] md:right-6 ${bubbleBottomClass}`}
        >
          <button
            type="button"
            onClick={closeOwnerCta}
            aria-label="Chiudi messaggio"
            className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--site-border)] bg-[var(--site-bg)] text-[var(--site-text-muted)] transition hover:bg-[var(--site-surface-2)] hover:text-[var(--site-text)]"
          >
            <X className="h-4 w-4" />
          </button>

          <p className="pr-9 text-sm font-semibold leading-6">
            Sei proprietario di un immobile?
          </p>

          <p className="mt-2 pr-2 text-sm leading-6 text-[var(--site-text-muted)]">
            Vuoi venderlo, affittarlo o farlo valutare?
          </p>

          <p className="mt-3 text-sm leading-6 text-[var(--site-text-muted)]">
            Chiamaci al{' '}
            <a
              href="tel:035221206"
              className="font-semibold text-[var(--site-text)] underline underline-offset-4"
            >
              {PHONE_LABEL}
            </a>{' '}
            oppure scrivici su WhatsApp dal pulsante verde qui sotto.
          </p>

          <div className="absolute -bottom-2 right-9 h-4 w-4 rotate-45 border-b border-r border-[var(--site-border)] bg-[var(--site-surface)]" />
        </div>
      ) : null}

      <a
        href={whatsappHref}
        target="_blank"
        rel="noreferrer"
        aria-label="Chatta con noi su WhatsApp"
        className={`group fixed right-4 z-[110] inline-flex items-center gap-3 rounded-full border border-white/10 bg-[#25D366] px-4 py-3 text-black shadow-[0_18px_40px_rgba(0,0,0,0.28)] transition hover:scale-[1.02] hover:shadow-[0_22px_50px_rgba(0,0,0,0.34)] md:right-6 ${bottomClass}`}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/10">
          <MessageCircle className="h-5 w-5" strokeWidth={2.2} />
        </div>

        <div className="hidden md:block">
          <p className="text-[11px] uppercase tracking-[0.2em] text-black/60">
            WhatsApp
          </p>
          <p className="text-sm font-semibold text-black">Chatta con noi</p>
          <p className="text-[11px] text-black/70">
            Ti rispondiamo il prima possibile
          </p>
        </div>
      </a>
    </>
  )
}