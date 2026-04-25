import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import EditForm from './EditForm'
import PropertyMediaManagerV2 from '@/components/admin/PropertyMediaManagerV2'

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
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
    <section className="mx-auto w-full max-w-4xl px-4 text-[var(--site-text)]">
      <p className="theme-admin-faint text-sm uppercase tracking-[0.2em]">
        Modifica immobile
      </p>

      <h2 className="mt-2 text-3xl font-semibold text-[var(--site-text)]">
        {property.title}
      </h2>

      <p className="theme-admin-muted mt-3">
        Aggiorna dati, immagini, copertina e planimetrie dell’immobile.
      </p>

      <PropertyMediaManagerV2
        propertyId={property.id}
        media={media || []}
        photoComingSoon={Boolean(property.photo_coming_soon)}
        noPhotoAvailable={Boolean(property.no_photo_available)}
      />

      <EditForm property={property} />
    </section>
  )
}