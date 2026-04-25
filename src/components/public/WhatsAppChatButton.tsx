'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { MessageCircle, X } from 'lucide-react'
import { CONTACTS_CONTENT_KEY, defaultContactsContent, type ContactsContent } from '@/lib/site-content'
import { readCookiePreferences } from '@/lib/cookie-consent'

const OWNER_CTA_STORAGE_KEY = 'area-owner-whatsapp-cta-closed'

export default function WhatsAppChatButton() {
  const pathname = usePathname()
  const [hasCookieChoice, setHasCookieChoice] = useState(true)
  const [siteOrigin, setSiteOrigin] = useState('')
  const [showOwnerCta, setShowOwnerCta] = useState(false)
  const [contacts, setContacts] = useState<ContactsContent>(defaultContactsContent)

  useEffect(() => {
    const syncCookieState = () => {
      const preferences = readCookiePreferences()
      setHasCookieChoice(Boolean(preferences))
    }

    async function loadContacts() {
      try {
        const res = await fetch(`/api/site-content?key=${CONTACTS_CONTENT_KEY}`, {
          cache: 'no-store',
        })

        if (!res.ok) return

        const data = await res.json()
        setContacts({
          ...defaultContactsContent,
          ...data,
        })
      } catch {
        setContacts(defaultContactsContent)
      }
    }

    syncCookieState()
    loadContacts()

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
      return contacts.whatsappPropertyMessage.replace('{url}', `${siteOrigin}${pathname}`)
    }

    return contacts.whatsappDefaultMessage
  }, [contacts.whatsappDefaultMessage, contacts.whatsappPropertyMessage, pathname, siteOrigin])

  const whatsappHref = useMemo(() => {
    const cleanNumber = contacts.whatsappNumber.replace(/[^\d]/g, '')
    return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(messageText)}`
  }, [contacts.whatsappNumber, messageText])

  function closeOwnerCta() {
    setShowOwnerCta(false)

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(OWNER_CTA_STORAGE_KEY, new Date().toISOString())
    }
  }

  if (!isPublicPage) return null

  const bottomClass = hasCookieChoice ? 'bottom-6' : 'bottom-28'
  const bubbleBottomClass = hasCookieChoice ? 'bottom-[104px]' : 'bottom-[190px]'
  const phoneHref = contacts.phoneHref.replace(/\s+/g, '')

  return (
    <>
      {showOwnerCta ? (
        <div
          className={`fixed right-4 z-[109] w-[calc(100vw-2rem)] max-w-[340px] rounded-[24px] border border-white/20 bg-[#25D366]/70 p-4 text-white shadow-[0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl md:right-6 ${bubbleBottomClass}`}
        >
          <button
            type="button"
            onClick={closeOwnerCta}
            aria-label="Chiudi messaggio"
            className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/20 text-white/80 transition hover:bg-black/30 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>

          <p className="pr-9 text-sm font-semibold leading-6">
            {contacts.ownerCtaTitle}
          </p>

          <p className="mt-2 pr-2 text-sm leading-6 text-white/85">
            {contacts.ownerCtaText}
          </p>

          <p className="mt-3 text-sm leading-6 text-white/85">
            {contacts.ownerCtaPhoneText}{' '}
            <a
              href={`tel:${phoneHref}`}
              className="font-semibold text-white underline underline-offset-4"
            >
              {contacts.phoneLabel}
            </a>{' '}
            oppure scrivici su WhatsApp dal pulsante verde qui sotto.
          </p>

          <div className="absolute -bottom-2 right-9 h-4 w-4 rotate-45 border-b border-r border-white/20 bg-[#25D366]/70" />
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
