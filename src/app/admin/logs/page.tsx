import Link from 'next/link'
import { requireOwner } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export default async function AdminLogsPage() {
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
            Audit attività proprietario
          </div>
        </div>
      </section>

      <section className="theme-panel rounded-[34px] border p-6 md:p-8">
        <p className="text-sm uppercase tracking-[0.24em] text-[var(--site-text-faint)]">
          Audit
        </p>

        <h1 className="mt-3 text-3xl font-semibold leading-tight text-[var(--site-text)] md:text-4xl">
          Logs attività
        </h1>

        <p className="mt-4 max-w-4xl text-sm leading-8 text-[var(--site-text-muted)] md:text-base">
          Questa sezione mostrerà chi ha creato, modificato, pubblicato o
          disattivato contenuti, immobili e utenti, con storico leggibile per
          singolo operatore e tracciamento operativo utile al controllo qualità.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="theme-panel rounded-[28px] border p-6">
          <h2 className="text-2xl font-semibold text-[var(--site-text)]">
            Log immobili
          </h2>
          <p className="mt-4 text-sm leading-8 text-[var(--site-text-muted)]">
            Creazione, modifica, pubblicazione, assegnazione, cambi stato e
            operatore responsabile per ciascun immobile.
          </p>
        </div>

        <div className="theme-panel rounded-[28px] border p-6">
          <h2 className="text-2xl font-semibold text-[var(--site-text)]">
            Log contenuti sito
          </h2>
          <p className="mt-4 text-sm leading-8 text-[var(--site-text-muted)]">
            Modifiche a Home, Chi siamo, news, autori e configurazioni editoriali
            con storico chiaro delle variazioni effettuate.
          </p>
        </div>

        <div className="theme-panel rounded-[28px] border p-6">
          <h2 className="text-2xl font-semibold text-[var(--site-text)]">
            Log accessi
          </h2>
          <p className="mt-4 text-sm leading-8 text-[var(--site-text-muted)]">
            Login riusciti, tentativi falliti, attivazioni future via QR/Google e
            controllo delle operazioni sensibili per utente.
          </p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="theme-panel rounded-[30px] border p-6">
          <h2 className="text-xl font-semibold text-[var(--site-text)]">
            Cosa vedremo in questa pagina
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] p-4">
              <p className="text-sm font-semibold text-[var(--site-text)]">
                Chi ha inserito cosa
              </p>
              <p className="mt-2 text-sm leading-7 text-[var(--site-text-muted)]">
                Immobili, news, modifiche ai contenuti e gestione utenti.
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] p-4">
              <p className="text-sm font-semibold text-[var(--site-text)]">
                Quando è successo
              </p>
              <p className="mt-2 text-sm leading-7 text-[var(--site-text-muted)]">
                Storico ordinato per data, ora e tipologia di azione.
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] p-4">
              <p className="text-sm font-semibold text-[var(--site-text)]">
                Prima / dopo modifica
              </p>
              <p className="mt-2 text-sm leading-7 text-[var(--site-text-muted)]">
                Dove utile mostreremo i campi cambiati per capire l’impatto reale.
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] p-4">
              <p className="text-sm font-semibold text-[var(--site-text)]">
                Controllo KPI
              </p>
              <p className="mt-2 text-sm leading-7 text-[var(--site-text-muted)]">
                Base utile per monitorare operatività, pubblicazioni e qualità del
                lavoro degli agenti.
              </p>
            </div>
          </div>
        </div>

        <div className="theme-panel rounded-[30px] border p-6">
          <h2 className="text-xl font-semibold text-[var(--site-text)]">
            Prossimo step operativo
          </h2>
          <p className="mt-4 text-sm leading-8 text-[var(--site-text-muted)]">
            Nel passo successivo colleghiamo davvero la tabella `activity_log`
            all’operatività del gestionale e iniziamo a popolare i log in modo
            automatico.
          </p>

          <div className="mt-6 rounded-2xl border border-dashed border-[var(--site-border)] bg-[var(--site-surface)] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--site-text-faint)]">
              Stato pagina
            </p>
            <p className="mt-2 text-sm font-semibold text-[var(--site-text)]">
              Placeholder avanzato pronto per storico operativo reale
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}