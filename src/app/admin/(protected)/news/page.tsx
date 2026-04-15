import { createClient } from '@/lib/supabase/server'
import AdminNewsManager from '@/components/admin/AdminNewsManager'

export default async function AdminNewsPage() {
  const supabase = await createClient()

  const [{ data: newsData, error: newsError }, { data: settingsData, error: settingsError }] =
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
        .from('news_settings')
        .select('*')
        .limit(1)
        .maybeSingle(),
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

  return (
    <AdminNewsManager
      items={newsData || []}
      settings={
        settingsError || !settingsData
          ? null
          : {
              id: settingsData.id,
              facebook_page_url: settingsData.facebook_page_url,
              facebook_page_name: settingsData.facebook_page_name,
              facebook_page_id: settingsData.facebook_page_id,
              facebook_access_token: settingsData.facebook_access_token,
              facebook_sync_enabled: settingsData.facebook_sync_enabled,
              last_sync_at: settingsData.last_sync_at,
              last_sync_status: settingsData.last_sync_status,
              last_sync_message: settingsData.last_sync_message,
            }
      }
    />
  )
}