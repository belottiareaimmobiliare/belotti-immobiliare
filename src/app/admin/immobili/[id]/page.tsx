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
    <section className="mx-auto w-full max-w-4xl px-4">
      <p className="text-sm uppercase tracking-[0.2em] text-white/40">
        Modifica immobile
      </p>

      <h2 className="mt-2 text-3xl font-semibold text-white">
        {property.title}
      </h2>

      <p className="mt-3 text-white/60">
        Aggiorna dati, immagini, copertina e planimetrie dell’immobile.
      </p>

      <PropertyMediaManagerV2
        propertyId={property.id}
        media={media || []}
      />

      <EditForm property={property} />
    </section>
  )
}