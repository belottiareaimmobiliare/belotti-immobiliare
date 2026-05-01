'use client'

import { useMemo, useRef, useState } from 'react'
import { toPng } from 'html-to-image'

type Property = {
  id: string
  slug?: string | null
  title: string | null
  reference_code?: string | null
  price: number | string | null
  comune: string | null
  province: string | null
  frazione: string | null
  address: string | null
  surface: number | string | null
  rooms: number | string | null
  bedrooms: number | string | null
  bathrooms: number | string | null
  description: string | null
  contract_type: string | null
  property_type: string | null
  condition?: string | null
  availability?: string | null
  has_garage?: boolean | null
  has_parking?: boolean | null
  has_garden?: boolean | null
  has_elevator?: boolean | null
}

type MediaItem = {
  id: string
  media_type: string
  file_url: string
  label: string | null
  sort_order: number | null
  is_cover: boolean | null
}

const SOCIAL_HASHTAGS = [
  '#Belotti_Immobiliare',
  '#gianfedericobelotti',
  '#bergamoimmobiliare',
]


type Props = {
  property: Property
  media: MediaItem[]
}

function toNumber(value: number | string | null | undefined) {
  if (typeof value === 'number') return value
  if (!value) return null

  const parsed = Number(String(value).replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}

function formatPrice(value: number | string | null) {
  const numberValue = toNumber(value)
  if (!numberValue || numberValue <= 0) return 'Prezzo su richiesta'

  return `€ ${Math.round(numberValue).toLocaleString('it-IT')}`
}

function formatLabel(value: string | null | undefined, fallback = '') {
  const clean = String(value || '').trim()
  if (!clean) return fallback

  const labels: Record<string, string> = {
    vendita: 'Vendita',
    affitto: 'Affitto',
    appartamento: 'Appartamento',
    bilocale: 'Bilocale',
    trilocale: 'Trilocale',
    quadrilocale: 'Quadrilocale',
    monolocale: 'Monolocale',
    attico: 'Attico',
    mansarda: 'Mansarda',
    villa: 'Villa',
    rustico: 'Rustico',
    ufficio: 'Ufficio',
    negozio: 'Negozio',
    box: 'Box',
    ristrutturato: 'Ristrutturato',
    nuovo: 'Nuovo',
    ottimo: 'Ottimo stato',
    buono: 'Buono stato',
    abitabile: 'Abitabile',
    libero_subito: 'Libero subito',
    libero: 'Libero',
    locato: 'Locato',
  }

  return labels[clean] || clean.replaceAll('_', ' ')
}

function truncateText(value: string | null | undefined, maxLength: number) {
  const clean = String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!clean) return 'Descrizione in aggiornamento.'
  if (clean.length <= maxLength) return clean

  return `${clean.slice(0, maxLength).trim()}…`
}


function getPublicPropertyUrl(slug: string | null | undefined) {
  if (!slug) return ''

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
    'https://belotti-immobiliare.vercel.app'

  return `${siteUrl}/immobili/${slug}`
}

