import { requireOwner } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export default async function AdminLogsPage() {
  await requireOwner()

  return (
    <div className="space-y-6">
      <section className="theme-panel rounded-[30px] border p-6">
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--site-text-faint)]">
          Audit
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-[var(--site-text)]">
          Logs attività
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--site-text-muted)]">
          Questa sezione mostrerà chi ha creato, modificato, pubblicato o
          disattivato contenuti, immobili e utenti, con storico leggibile per
          singolo operatore.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="theme-panel rounded-[26px] border p-5">
          <h2 className="text-lg font-semibold text-[var(--site-text)]">
            Log immobili
          </h2>
          <p className="mt-2 text-sm leading-7 text-[var(--site-text-muted)]">
            Creazione, modifica, pubblicazione e assegnazione immobili.
          </p>
        </div>

        <div className="theme-panel rounded-[26px] border p-5">
          <h2 className="text-lg font-semibold text-[var(--site-text)]">
            Log contenuti sito
          </h2>
          <p className="mt-2 text-sm leading-7 text-[var(--site-text-muted)]">
            Modifiche a Home, Chi siamo, news e configurazioni editoriali.
          </p>
        </div>

        <div className="theme-panel rounded-[26px] border p-5">
          <h2 className="text-lg font-semibold text-[var(--site-text)]">
            Log accessi
          </h2>
          <p className="mt-2 text-sm leading-7 text-[var(--site-text-muted)]">
            Login riusciti, tentativi falliti e future approvazioni QR/Google.
          </p>
        </div>
      </section>

      <section className="theme-panel rounded-[26px] border p-5">
        <h2 className="text-lg font-semibold text-[var(--site-text)]">
          Prossimo step
        </h2>
        <p className="mt-2 text-sm leading-7 text-[var(--site-text-muted)]">
          Nel passo successivo colleghiamo davvero la tabella `activity_log`
          all’operatività del gestionale e iniziamo a popolare i log in modo
          automatico.
        </p>
      </section>
    </div>
  )
}