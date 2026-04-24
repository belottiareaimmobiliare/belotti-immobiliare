import { requireOwner } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  await requireOwner()

  return (
    <div className="space-y-6">
      <section className="theme-panel rounded-[30px] border p-6">
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--site-text-faint)]">
          Gestione utenti
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-[var(--site-text)]">
          Gestione Agenti e Proprietari del sito
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--site-text-muted)]">
          Qui andremo a gestire owner, agenti ed editor con permessi, Gmail
          autorizzata opzionale, attivazione/disattivazione account e credenziali
          di accesso.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="theme-panel rounded-[26px] border p-5">
          <h2 className="text-lg font-semibold text-[var(--site-text)]">
            Proprietari
          </h2>
          <p className="mt-2 text-sm leading-7 text-[var(--site-text-muted)]">
            Fino a 3 owner con pieno accesso a contenuti, utenti, log e controllo
            generale del gestionale.
          </p>
        </div>

        <div className="theme-panel rounded-[26px] border p-5">
          <h2 className="text-lg font-semibold text-[var(--site-text)]">
            Agenti
          </h2>
          <p className="mt-2 text-sm leading-7 text-[var(--site-text-muted)]">
            Accesso a immobili, affitti, vendite e permessi selettivi sulla
            pubblicazione.
          </p>
        </div>

        <div className="theme-panel rounded-[26px] border p-5">
          <h2 className="text-lg font-semibold text-[var(--site-text)]">
            Editor
          </h2>
          <p className="mt-2 text-sm leading-7 text-[var(--site-text-muted)]">
            Accesso a news e contenuti editoriali, con menu separato rispetto agli
            owner.
          </p>
        </div>
      </section>

      <section className="theme-panel rounded-[26px] border p-5">
        <h2 className="text-lg font-semibold text-[var(--site-text)]">
          Prossimo step
        </h2>
        <p className="mt-2 text-sm leading-7 text-[var(--site-text-muted)]">
          Nel passo successivo costruiamo la tabella utenti con creazione,
          modifica ruolo, gestione permessi, Gmail autorizzata e stato account.
        </p>
      </section>
    </div>
  )
}