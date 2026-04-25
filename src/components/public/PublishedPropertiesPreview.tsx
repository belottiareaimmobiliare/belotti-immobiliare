import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function PublishedPropertiesPreview() {
  const supabase = await createClient()

  const { data: properties, error } = await supabase
    .from('properties')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(3)

  if (error) {
    return (
      <section className="mx-auto w-full max-w-6xl px-4 py-16">
        <p className="text-red-400">Errore nel caricamento immobili.</p>
      </section>
    )
  }

  if (!properties || properties.length === 0) {
    return (
      <section className="mx-auto w-full max-w-6xl px-4 py-16">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white/70">
          Nessun immobile pubblicato al momento.
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-16">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-white/40">
            Immobili in evidenza
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-white">
            Le soluzioni più interessanti del momento
          </h2>
        </div>

        <Link
          href="/immobili"
          className="text-sm text-white/70 transition hover:text-white"
        >
          Vedi tutti →
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {properties.map((property) => (
          <Link
            key={property.id}
            href={`/immobili/${property.slug}`}
            className="group rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:bg-white/10"
          >
            <div
              className="flex min-h-[220px] items-end rounded-2xl border border-white/10 bg-black/20 bg-cover bg-center p-4"
              style={
                property.main_image
                  ? { backgroundImage: `url('${property.main_image}')` }
                  : undefined
              }
            >
              {!property.main_image && (
                <span className="text-xs uppercase tracking-[0.18em] text-white/35">
                  Anteprima immobile
                </span>
              )}
            </div>

            <div className="mt-5">
              {property.reference_code && (
                <p className="mb-2 text-xs uppercase tracking-[0.18em] text-white/35">
                  Rif. {property.reference_code}
                </p>
              )}

              <h3 className="text-xl font-semibold text-white transition group-hover:text-white/90">
                {property.title}
              </h3>

              <p className="mt-2 text-sm text-white/50">
                {property.comune || '—'} ({property.province || '—'})
                {property.frazione ? ` • ${property.frazione}` : ''}
              </p>

              {(property.surface || property.rooms || property.bedrooms) && (
                <p className="mt-3 text-sm text-white/50">
                  {property.surface ? `${property.surface} mq` : ''}
                  {property.surface && (property.rooms || property.bedrooms) ? ' · ' : ''}
                  {property.rooms ? `${property.rooms} locali` : ''}
                  {property.rooms && property.bedrooms ? ' · ' : ''}
                  {property.bedrooms ? `${property.bedrooms} camere` : ''}
                </p>
              )}

              <p className="mt-4 text-2xl font-semibold text-white">
                {property.price ? `€ ${property.price.toLocaleString('it-IT')}` : 'Trattativa riservata'}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}