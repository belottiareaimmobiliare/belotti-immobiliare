import { createClient } from '@/lib/supabase/server'
import AdminAuthorsManager from '@/components/admin/AdminAuthorsManager'

export default async function AdminAuthorsPage() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('news_authors')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('full_name', { ascending: true })

  if (error) {
    return (
      <section className="text-[var(--site-text)]">
        <p className="theme-admin-faint text-sm uppercase tracking-[0.2em]">
          Autori
        </p>
        <h2 className="mt-2 text-3xl font-semibold text-[var(--site-text)]">
          Gestione autori
        </h2>
        <div className="mt-6 rounded-3xl border border-red-400/20 bg-red-500/10 p-6 text-red-300">
          Errore nel caricamento autori.
        </div>
      </section>
    )
  }

  return <AdminAuthorsManager items={data || []} />
}