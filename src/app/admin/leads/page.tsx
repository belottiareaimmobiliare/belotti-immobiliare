import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

type Lead = {
  id: string
  property_id: string | null
  property_slug: string | null
  property_title: string | null
  full_name: string
  email: string
  phone: string | null
  message: string | null
  created_at: string
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat('it-IT', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value))
  } catch {
    return value
  }
}

export default async function AdminLeadsPage() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })

  const leads = (data || []) as Lead[]

  return (
    <main className="min-h-screen bg-[#0a0f1a] px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-white/40">
              Admin leads
            </p>
            <h1 className="mt-2 text-4xl font-semibold">Richieste ricevute</h1>
            <p className="mt-3 text-white/60">
              Contatti arrivati dalle schede immobile.
            </p>
          </div>

          <Link
            href="/admin"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 transition hover:bg-white/10"
          >
            Torna alla dashboard
          </Link>
        </div>

        {error ? (
          <div className="mt-8 rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-red-200">
            Errore nel caricamento delle richieste.
          </div>
        ) : null}

        {!error && leads.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-white/60">
            Nessuna richiesta presente.
          </div>
        ) : null}

        <div className="mt-8 space-y-5">
          {leads.map((lead) => (
            <article
              key={lead.id}
              className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                    Richiesta
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold">
                    {lead.full_name}
                  </h2>
                  <p className="mt-2 text-sm text-white/50">
                    {formatDate(lead.created_at)}
                  </p>
                </div>

                {lead.property_slug ? (
                  <Link
                    href={`/immobili/${lead.property_slug}`}
                    target="_blank"
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 transition hover:bg-white/10"
                  >
                    Apri immobile
                  </Link>
                ) : null}
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                    Immobile
                  </p>
                  <p className="mt-2 text-sm text-white/80">
                    {lead.property_title || 'Non associato'}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                    Email
                  </p>
                  <p className="mt-2 break-all text-sm text-white/80">
                    {lead.email}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                    Cellulare
                  </p>
                  <p className="mt-2 text-sm text-white/80">
                    {lead.phone || '—'}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                    Slug immobile
                  </p>
                  <p className="mt-2 text-sm text-white/80">
                    {lead.property_slug || '—'}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                  Messaggio
                </p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-white/75">
                  {lead.message || 'Nessun messaggio inserito.'}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  )
}