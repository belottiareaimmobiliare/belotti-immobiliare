import Footer from '@/components/public/Footer'
import FooterReveal from '@/components/public/FooterReveal'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SiteHeader from '@/components/public/SiteHeader'
import SinglePropertyMapSection from '@/components/public/SinglePropertyMapSection'
import PropertyContactForm from '@/components/public/PropertyContactForm'
import PropertyGalleryClient from '@/components/public/PropertyGalleryClient'
import CopyReferenceButton from '@/components/public/CopyReferenceButton'
import SimilarPropertyAlertForm from '@/components/public/SimilarPropertyAlertForm'

type PropertyMediaItem = {
  id: string
  property_id: string
  media_type: 'image' | 'plan'
  file_url: string
  label: string | null
  sort_order: number | null
  is_cover: boolean | null
}

type Property = {
  id: string
  slug: string | null
  title: string | null
  reference_code: string | null
  condition: string | null
  availability: string | null
  year_built: number | null
  floor: string | null
  total_floors: string | null
  bedrooms: number | null
  balconies: number | null
  terraces: number | null
  exposure: string | null
  heating_source: string | null
  energy_epgl: string | null
  condo_fees_amount: number | null
  condo_fees_period: string | null
  price: number | null
  province: string | null
  comune: string | null
  frazione: string | null
  address: string | null
  latitude: number | null
  longitude: number | null
  location_mode: string | null
  rooms: number | null
  bathrooms: number | null
  surface: number | null
  description: string | null
  contract_type: string | null
  property_type: string | null
  status: string | null
  has_garage: boolean | null
  has_parking: boolean | null
  has_garden: boolean | null
  has_elevator: boolean | null
  is_auction: boolean | null
  energy_class: string | null
  condo_fees: string | null
  heating_type: string | null
  furnished_status: string | null
  deposit_amount: string | null
  advance_amount: string | null
  advance_deposit_amount: string | null
  property_media?: PropertyMediaItem[]
}

type PageProps = {
  params: Promise<{
    slug: string
  }>
}

function formatLabel(value: string | null | undefined, fallback = '—') {
  const clean = String(value || '').trim()
  return clean || fallback
}


function formatOptionLabel(value: string | null | undefined, fallback = '—') {
  const clean = String(value || '').trim()
  if (!clean) return fallback

  const labels: Record<string, string> = {
    nuovo: 'Nuovo',
    ottimo: 'Ottimo',
    buono: 'Buono',
    abitabile: 'Abitabile',
    da_ristrutturare: 'Da ristrutturare',
    ristrutturato: 'Ristrutturato',
    rustico: 'Rustico / rudere',
    libero: 'Libero',
    libero_subito: 'Libero subito',
    occupato: 'Occupato',
    locato: 'Locato',
    al_rogito: 'Al rogito',
    da_concordare: 'Da concordare',
    gas: 'Gas',
    metano: 'Metano',
    pompa_calore: 'Pompa di calore',
    elettrico: 'Elettrico',
    gasolio: 'Gasolio',
    teleriscaldamento: 'Teleriscaldamento',
    altro: 'Altro',
    nord: 'Nord',
    sud: 'Sud',
    est: 'Est',
    ovest: 'Ovest',
    nord_sud: 'Nord / Sud',
    est_ovest: 'Est / Ovest',
    doppia: 'Doppia esposizione',
    tripla: 'Tripla esposizione',
    quadrupla: 'Quadrupla esposizione',
    si: 'Sì',
    no: 'No',
    parzialmente: 'Parzialmente',
    mese: 'mese',
    anno: 'anno',
  }

  return labels[clean] || clean.replaceAll('_', ' ')
}

function shouldRenderOptionalField(value: string | null | undefined) {
  const clean = String(value || '').trim()
  return clean !== '' && clean !== '-'
}

