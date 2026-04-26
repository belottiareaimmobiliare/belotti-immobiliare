import Link from 'next/link'
import { requireAdminProfile } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export default async function AdminExportsPage() {
  const profile = await requireAdminProfile()

  if (profile.role !== 'owner' && !profile.can_manage_properties) {
    return (
      <div className="theme-panel rounded-[30px] border p-6">
        <h1 className="text-2xl font-semibold">Accesso non autorizzato</h1>
      </div>
    )
  }

  return (
    <section className="mx-auto w-full max-w-5xl text-[var(--site-text)]">
      <p className="theme-admin-faint text-sm uppercase tracking-[0.2em]">
        Export portali
      </p>

      <h1 className="mt-2 text-3xl font-semibold">
        Esportazione immobili
      </h1>

      <p className="theme-admin-muted mt-3">
        Da qui puoi verificare il pacchetto dati degli immobili pubblicati, pronto per essere adattato ai portali partner.
      </p>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        <ExportCard
          title="Export base JSON"
          text="Formato interno unico con immobili, immagini, planimetrie e campi strutturati."
          href="/api/admin/exports/properties"
          status="Attivo"
        />

        <ExportCard
          title="Immobiliare.it"
          text="Cartella predisposta. Mapping XML/API da completare sulle specifiche finali."
          href="/exports/immobiliare-it"
          status="Da completare"
        />

        <ExportCard
          title="Idealista / Casa.it"
          text="Cartelle predisposte. Formato da confermare con i portali o con Belotti."
          href="/api/admin/exports/properties"
          status="In attesa metodo"
        />
      </div>
    </section>
  )
}

function ExportCard({
  title,
  text,
  href,
  status,
}: {
  title: string
  text: string
  href: string
  status: string
}) {
  return (
    <div className="theme-admin-card rounded-3xl p-5">
      <span className="theme-admin-chip rounded-full px-3 py-1 text-xs">
        {status}
      </span>

      <h2 className="mt-4 text-xl font-semibold">{title}</h2>

      <p className="theme-admin-muted mt-3 text-sm leading-6">
        {text}
      </p>

      <Link
        href={href}
        target="_blank"
        className="theme-admin-button-primary mt-5 inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold"
      >
        Apri
      </Link>
    </div>
  )
}
