import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SocialCardGenerator from './SocialCardGenerator'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function PropertySocialCardPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: property, error: propertyError }, { data: media, error: mediaError }] =
    await Promise.all([
      supabase.from('properties').select('*').eq('id', id).single(),
      supabase
        .from('property_media')
        .select('*')
        .eq('property_id', id)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true }),
    ])

  if (propertyError || !property) {
    return notFound()
  }

  if (mediaError) {
    console.error(mediaError)
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-6 text-[var(--site-text)]">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="theme-admin-faint text-sm uppercase tracking-[0.2em]">
            Scheda social / vetrina
          </p>
          <h1 className="mt-2 text-3xl font-semibold">
            {property.title || 'Immobile'}
          </h1>
          <p className="theme-admin-muted mt-2">
            Genera una grafica promozionale partendo da dati e immagini dell’immobile.
          </p>
        </div>

        <Link
          href={`/admin/immobili/${property.id}`}
          className="theme-button-secondary rounded-2xl px-5 py-3 text-sm"
        >
          Torna all’immobile
        </Link>
      </div>

      <SocialCardGenerator property={property} media={media || []} />
    </section>
  )
}
