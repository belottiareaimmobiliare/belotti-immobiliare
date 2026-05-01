'use client'

import { useMemo, useRef, useState } from 'react'
import { toPng } from 'html-to-image'

type Property = {
  id: string
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
    attico: 'Attico',
    villa: 'Villa',
    ufficio: 'Ufficio',
    negozio: 'Negozio',
    box: 'Box',
    ristrutturato: 'Ristrutturato',
    nuovo: 'Nuovo',
    ottimo: 'Ottimo stato',
    buono: 'Buono stato',
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
  className = '',
}: {
  src?: string
  alt: string
  className?: string
}) {
  if (!src) {
    return (
      <div className={`flex items-center justify-center bg-[#18202d] text-white/50 ${className}`}>
        Foto immobile
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      crossOrigin="anonymous"
      className={`h-full w-full object-cover ${className}`}
    />
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

  const mainImage = images[0]?.file_url
  const sideImageOne = images[1]?.file_url || images[0]?.file_url
  const sideImageTwo = images[2]?.file_url || images[1]?.file_url || images[0]?.file_url

  const title = property.title || 'Immobile selezionato'
  const location = [property.comune, property.province].filter(Boolean).join(' · ')
  const address = [property.address, property.frazione].filter(Boolean).join(' · ')

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
        backgroundColor: '#f4efe3',
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
          Formato iniziale: <strong>1600 × 900 px</strong>, ideale per Facebook, WhatsApp e vetrina web.
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
          className="relative h-[900px] w-[1600px] overflow-hidden bg-[#f4efe3] text-[#111827]"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_55%_20%,rgba(255,255,255,0.95),rgba(244,239,227,0.8)_42%,rgba(226,216,195,0.7)_100%)]" />

          <div className="relative z-10 grid h-full grid-cols-[600px_1fr_360px] gap-8 p-10">
            <div className="overflow-hidden rounded-[38px] border-[10px] border-white bg-white shadow-2xl">
              <PhotoBox src={mainImage} alt={title} />
            </div>

            <div className="flex min-w-0 flex-col justify-between py-4">
              <div>
                <div className="mb-6 flex flex-wrap gap-3">
                  {chips.slice(0, 5).map((chip) => (
                    <span
                      key={chip}
                      className="rounded-full bg-[#10233f] px-5 py-2 text-xl font-semibold text-white"
                    >
                      {chip}
                    </span>
                  ))}
                </div>

                <h2 className="text-[70px] font-black uppercase leading-[0.95] tracking-[-0.045em] text-[#e3192c]">
                  {title}
                </h2>

                {(location || address) && (
                  <p className="mt-6 text-2xl font-semibold text-[#1f2937]">
                    {[location, address].filter(Boolean).join(' · ')}
                  </p>
                )}

                <p className="mt-6 text-[30px] font-black text-[#111827]">
                  {formatPrice(property.price)}
                </p>

                {stats.length > 0 && (
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    {stats.map((stat) => (
                      <div
                        key={stat}
                        className="rounded-2xl border border-[#d7cbb4] bg-white/80 px-5 py-4 text-2xl font-bold"
                      >
                        {stat}
                      </div>
                    ))}
                  </div>
                )}

                <p className="mt-7 text-[25px] font-medium leading-[1.35] text-[#222]">
                  {truncateText(property.description, 360)}
                </p>
              </div>

              <div className="mt-8 grid grid-cols-[220px_1fr] items-end gap-7 border-t-2 border-[#d0c3aa] pt-8">
                <div className="rounded-3xl bg-white/80 p-5">
                  <img
                    src="/images/brand/areaimmobiliare.png"
                    alt="Area Immobiliare"
                    crossOrigin="anonymous"
                    className="h-auto w-full object-contain"
                  />
                </div>

                <div className="text-[25px] font-bold leading-tight text-[#111827]">
                  <p>Area Immobiliare</p>
                  <p className="mt-2 text-[22px] font-semibold">Bergamo · Via Locatelli, 62</p>
                  <p className="mt-3 text-[34px] font-black">035 237979 · 035 221206</p>
                  <p className="text-[22px] font-semibold">info@areaimmobiliare.com</p>
                </div>
              </div>
            </div>

            <div className="grid h-full grid-rows-2 gap-8">
              <div className="overflow-hidden rounded-[32px] border-[8px] border-white bg-white shadow-xl">
                <PhotoBox src={sideImageOne} alt={`${title} foto 2`} />
              </div>

              <div className="overflow-hidden rounded-[32px] border-[8px] border-white bg-white shadow-xl">
                <PhotoBox src={sideImageTwo} alt={`${title} foto 3`} />
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-4 bg-[#e3192c]" />
        </div>
      </div>
    </div>
  )
}