export default async function PropertyDetailPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: property, error } = await supabase
    .from('properties')
    .select(`
      *,
      property_media (*)
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()

  if (error || !property) {
    notFound()
  }

  const currentProperty = property as Property

  const images = (currentProperty.property_media || [])
    .filter((item) => item.media_type === 'image')
    .sort((a, b) => {
      if ((a.is_cover ? 1 : 0) !== (b.is_cover ? 1 : 0)) {
        return a.is_cover ? -1 : 1
      }
      return (a.sort_order ?? 0) - (b.sort_order ?? 0)
    })

  const plans = (currentProperty.property_media || [])
    .filter((item) => item.media_type === 'plan')
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))

  const detailFeatures = [
    currentProperty.surface ? `${currentProperty.surface} mq` : null,
    currentProperty.rooms ? `${currentProperty.rooms} locali` : null,
    currentProperty.bathrooms ? `${currentProperty.bathrooms} bagni` : null,
    currentProperty.bedrooms ? `${currentProperty.bedrooms} camere` : null,
    currentProperty.contract_type
      ? currentProperty.contract_type.charAt(0).toUpperCase() +
        currentProperty.contract_type.slice(1)
      : null,
    currentProperty.property_type
      ? currentProperty.property_type.charAt(0).toUpperCase() +
        currentProperty.property_type.slice(1)
      : null,
  ].filter(Boolean) as string[]

  const extraFeatures = [
    currentProperty.has_garage ? 'Garage' : null,
    currentProperty.has_parking ? 'Posto auto' : null,
    currentProperty.has_garden ? 'Giardino' : null,
    currentProperty.has_elevator ? 'Ascensore' : null,
    currentProperty.is_auction ? 'Immobile all’asta' : null,
  ].filter(Boolean) as string[]

  const infoCards = [
    {
      label: 'Stato immobile',
      value: formatOptionLabel(currentProperty.condition, 'Da definire'),
      visible: shouldRenderOptionalField(currentProperty.condition),
      spanClass: '',
    },
    {
      label: 'Disponibilità',
      value: formatOptionLabel(currentProperty.availability, 'Da definire'),
      visible: shouldRenderOptionalField(currentProperty.availability),
      spanClass: '',
    },
    {
      label: 'Anno costruzione',
      value: currentProperty.year_built ? String(currentProperty.year_built) : 'Da definire',
      visible: Boolean(currentProperty.year_built),
      spanClass: '',
    },
    {
      label: 'Piano',
      value: [currentProperty.floor, currentProperty.total_floors ? `di ${currentProperty.total_floors}` : null].filter(Boolean).join(' ') || 'Da definire',
      visible: shouldRenderOptionalField(currentProperty.floor) || shouldRenderOptionalField(currentProperty.total_floors),
      spanClass: '',
    },
    {
      label: 'Balconi / terrazzi',
      value: `${currentProperty.balconies || 0} balconi · ${currentProperty.terraces || 0} terrazzi`,
      visible: Boolean(currentProperty.balconies || currentProperty.terraces),
      spanClass: '',
    },
    {
      label: 'Esposizione',
      value: formatOptionLabel(currentProperty.exposure, 'Da definire'),
      visible: shouldRenderOptionalField(currentProperty.exposure),
      spanClass: '',
    },
    {
      label: 'Classe energetica',
      value: formatLabel(currentProperty.energy_class, '-'),
      visible: true,
      spanClass: '',
    },
    {
      label: 'Spese condominiali',
      value: currentProperty.condo_fees_amount
        ? `€ ${currentProperty.condo_fees_amount.toLocaleString('it-IT')}${currentProperty.condo_fees_period ? ` / ${formatOptionLabel(currentProperty.condo_fees_period)}` : ''}`
        : formatLabel(currentProperty.condo_fees, 'Da definire'),
      visible: true,
      spanClass: '',
    },
    {
      label: 'Riscaldamento',
      value: formatLabel(currentProperty.heating_type, 'Da definire'),
      visible: true,
      spanClass: '',
    },
    {
      label: 'Fonte riscaldamento',
      value: formatOptionLabel(currentProperty.heating_source, 'Da definire'),
      visible: shouldRenderOptionalField(currentProperty.heating_source),
      spanClass: '',
    },
    {
      label: 'Prestazione energetica',
      value: formatLabel(currentProperty.energy_epgl),
      visible: shouldRenderOptionalField(currentProperty.energy_epgl),
      spanClass: '',
    },
    {
      label: 'Ammobiliato',
      value: formatOptionLabel(currentProperty.furnished_status, 'Da definire'),
      visible: true,
      spanClass: '',
    },
    {
      label: 'Cauzione',
      value: formatLabel(currentProperty.deposit_amount),
      visible: shouldRenderOptionalField(currentProperty.deposit_amount),
      spanClass: '',
    },
    {
      label: 'Anticipo',
      value: formatLabel(currentProperty.advance_amount),
      visible: shouldRenderOptionalField(currentProperty.advance_amount),
      spanClass: '',
    },
    {
      label: 'Anticipo + cauzione',
      value: formatLabel(currentProperty.advance_deposit_amount),
      visible: shouldRenderOptionalField(currentProperty.advance_deposit_amount),
      spanClass: 'md:col-span-2 xl:col-span-3',
    },
  ].filter((item) => item.visible)

  const fullAddressForMaps = [
    currentProperty.address,
    currentProperty.comune,
    currentProperty.province,
    'Italia',
  ]
    .filter(Boolean)
    .join(', ')

  const googleMapsHref = fullAddressForMaps
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddressForMaps)}`
    : null

  return (
    <main className="min-h-screen bg-[var(--site-bg)] text-[var(--site-text)] transition-colors duration-300">
      <SiteHeader />

      <section className="border-b border-[var(--site-border)] bg-[var(--site-bg-soft)] transition-colors duration-300">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <Link
            href="/immobili"
            className="text-sm text-[var(--site-text-faint)] transition hover:text-[var(--site-text)]"
          >
            ← Torna agli immobili
          </Link>

          <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="flex flex-wrap gap-2">
                {currentProperty.contract_type && (
                  <span className="theme-badge inline-flex rounded-full border px-3 py-1 text-xs uppercase tracking-[0.2em]">
                    {currentProperty.contract_type}
                  </span>
                )}

                {currentProperty.property_type && (
                  <span className="theme-badge inline-flex rounded-full border px-3 py-1 text-xs uppercase tracking-[0.2em]">
                    {currentProperty.property_type}
                  </span>
                )}

                {currentProperty.is_auction && (
                  <span className="theme-badge inline-flex rounded-full border px-3 py-1 text-xs uppercase tracking-[0.2em]">
                    Asta
                  </span>
                )}
              </div>

              <h1 className="mt-4 text-3xl font-semibold leading-tight text-[var(--site-text)] md:text-5xl">
                {currentProperty.title || 'Immobile'}
              </h1>

              {currentProperty.reference_code && (
                <div className="mt-3 flex items-center gap-2 text-sm text-[var(--site-text-muted)]">
                  <span>
                    Codice annuncio{' '}
                    <span className="font-semibold tracking-[0.12em] text-[var(--site-text-soft)]">
                      {currentProperty.reference_code}
                    </span>
                  </span>
                  <CopyReferenceButton value={currentProperty.reference_code} />
                </div>
              )}

              <p className="mt-3 text-base text-[var(--site-text-muted)] md:text-lg">
                {currentProperty.comune || '—'} ({currentProperty.province || '—'})
                {currentProperty.frazione ? ` • ${currentProperty.frazione}` : ''}
              </p>

              {currentProperty.address && (
                <p className="mt-2 text-sm text-[var(--site-text-faint)] md:text-base">
                  {currentProperty.address}
                </p>
              )}
            </div>

            <div className="md:text-right">
              <p className="text-sm uppercase tracking-[0.25em] text-[var(--site-text-faint)]">
                Prezzo
              </p>
              {currentProperty.price ? (
                <p className="mt-2 text-3xl font-semibold text-[var(--site-text)] md:text-5xl">
                  € {currentProperty.price.toLocaleString('it-IT')}
                </p>
              ) : (
                <p className="mt-2 text-2xl font-semibold text-[var(--site-text)] md:text-4xl">
                  Trattativa riservata
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <PropertyGalleryClient
          images={images.map((image) => ({
            id: image.id,
            file_url: image.file_url,
            label: image.label,
            is_cover: image.is_cover,
          }))}
        />
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-8">

            <div className="theme-panel rounded-[30px] border p-7">
              <h2 className="text-2xl font-semibold text-[var(--site-text)]">
                Descrizione
              </h2>

              <div className="mt-5 space-y-4 text-sm leading-8 text-[var(--site-text-muted)] md:text-base">
                {currentProperty.description ? (
                  currentProperty.description
                    .split('\n')
                    .filter((paragraph) => paragraph.trim().length > 0)
                    .map((paragraph, index) => <p key={index}>{paragraph}</p>)
                ) : (
                  <p>Descrizione in aggiornamento.</p>
                )}
              </div>
            </div>

            <div className="theme-panel flex flex-col gap-4 rounded-[24px] border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--site-text)]">
                  Vuoi maggiori informazioni su questo immobile?
                </p>
                <p className="mt-1 text-xs text-[var(--site-text-muted)]">
                  Puoi richiedere una visita, chiamare l’agenzia o continuare la ricerca.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <a
                  href="#contatto"
                  className="theme-button-primary liquid-button inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold transition"
                >
                  <span>Richiedi visita</span>
                </a>

                <a
                  href="tel:+39035221206"
                  className="theme-button-secondary liquid-button inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold transition"
                >
                  <span>Chiama ora</span>
                </a>

                <Link
                  href="/immobili"
                  className="inline-flex items-center justify-center rounded-full border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-2 text-xs font-semibold text-[var(--site-text-soft)] transition hover:bg-[var(--site-surface-2)] hover:text-[var(--site-text)]"
                >
                  Altri immobili
                </Link>
              </div>
            </div>

            <div className="theme-panel rounded-[30px] border p-7">
              <h2 className="text-2xl font-semibold text-[var(--site-text)]">
                Dettagli principali
              </h2>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {detailFeatures.length > 0 ? (
                  detailFeatures.map((feature) => (
                    <div
                      key={feature}
                      className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-strong)] px-4 py-4 text-sm text-[var(--site-text-soft)]"
                    >
                      {feature}
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-strong)] px-4 py-4 text-sm text-[var(--site-text-faint)]">
                    Dettagli in aggiornamento
                  </div>
                )}
              </div>
            </div>

            <div className="theme-panel rounded-[30px] border p-7">
              <h2 className="text-2xl font-semibold text-[var(--site-text)]">
                Informazioni aggiuntive
              </h2>

              <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {infoCards.map((card) => (
                  <div
                    key={card.label}
                    className={`rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-strong)] px-4 py-4 ${card.spanClass}`}
                  >
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--site-text-faint)]">
                      {card.label}
                    </p>
                    <p className="mt-2 text-sm text-[var(--site-text-soft)]">
                      {card.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {extraFeatures.length > 0 && (
              <div className="theme-panel rounded-[30px] border p-7">
                <h2 className="text-2xl font-semibold text-[var(--site-text)]">
                  Caratteristiche
                </h2>

                <div className="mt-6 flex flex-wrap gap-3">
                  {extraFeatures.map((feature) => (
                    <span
                      key={feature}
                      className="theme-badge rounded-full border px-4 py-2 text-sm"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}


            <SimilarPropertyAlertForm
              propertyId={currentProperty.id}
              propertySlug={currentProperty.slug}
              propertyTitle={currentProperty.title}
              contractType={currentProperty.contract_type}
              propertyType={currentProperty.property_type}
              comune={currentProperty.comune}
              province={currentProperty.province}
              price={currentProperty.price}
              surface={currentProperty.surface}
              rooms={currentProperty.rooms}
              bathrooms={currentProperty.bathrooms}
              hasGarage={currentProperty.has_garage}
              hasParking={currentProperty.has_parking}
              hasGarden={currentProperty.has_garden}
              hasElevator={currentProperty.has_elevator}
            />

            <div className="grid gap-8 xl:grid-cols-2">
              <div className="theme-panel rounded-[30px] border p-7">
                <h2 className="text-2xl font-semibold text-[var(--site-text)]">
                  Planimetrie
                </h2>

                {plans.length > 0 ? (
                  <div className="mt-5 space-y-4">
                    {plans.map((plan) => (
                      <a
                        key={plan.id}
                        href={plan.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex min-h-[88px] items-center justify-between rounded-[24px] border border-[var(--site-border)] bg-[var(--site-surface-strong)] px-5 py-4 text-sm text-[var(--site-text-soft)] transition hover:bg-[var(--site-surface-2)]"
                      >
                        <span>{plan.label || 'Apri planimetria'}</span>
                        <span className="text-[var(--site-text-faint)]">Apri</span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="mt-5 flex min-h-[280px] items-center justify-center rounded-[24px] border border-dashed border-[var(--site-border)] bg-[var(--site-surface-strong)] text-sm text-[var(--site-text-faint)]">
                    Nessuna planimetria disponibile
                  </div>
                )}
              </div>

              <div className="theme-panel rounded-[30px] border p-7">
                <h2 className="text-2xl font-semibold text-[var(--site-text)]">
                  Posizione
                </h2>

                <div className="mt-5">
                  <SinglePropertyMapSection
                    title={currentProperty.title}
                    comune={currentProperty.comune}
                    province={currentProperty.province}
                    price={currentProperty.price}
                    latitude={currentProperty.latitude}
                    longitude={currentProperty.longitude}
                    locationMode={currentProperty.location_mode}
                  />
                </div>

                <p className="mt-4 text-sm text-[var(--site-text-faint)]">
                  {currentProperty.location_mode === 'comune_center'
                    ? 'La posizione mostrata è indicativa e centrata sul comune.'
                    : currentProperty.latitude && currentProperty.longitude
                      ? 'La posizione mostrata è disponibile sulla mappa.'
                      : 'La posizione non è ancora disponibile.'}
                </p>

                {googleMapsHref && (
                  <a
                    href={googleMapsHref}
                    target="_blank"
                    rel="noreferrer"
                    className="theme-button-secondary liquid-button mt-4 inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm transition"
                  >
                    <span>Apri indirizzo su Google Maps</span>
                    <span className="opacity-60">↗</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          <aside
            id="contatto"
            className="theme-panel h-fit scroll-mt-28 rounded-[30px] border p-7 lg:sticky lg:top-24"
          >
            <h2 className="text-2xl font-semibold text-[var(--site-text)]">
              Richiedi visita o informazioni
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--site-text-muted)]">
              Lascia i tuoi dati per essere ricontattato dall’agenzia su questo immobile.
            </p>

            <PropertyContactForm
              propertyId={currentProperty.id}
              propertySlug={currentProperty.slug}
              propertyTitle={currentProperty.title}
            />
          </aside>
        </div>
      </section>

      <FooterReveal>
        <Footer />
      </FooterReveal>
    </main>
  )
}