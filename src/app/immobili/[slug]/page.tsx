import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SiteHeader from '@/components/public/SiteHeader'
import SinglePropertyMapSection from '@/components/public/SinglePropertyMapSection'
import PropertyContactForm from '@/components/public/PropertyContactForm'
import PropertyGalleryClient from '@/components/public/PropertyGalleryClient'

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
    <main className="min-h-screen bg-[#0a0f1a] text-white">
      <SiteHeader />

      <section className="border-b border-white/10 bg-[#0d1321]">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <Link
            href="/immobili"
            className="text-sm text-white/45 transition hover:text-white"
          >
            ← Torna agli immobili
          </Link>

          <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="flex flex-wrap gap-2">
                {currentProperty.contract_type && (
                  <span className="inline-flex rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/55">
                    {currentProperty.contract_type}
                  </span>
                )}

                {currentProperty.property_type && (
                  <span className="inline-flex rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/55">
                    {currentProperty.property_type}
                  </span>
                )}

                {currentProperty.is_auction && (
                  <span className="inline-flex rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/55">
                    Asta
                  </span>
                )}
              </div>

              <h1 className="mt-4 text-3xl font-semibold leading-tight md:text-5xl">
                {currentProperty.title || 'Immobile'}
              </h1>

              <p className="mt-3 text-base text-white/60 md:text-lg">
                {currentProperty.comune || '—'} ({currentProperty.province || '—'})
                {currentProperty.frazione ? ` • ${currentProperty.frazione}` : ''}
              </p>

              {currentProperty.address && (
                <p className="mt-2 text-sm text-white/50 md:text-base">
                  {currentProperty.address}
                </p>
              )}
            </div>

            <div className="md:text-right">
              <p className="text-sm uppercase tracking-[0.25em] text-white/40">
                Prezzo
              </p>
              {currentProperty.price ? (
                <p className="mt-2 text-3xl font-semibold md:text-5xl">
                  € {currentProperty.price.toLocaleString()}
                </p>
              ) : (
                <p className="mt-2 text-2xl font-semibold md:text-4xl">
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
            <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-7">
              <h2 className="text-2xl font-semibold">Dettagli principali</h2>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {detailFeatures.length > 0 ? (
                  detailFeatures.map((feature) => (
                    <div
                      key={feature}
                      className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/80"
                    >
                      {feature}
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/50">
                    Dettagli in aggiornamento
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-7">
              <h2 className="text-2xl font-semibold">Informazioni aggiuntive</h2>

              <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                    Classe energetica
                  </p>
                  <p className="mt-2 text-sm text-white/80">
                    {formatLabel(currentProperty.energy_class, '-')}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                    Spese condominiali
                  </p>
                  <p className="mt-2 text-sm text-white/80">
                    {formatLabel(currentProperty.condo_fees, 'Da definire')}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                    Riscaldamento
                  </p>
                  <p className="mt-2 text-sm text-white/80">
                    {formatLabel(currentProperty.heating_type, 'Da definire')}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                    Ammobiliato
                  </p>
                  <p className="mt-2 text-sm text-white/80">
                    {formatLabel(currentProperty.furnished_status, 'Da definire')}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                    Cauzione
                  </p>
                  <p className="mt-2 text-sm text-white/80">
                    {formatLabel(currentProperty.deposit_amount, 'Da definire')}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                    Anticipo
                  </p>
                  <p className="mt-2 text-sm text-white/80">
                    {formatLabel(currentProperty.advance_amount, 'Da definire')}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 md:col-span-2 xl:col-span-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                    Anticipo + cauzione
                  </p>
                  <p className="mt-2 text-sm text-white/80">
                    {formatLabel(
                      currentProperty.advance_deposit_amount,
                      'Da definire'
                    )}
                  </p>
                </div>
              </div>
            </div>

            {extraFeatures.length > 0 && (
              <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-7">
                <h2 className="text-2xl font-semibold">Caratteristiche</h2>

                <div className="mt-6 flex flex-wrap gap-3">
                  {extraFeatures.map((feature) => (
                    <span
                      key={feature}
                      className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-7">
              <h2 className="text-2xl font-semibold">Descrizione</h2>

              <div className="mt-5 space-y-4 text-sm leading-8 text-white/65 md:text-base">
                {currentProperty.description ? (
                  currentProperty.description
                    .split('\n')
                    .filter((paragraph) => paragraph.trim().length > 0)
                    .map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))
                ) : (
                  <p>Descrizione in aggiornamento.</p>
                )}
              </div>
            </div>

            <div className="grid gap-8 xl:grid-cols-2">
              <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-7">
                <h2 className="text-2xl font-semibold">Planimetrie</h2>

                {plans.length > 0 ? (
                  <div className="mt-5 space-y-4">
                    {plans.map((plan) => (
                      <a
                        key={plan.id}
                        href={plan.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex min-h-[88px] items-center justify-between rounded-[24px] border border-white/10 bg-black/20 px-5 py-4 text-sm text-white/80 transition hover:border-white/20 hover:bg-black/30"
                      >
                        <span>{plan.label || 'Apri planimetria'}</span>
                        <span className="text-white/45">Apri</span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="mt-5 flex min-h-[280px] items-center justify-center rounded-[24px] border border-dashed border-white/15 bg-black/20 text-sm text-white/40">
                    Nessuna planimetria disponibile
                  </div>
                )}
              </div>

              <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-7">
                <h2 className="text-2xl font-semibold">Posizione</h2>

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

                <p className="mt-4 text-sm text-white/50">
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
                    className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
                  >
                    <span>Apri indirizzo su Google Maps</span>
                    <span className="text-white/45">↗</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          <aside
            id="contatto"
            className="h-fit rounded-[30px] border border-white/10 bg-white/[0.03] p-7 lg:sticky lg:top-24"
          >
            <h2 className="text-2xl font-semibold">Richiedi informazioni</h2>
            <p className="mt-3 text-sm leading-7 text-white/60">
              Invia una richiesta rapida all’agenzia per questo immobile.
            </p>

            <PropertyContactForm
              propertyId={currentProperty.id}
              propertySlug={currentProperty.slug}
              propertyTitle={currentProperty.title}
            />
          </aside>
        </div>
      </section>
    </main>
  )
}