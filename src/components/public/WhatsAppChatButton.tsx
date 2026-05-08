'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMemo, useState } from 'react'

const WHATSAPP_NUMBER = '39035221206'
const DISPLAY_PHONE = '035 221206'

export default function WhatsAppChatButton() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(true)

  const whatsappHref = useMemo(() => {
    const text = encodeURIComponent(
      'Ciao, vorrei maggiori informazioni da Area Immobiliare.',
    )
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`
  }, [])

  if (!pathname) return null
  if (pathname.startsWith('/admin')) return null

  return (
    <div className="fixed bottom-6 right-4 z-[80] flex flex-col items-end sm:right-6">
      {isOpen ? (
        <div className="mb-[-12px] mr-2 w-[min(34rem,calc(100vw-1.5rem))] max-w-[34rem]">
          <div className="relative rounded-[2rem] bg-[#6dcc72] px-7 pb-8 pt-7 text-white shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
            <button
              type="button"
              aria-label="Chiudi messaggio WhatsApp"
              onClick={() => setIsOpen(false)}
              className="absolute right-5 top-5 inline-flex h-12 w-12 items-center justify-center rounded-full bg-black/10 text-white transition hover:bg-black/15"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 6l12 12" />
                <path d="M18 6L6 18" />
              </svg>
            </button>

            <h3 className="pr-16 text-[1.12rem] font-semibold leading-tight sm:text-[1.18rem]">
              Hai un immobile da vendere o affittare?
            </h3>

            <p className="mt-5 text-[1rem] leading-8 text-white/96 sm:text-[1.02rem]">
              Raccontaci cosa vuoi fare: vendita, affitto o semplice valutazione.
              Area Immobiliare può aiutarti a capire il valore reale dell’immobile e
              il percorso più adatto.
            </p>

            <p className="mt-6 text-[1rem] leading-8 text-white/96 sm:text-[1.02rem]">
              Chiamaci al{' '}
              <a
                href={`tel:${DISPLAY_PHONE.replace(/\s+/g, '')}`}
                className="font-semibold underline underline-offset-4"
              >
                {DISPLAY_PHONE}
              </a>{' '}
              oppure scrivici su WhatsApp dal pulsante verde qui sotto.
            </p>

            <span className="absolute -bottom-[10px] right-12 z-[1] h-5 w-5 rotate-45 bg-[#6dcc72]" />
          </div>
        </div>
      ) : null}

      <Link
        href={whatsappHref}
        target="_blank"
        rel="noreferrer"
        className="relative z-[2] flex w-[min(30rem,calc(100vw-2rem))] items-center gap-4 rounded-[2rem] bg-[#69cf6e] px-5 py-5 text-black shadow-[0_18px_60px_rgba(0,0,0,0.25)] transition hover:-translate-y-0.5 hover:bg-[#75d679] sm:px-6"
      >
        <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#57c95d]">
          <svg
            viewBox="0 0 32 32"
            className="h-8 w-8"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M16.02 5C10.02 5 5.16 9.83 5.16 15.77c0 2.1.62 4.13 1.78 5.88L5 27l5.54-1.79a10.95 10.95 0 0 0 5.48 1.49h.01c5.99 0 10.85-4.83 10.85-10.78C26.88 9.83 22.01 5 16.02 5Z"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12.16 11.62c-.24-.52-.49-.53-.72-.54h-.61c-.21 0-.56.08-.85.39-.29.31-1.11 1.08-1.11 2.64 0 1.56 1.14 3.07 1.3 3.28.16.21 2.22 3.56 5.48 4.84 2.7 1.05 3.26.84 3.84.79.59-.05 1.88-.77 2.14-1.52.26-.75.26-1.4.18-1.53-.08-.13-.29-.21-.61-.37-.32-.16-1.88-.93-2.17-1.03-.29-.1-.5-.16-.72.16-.21.31-.82 1.03-1 1.24-.18.21-.37.23-.69.08-.32-.16-1.34-.49-2.55-1.57-.94-.84-1.57-1.87-1.76-2.18-.18-.31-.02-.48.14-.64.14-.14.32-.37.48-.55.16-.18.21-.31.32-.52.11-.21.05-.39-.03-.55-.08-.16-.72-1.78-1-2.44Z"
              fill="currentColor"
            />
          </svg>
        </span>

        <span className="min-w-0">
          <span className="block text-xs tracking-[0.42em] text-black/65">
            WHATSAPP
          </span>
          <span className="mt-1 block text-[1.15rem] font-semibold leading-tight sm:text-[1.2rem]">
            Chatta con noi
          </span>
          <span className="mt-1 block text-sm text-black/72 sm:text-[0.98rem]">
            Ti rispondiamo il prima possibile
          </span>
        </span>
      </Link>
    </div>
  )
}
