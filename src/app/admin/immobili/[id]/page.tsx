import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
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

      <div className="my-6 rounded-3xl border border-[var(--site-border)] bg-[var(--site-bg-soft)] p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="theme-admin-faint text-xs uppercase tracking-[0.22em]">
              Materiale promozionale
            </p>
            <p className="theme-admin-muted mt-2 text-sm">
              Crea una scheda grafica partendo da foto e dati già inseriti nell’immobile.
            </p>
          </div>

          <Link
            href={`/admin/immobili/${property.id}/scheda-social`}
            className="theme-admin-button-primary rounded-2xl px-5 py-3 text-center text-sm font-semibold"
          >
            Genera scheda social / vetrina
          </Link>
        </div>
      </div>

      <EditForm property={property} />
    </section>
  )
}