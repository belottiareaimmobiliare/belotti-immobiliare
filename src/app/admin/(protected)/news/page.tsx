import { createClient } from '@/lib/supabase/server'
import AdminNewsManager from '@/components/admin/AdminNewsManager'

export default async function AdminNewsPage() {
  const supabase = await createClient()

  const [{ data: newsData, error: newsError }, { data: authorsData, error: authorsError }] =
    await Promise.all([
      supabase
        .from('news_items')
        .select(`
          *,
          news_media (*)
        `)
        .order('is_pinned', { ascending: false })
        .order('pin_order', { ascending: true, nullsFirst: false })
        .order('sort_order', { ascending: true })
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false }),
      supabase
        .from('news_authors')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('full_name', { ascending: true }),
    ])

  if (newsError) {
    return (
      <section className="text-[var(--site-text)]">
        <p className="theme-admin-faint text-sm uppercase tracking-[0.2em]">
          News
        </p>
        <h2 className="mt-2 text-3xl font-semibold text-[var(--site-text)]">
          Gestione news pubbliche
        </h2>
        <div className="mt-6 rounded-3xl border border-red-400/20 bg-red-500/10 p-6 text-red-300">
          Errore nel caricamento news.
        </div>
      </section>
    )
  }

  if (authorsError) {
    return (
      <section className="text-[var(--site-text)]">
        <p className="theme-admin-faint text-sm uppercase tracking-[0.2em]">
          News
        </p>
        <h2 className="mt-2 text-3xl font-semibold text-[var(--site-text)]">
          Gestione news pubbliche
        </h2>
        <div className="mt-6 rounded-3xl border border-red-400/20 bg-red-500/10 p-6 text-red-300">
          Errore nel caricamento autori.
        </div>
      </section>
    )
  }

  return <AdminNewsManager items={newsData || []} authors={authorsData || []} />
}