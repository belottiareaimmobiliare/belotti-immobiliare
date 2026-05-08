import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'
import FloatingLeadNotePreview from './FloatingLeadNotePreview'

type AdminPropertyNotePreviewPageProps = {
  params: Promise<{
    id: string
  }>
  searchParams?: Promise<{
    note?: string
  }>
}

type PropertyPreview = {
  id: string
  title: string
  slug: string
  reference_code: string | null
}

export default async function AdminPropertyNotePreviewPage({
  params,
  searchParams,
}: AdminPropertyNotePreviewPageProps) {
  const { id } = await params
  const query = searchParams ? await searchParams : {}
  const initialNote = String(query.note ?? '')

  const supabase = createServiceClient()

  const { data } = await supabase
    .from('properties')
    .select('id, title, slug, reference_code')
    .eq('id', id)
    .maybeSingle()

  const property = data as PropertyPreview | null

  if (!property) {
    notFound()
  }

  const publicHref = `/immobili/${property.slug}`
  const leadsHref = property.reference_code
    ? `/admin/leads?q=${encodeURIComponent(property.reference_code)}`
    : '/admin/leads'

  return (
    <main className="min-h-screen bg-[var(--site-bg)] text-[var(--site-text)]">
      <header className="sticky top-0 z-40 border-b border-[var(--site-border)] bg-[var(--site-surface)]/95 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--site-text-faint)]">
              Vista pubblica con nota agente
            </p>

            <h1 className="mt-1 truncate text-lg font-semibold text-[var(--site-text)]">
              {property.title}
            </h1>

            <p className="mt-1 text-xs text-[var(--site-text-muted)]">
              {property.reference_code ? `Rif. ${property.reference_code}` : 'Riferimento non indicato'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={leadsHref}
              className="inline-flex items-center justify-center rounded-full border border-[var(--site-border)] px-4 py-2.5 text-xs font-semibold text-[var(--site-text-soft)] transition hover:border-[var(--site-border-strong)] hover:bg-[var(--site-surface-2)] hover:text-[var(--site-text)]"
            >
              Torna ai leads
            </Link>

            <Link
              href={`/admin/immobili/${property.id}`}
              className="inline-flex items-center justify-center rounded-full border border-[var(--site-border)] px-4 py-2.5 text-xs font-semibold text-[var(--site-text-soft)] transition hover:border-[var(--site-border-strong)] hover:bg-[var(--site-surface-2)] hover:text-[var(--site-text)]"
            >
              Modifica
            </Link>

            <Link
              href={publicHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2.5 text-xs font-semibold text-black transition hover:bg-[#eef2f7]"
            >
              Apri pubblica nuova scheda
            </Link>
          </div>
        </div>
      </header>

      <section className="relative h-[calc(100vh-86px)] min-h-[680px] bg-white">
        <iframe
          src={publicHref}
          title={`Scheda pubblica ${property.title}`}
          className="h-full w-full border-0 bg-white"
        />

        <FloatingLeadNotePreview
          propertyId={property.id}
          propertyTitle={property.title}
          propertySlug={property.slug}
          initialNote={initialNote}
        />
      </section>
    </main>
  )
}