function buildFacebookDescription(description: string | null | undefined, slug: string | null | undefined) {
  const cleanDescription = truncateText(description, 1200)
  const link = getPublicPropertyUrl(slug)
  const hashtags = SOCIAL_HASHTAGS.join(' ')

  if (!link) {
    return `${cleanDescription}

${hashtags}`
  }

  return `${cleanDescription}

Link immobile:
${link}

${hashtags}`
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

function PhotoBox({
  src,
  alt,
  size = 'small',
}: {
  src?: string
  alt: string
  size?: 'small' | 'large'
}) {
  const sizeClass =
    size === 'large'
      ? 'h-[430px] w-[430px]'
      : 'h-[285px] w-[285px]'

  if (!src) {
    return (
      <div
        className={`${sizeClass} overflow-hidden rounded-[34px] border border-white/10 bg-white/[0.04] shadow-[0_28px_80px_rgba(0,0,0,0.55)]`}
      >
        <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-white/35">
          Foto immobile
        </div>
      </div>
    )
  }

  return (
    <div
      className={`${sizeClass} overflow-hidden rounded-[34px] border border-white/12 bg-white/[0.04] shadow-[0_28px_80px_rgba(0,0,0,0.55)]`}
    >
      <img
        src={src}
        alt={alt}
        crossOrigin="anonymous"
        className="h-full w-full object-cover"
      />
    </div>
  )
}


function CopyTextBox({
  label,
  value,
  multiline = false,
  className = '',
}: {
  label: string
  value: string
  multiline?: boolean
  className?: string
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)

      window.setTimeout(() => {
        setCopied(false)
      }, 1400)
    } catch {
      alert('Non sono riuscito a copiare il testo. Puoi selezionarlo manualmente.')
    }
  }

  return (
    <div className={`rounded-2xl border border-[var(--site-border)] bg-[var(--site-bg-soft)] p-4 ${className}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="theme-admin-faint text-xs uppercase tracking-[0.22em]">
          {label}
        </p>

        <button
          type="button"
          onClick={handleCopy}
          className="rounded-xl border border-[var(--site-border)] px-3 py-1.5 text-xs font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-surface-2)]"
        >
          {copied ? 'Copiato' : 'Copia'}
        </button>
      </div>

      {multiline ? (
        <textarea
          readOnly
          value={value}
          rows={6}
          className="theme-admin-input w-full resize-none rounded-xl px-4 py-3 text-sm leading-relaxed"
        />
      ) : (
        <div className="theme-admin-input min-h-[48px] rounded-xl px-4 py-3 text-sm font-medium">
          {value}
        </div>
      )}
    </div>
  )
}

export default function SocialCardGenerator({ property, media }: Props) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isExporting, setIsExporting] = useState(false)

  const images = useMemo(() => {
    return media
      .filter((item) => item.media_type === 'image' && item.file_url)
      .sort((a, b) => {
        if ((a.is_cover ? 1 : 0) !== (b.is_cover ? 1 : 0)) {
          return a.is_cover ? -1 : 1
        }

        return (a.sort_order ?? 0) - (b.sort_order ?? 0)
      })
  }, [media])

  const title = property.title || 'Immobile selezionato'
  const location = [property.comune, property.province].filter(Boolean).join(' · ')
  const address = [property.address, property.frazione].filter(Boolean).join(' · ')

  const hasFourImages = images.length >= 4

  const stats = [
    property.surface ? `${property.surface} mq` : null,
    property.rooms ? `${property.rooms} locali` : null,
    property.bedrooms ? `${property.bedrooms} camere` : null,
    property.bathrooms ? `${property.bathrooms} bagni` : null,
  ].filter(Boolean)

  const chips = [
    formatLabel(property.contract_type),
    formatLabel(property.property_type),
    formatLabel(property.condition),
    formatLabel(property.availability),
    property.has_garage ? 'Box / Garage' : null,
    property.has_parking ? 'Posto auto' : null,
    property.has_garden ? 'Giardino' : null,
    property.has_elevator ? 'Ascensore' : null,
  ].filter(Boolean)

  const handleDownload = async () => {
    if (!cardRef.current) return

    try {
      setIsExporting(true)

      if ('fonts' in document) {
        await document.fonts.ready
      }

      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#05070b',
      })

      const link = document.createElement('a')
      link.download = `scheda-${slugify(title)}.png`
      link.href = dataUrl
      link.click()
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="theme-admin-note rounded-2xl px-4 py-3 text-sm">
          Formato: <strong>1600 × 900 px</strong>. Stile premium scuro, pensato per social, WhatsApp e vetrina.
        </div>

        <button
          type="button"
          onClick={handleDownload}
          disabled={isExporting}
          className="theme-admin-button-primary rounded-2xl px-6 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isExporting ? 'Genero PNG...' : 'Scarica PNG'}
        </button>
      </div>

      <div className="overflow-auto rounded-3xl border border-[var(--site-border)] bg-[var(--site-bg-soft)] p-4">
        <div
          ref={cardRef}
          className="relative h-[900px] w-[1600px] overflow-hidden bg-[#05070b] text-white"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(212,178,108,0.16),rgba(5,7,11,0.88)_38%,rgba(0,0,0,1)_100%)]" />
          <div className="absolute inset-10 rounded-[46px] border border-white/10" />
          <div className="absolute left-1/2 top-0 h-full w-px bg-gradient-to-b from-transparent via-[#c8a45d]/35 to-transparent" />

          <div className="relative z-10 grid h-full grid-cols-[330px_1fr_330px] items-center gap-12 px-16 py-10">
            <div className={hasFourImages ? 'grid h-full place-content-center gap-8' : 'flex h-full items-center justify-center'}>
              {hasFourImages ? (
                <>
                  <PhotoBox src={images[0]?.file_url} alt={`${title} foto 1`} />
                  <PhotoBox src={images[1]?.file_url} alt={`${title} foto 2`} />
                </>
              ) : (
                <PhotoBox src={images[0]?.file_url} alt={`${title} foto 1`} size="large" />
              )}
            </div>

            <div className="flex h-full min-w-0 flex-col justify-center py-8 text-center">
              <div>
                <div className="mb-5 flex flex-wrap justify-center gap-3">
                  {chips.slice(0, 5).map((chip) => (
                    <span
                      key={chip}
                      className="rounded-full border border-[#c8a45d]/45 bg-white/[0.06] px-5 py-2 text-xl font-semibold text-[#f6e4b6]"
                    >
                      {chip}
                    </span>
                  ))}
                </div>

                <p className="mb-5 text-sm uppercase tracking-[0.45em] text-[#c8a45d]">
                  Area Immobiliare
                </p>

                <h2 className="mx-auto max-w-[650px] text-[52px] font-black uppercase leading-[0.92] tracking-[-0.055em] text-white">
                  {title}
                </h2>

                {(location || address) && (
                  <p className="mx-auto mt-5 max-w-[650px] text-[23px] font-semibold leading-snug text-white/78">
                    {[location, address].filter(Boolean).join(' · ')}
                  </p>
                )}

                <p className="mt-5 text-[40px] font-black tracking-[-0.03em] text-[#f6d27b]">
                  {formatPrice(property.price)}
                </p>

                                <p className="mx-auto mt-6 max-w-[660px] text-[24px] font-medium leading-[1.32] text-white/76">
                  {truncateText(property.description, 220)}
                </p>
              </div>

              <div className="mx-auto mt-6 grid w-full max-w-[620px] grid-cols-[155px_1fr] items-center gap-5 border-t border-white/10 pt-5 text-left">
                <div className="rounded-2xl border border-white/10 bg-white px-4 py-3">
                  <img
                    src="/images/brand/areaimmobiliare.png"
                    alt="Area Immobiliare"
                    crossOrigin="anonymous"
                    className="h-auto w-full object-contain"
                  />
                </div>

                <div className="text-white/90">
                  <p className="text-[19px] font-bold">Area Immobiliare</p>
                  <p className="mt-1 text-[17px] font-medium text-white/65">
                    Bergamo · Via Locatelli, 62
                  </p>
                  <p className="mt-1 text-[22px] font-black text-[#f6d27b]">
                    035 237979 · 035 221206
                  </p>
                  <p className="text-[17px] font-medium text-white/70">
                    info@areaimmobiliare.com
                  </p>
                </div>
              </div>
            </div>

            <div className={hasFourImages ? 'grid h-full place-content-center gap-8' : 'flex h-full items-center justify-center'}>
              {hasFourImages ? (
                <>
                  <PhotoBox src={images[2]?.file_url} alt={`${title} foto 3`} />
                  <PhotoBox src={images[3]?.file_url} alt={`${title} foto 4`} />
                </>
              ) : (
                <PhotoBox
                  src={images[1]?.file_url || images[0]?.file_url}
                  alt={`${title} foto 2`}
                  size="large"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-[var(--site-border)] bg-[var(--site-bg-soft)] p-5">
        <div className="mb-5">
          <p className="theme-admin-faint text-xs uppercase tracking-[0.22em]">
            Testi per post Facebook
          </p>
          <p className="theme-admin-muted mt-2 text-sm">
            Scarica il PNG sopra, poi copia titolo, prezzo e descrizione per preparare il post social.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_260px]">
          <CopyTextBox label="Titolo" value={title} />
          <CopyTextBox label="Prezzo" value={formatPrice(property.price)} />
          <CopyTextBox
            label="Descrizione immobile"
            value={buildFacebookDescription(property.description, property.slug)}
            multiline
            className="md:col-span-2"
          />
        </div>
      </div>

    </div>
  )
}
