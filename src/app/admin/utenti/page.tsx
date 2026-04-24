import Link from 'next/link'
import { requireOwner } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  await requireOwner()

  return (
    <div className="space-y-6">
      <section className="theme-panel rounded-[26px] border p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/admin"
            className="inline-flex items-center justify-center rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-surface-2)]"
          >
            ← Torna alla dashboard
          </Link>

          <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-2.5 text-sm text-[var(--site-text-muted)]">
            Area riservata Admin Proprietario
          </div>
        </div>
      </section>

      <section className="theme-panel rounded-[34px] border p-6 md:p-8">
        <p className="text-sm uppercase tracking-[0.24em] text-[var(--site-text-faint)]">
          Gestione utenti
        </p>

        <h1 className="mt-3 text-3xl font-semibold leading-tight text-[var(--site-text)] md:text-4xl">
          Gestione Agenti e Proprietari del sito
        </h1>

        <p className="mt-4 max-w-4xl text-sm leading-8 text-[var(--site-text-muted)] md:text-base">
          Da qui il proprietario gestirà owner, agenti ed editor con permessi,
          attivazione account, Gmail autorizzata opzionale e future credenziali di
          accesso controllate dal gestionale.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="theme-panel rounded-[28px] border p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--site-text-faint)]">
            Ruolo 01
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-[var(--site-text)]">
            Proprietari
          </h2>
          <p className="mt-4 text-sm leading-8 text-[var(--site-text-muted)]">
            Fino a 3 owner con pieno accesso a contenuti, utenti, log, KPI,
            controllo sito e gestione operativa completa del gestionale.
          </p>
        </div>

        <div className="theme-panel rounded-[28px] border p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--site-text-faint)]">
            Ruolo 02
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-[var(--site-text)]">
            Agenti
          </h2>
          <p className="mt-4 text-sm leading-8 text-[var(--site-text-muted)]">
            Accesso a immobili, affitti, vendite e permessi selettivi sulla
            pubblicazione. Potranno usare user/password e, se configurata, anche
            Gmail autorizzata.
          </p>
        </div>

        <div className="theme-panel rounded-[28px] border p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--site-text-faint)]">
            Ruolo 03
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-[var(--site-text)]">
            Editor
          </h2>
          <p className="mt-4 text-sm leading-8 text-[var(--site-text-muted)]">
            Accesso a news e contenuti editoriali, con menu separato rispetto agli
            owner e senza modifica dei contenuti strutturali del sito.
          </p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="theme-panel rounded-[30px] border p-6">
          <h2 className="text-xl font-semibold text-[var(--site-text)]">
            Cosa gestiremo qui
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] p-4">
              <p className="text-sm font-semibold text-[var(--site-text)]">
                Creazione utenti
              </p>
              <p className="mt-2 text-sm leading-7 text-[var(--site-text-muted)]">
                Nome, cognome, username interno, mail di login e ruolo base.
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] p-4">
              <p className="text-sm font-semibold text-[var(--site-text)]">
                Permessi e sidebar
              </p>
              <p className="mt-2 text-sm leading-7 text-[var(--site-text-muted)]">
                Proprietà immobili, news, contenuti sito, logs e KPI.
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] p-4">
              <p className="text-sm font-semibold text-[var(--site-text)]">
                Gmail autorizzata
              </p>
              <p className="mt-2 text-sm leading-7 text-[var(--site-text-muted)]">
                Facoltativa per utente, valida solo se preinserita dal proprietario.
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] p-4">
              <p className="text-sm font-semibold text-[var(--site-text)]">
                Stato account
              </p>
              <p className="mt-2 text-sm leading-7 text-[var(--site-text-muted)]">
                Attivazione, disattivazione e controllo accessi futuri.
              </p>
            </div>
          </div>
        </div>

        <div className="theme-panel rounded-[30px] border p-6">
          <h2 className="text-xl font-semibold text-[var(--site-text)]">
            Prossimo step operativo
          </h2>
          <p className="mt-4 text-sm leading-8 text-[var(--site-text-muted)]">
            Nel passo successivo costruiamo la tabella utenti vera con lista,
            creazione, modifica ruolo, gestione permessi, Gmail autorizzata e stato
            account.
          </p>

          <div className="mt-6 rounded-2xl border border-dashed border-[var(--site-border)] bg-[var(--site-surface)] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--site-text-faint)]">
              Stato pagina
            </p>
            <p className="mt-2 text-sm font-semibold text-[var(--site-text)]">
              Placeholder avanzato pronto per evoluzione CRUD utenti
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}