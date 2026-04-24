'use client'

import { useEffect, useMemo, useState } from 'react'

type UserRole = 'owner' | 'agent' | 'editor'

type ManagedUser = {
  id: string
  full_name: string
  username: string
  login_email: string
  authorized_google_email: string | null
  role: UserRole
  is_active: boolean
  can_manage_properties: boolean
  can_manage_news: boolean
  can_manage_site_content: boolean
  can_manage_users: boolean
  can_view_logs: boolean
  can_view_kpis: boolean
  can_publish_properties: boolean
  created_at?: string
  updated_at?: string
}

type CreateFormState = {
  full_name: string
  username: string
  login_email: string
  password: string
  authorized_google_email: string
  role: UserRole
  is_active: boolean
  can_manage_properties: boolean
  can_manage_news: boolean
  can_manage_site_content: boolean
  can_manage_users: boolean
  can_view_logs: boolean
  can_view_kpis: boolean
  can_publish_properties: boolean
}

const ownerPreset = {
  can_manage_properties: true,
  can_manage_news: true,
  can_manage_site_content: true,
  can_manage_users: true,
  can_view_logs: true,
  can_view_kpis: true,
  can_publish_properties: true,
}

const agentPreset = {
  can_manage_properties: true,
  can_manage_news: false,
  can_manage_site_content: false,
  can_manage_users: false,
  can_view_logs: false,
  can_view_kpis: false,
  can_publish_properties: false,
}

const editorPreset = {
  can_manage_properties: false,
  can_manage_news: true,
  can_manage_site_content: false,
  can_manage_users: false,
  can_view_logs: false,
  can_view_kpis: false,
  can_publish_properties: false,
}

function getPreset(role: UserRole) {
  if (role === 'owner') return ownerPreset
  if (role === 'agent') return agentPreset
  return editorPreset
}

function buildInitialCreateState(): CreateFormState {
  return {
    full_name: '',
    username: '',
    login_email: '',
    password: '',
    authorized_google_email: '',
    role: 'agent',
    is_active: true,
    ...agentPreset,
  }
}

function sortUsers(users: ManagedUser[]) {
  const roleOrder: Record<UserRole, number> = {
    owner: 0,
    agent: 1,
    editor: 2,
  }

  return [...users].sort((a, b) => {
    const roleDiff = roleOrder[a.role] - roleOrder[b.role]
    if (roleDiff !== 0) return roleDiff
    return a.full_name.localeCompare(b.full_name, 'it')
  })
}

function RoleBadge({ role }: { role: UserRole }) {
  const label =
    role === 'owner' ? 'Proprietario' : role === 'editor' ? 'Editor' : 'Agente'

  return (
    <span className="inline-flex rounded-full border border-[var(--site-border)] bg-[var(--site-surface)] px-3 py-1 text-xs font-semibold text-[var(--site-text)]">
      {label}
    </span>
  )
}

function PermissionCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-3 text-sm text-[var(--site-text)]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{label}</span>
    </label>
  )
}

function CreateUserForm({
  onCreated,
}: {
  onCreated: (user: ManagedUser) => void
}) {
  const [form, setForm] = useState<CreateFormState>(buildInitialCreateState())
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  function patch<K extends keyof CreateFormState>(key: K, value: CreateFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function applyPreset(role: UserRole) {
    setForm((prev) => ({
      ...prev,
      role,
      ...getPreset(role),
    }))
  }

  async function submit() {
    setLoading(true)
    setMessage('')

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          authorized_google_email: form.authorized_google_email || null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || 'Errore creazione utente.')
        setLoading(false)
        return
      }

      onCreated(data.user as ManagedUser)
      setForm(buildInitialCreateState())
      setMessage('Utente creato correttamente.')
    } catch {
      setMessage('Errore creazione utente.')
    }

    setLoading(false)
  }

  return (
    <section className="theme-panel rounded-[30px] border p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--site-text-faint)]">
            Active Directory
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--site-text)]">
            Crea agente, editor o proprietario
          </h2>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => applyPreset('agent')}
            className="rounded-2xl border border-[var(--site-border)] px-3 py-2 text-sm text-[var(--site-text)]"
          >
            Preset agente
          </button>
          <button
            type="button"
            onClick={() => applyPreset('editor')}
            className="rounded-2xl border border-[var(--site-border)] px-3 py-2 text-sm text-[var(--site-text)]"
          >
            Preset editor
          </button>
          <button
            type="button"
            onClick={() => applyPreset('owner')}
            className="rounded-2xl border border-[var(--site-border)] px-3 py-2 text-sm text-[var(--site-text)]"
          >
            Preset owner
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <input
          value={form.full_name}
          onChange={(e) => patch('full_name', e.target.value)}
          placeholder="Nome e cognome"
          className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-3 text-sm text-[var(--site-text)]"
        />
        <input
          value={form.username}
          onChange={(e) => patch('username', e.target.value)}
          placeholder="Username interno"
          className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-3 text-sm text-[var(--site-text)]"
        />
        <input
          value={form.login_email}
          onChange={(e) => patch('login_email', e.target.value)}
          placeholder="Email login interna"
          className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-3 text-sm text-[var(--site-text)]"
        />
        <input
          value={form.password}
          onChange={(e) => patch('password', e.target.value)}
          placeholder="Password iniziale"
          className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-3 text-sm text-[var(--site-text)]"
        />
        <input
          value={form.authorized_google_email}
          onChange={(e) => patch('authorized_google_email', e.target.value)}
          placeholder="Gmail autorizzata (opzionale)"
          className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-3 text-sm text-[var(--site-text)] md:col-span-2"
        />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-[220px_1fr]">
        <div className="rounded-[24px] border border-[var(--site-border)] bg-[var(--site-surface)] p-4">
          <label className="block text-sm font-medium text-[var(--site-text)]">
            Ruolo
          </label>
          <select
            value={form.role}
            onChange={(e) => applyPreset(e.target.value as UserRole)}
            className="mt-3 w-full rounded-2xl border border-[var(--site-border)] bg-[var(--site-bg)] px-3 py-2 text-sm text-[var(--site-text)]"
          >
            <option value="agent">Agente</option>
            <option value="editor">Editor</option>
            <option value="owner">Proprietario</option>
          </select>

          <p className="mt-3 text-xs leading-6 text-[var(--site-text-muted)]">
            Se cambi ruolo da qui, vengono applicati subito i permessi base del
            preset. Poi puoi aggiustare a mano i singoli check prima del salvataggio.
          </p>

          <label className="mt-4 flex items-center gap-3 text-sm text-[var(--site-text)]">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => patch('is_active', e.target.checked)}
            />
            Account attivo
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <PermissionCheckbox
            label="Gestione immobili"
            checked={form.can_manage_properties}
            onChange={(value) => patch('can_manage_properties', value)}
          />
          <PermissionCheckbox
            label="Gestione news"
            checked={form.can_manage_news}
            onChange={(value) => patch('can_manage_news', value)}
          />
          <PermissionCheckbox
            label="Modifica contenuti sito"
            checked={form.can_manage_site_content}
            onChange={(value) => patch('can_manage_site_content', value)}
          />
          <PermissionCheckbox
            label="Gestione utenti"
            checked={form.can_manage_users}
            onChange={(value) => patch('can_manage_users', value)}
          />
          <PermissionCheckbox
            label="Visualizza logs"
            checked={form.can_view_logs}
            onChange={(value) => patch('can_view_logs', value)}
          />
          <PermissionCheckbox
            label="Visualizza KPI"
            checked={form.can_view_kpis}
            onChange={(value) => patch('can_view_kpis', value)}
          />
          <PermissionCheckbox
            label="Può pubblicare immobili"
            checked={form.can_publish_properties}
            onChange={(value) => patch('can_publish_properties', value)}
          />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={loading}
          className="theme-button-primary rounded-2xl px-5 py-3 text-sm font-semibold disabled:opacity-50"
        >
          {loading ? 'Creazione...' : 'Crea utente'}
        </button>

        <button
          type="button"
          onClick={() => {
            setForm(buildInitialCreateState())
            setMessage('')
          }}
          disabled={loading}
          className="rounded-2xl border border-[var(--site-border)] px-5 py-3 text-sm font-semibold text-[var(--site-text)]"
        >
          Reset
        </button>

        {message ? (
          <p className="text-sm text-[var(--site-text-muted)]">{message}</p>
        ) : null}
      </div>
    </section>
  )
}

function ManagedUserAccordionItem({
  user,
  isOpen,
  onToggle,
  onUpdated,
}: {
  user: ManagedUser
  isOpen: boolean
  onToggle: () => void
  onUpdated: (user: ManagedUser) => void
}) {
  const [form, setForm] = useState({
    full_name: user.full_name,
    username: user.username,
    login_email: user.login_email,
    authorized_google_email: user.authorized_google_email ?? '',
    role: user.role,
    is_active: user.is_active,
    new_password: '',
    can_manage_properties: user.can_manage_properties,
    can_manage_news: user.can_manage_news,
    can_manage_site_content: user.can_manage_site_content,
    can_manage_users: user.can_manage_users,
    can_view_logs: user.can_view_logs,
    can_view_kpis: user.can_view_kpis,
    can_publish_properties: user.can_publish_properties,
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  function patch<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function applyPreset(role: UserRole) {
    setForm((prev) => ({
      ...prev,
      role,
      ...getPreset(role),
    }))
  }

  async function save() {
    setLoading(true)
    setMessage('')

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          authorized_google_email: form.authorized_google_email || null,
          new_password: form.new_password || null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || 'Errore salvataggio utente.')
        setLoading(false)
        return
      }

      onUpdated(data.user as ManagedUser)
      setForm((prev) => ({
        ...prev,
        new_password: '',
      }))
      setMessage('Utente aggiornato.')
    } catch {
      setMessage('Errore salvataggio utente.')
    }

    setLoading(false)
  }

  return (
    <article className="rounded-[28px] border border-[var(--site-border)] bg-[var(--site-surface)]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full flex-col gap-4 px-5 py-5 text-left transition hover:bg-[var(--site-surface-2)] md:flex-row md:items-center md:justify-between"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <RoleBadge role={form.role} />
            {!form.is_active ? (
              <span className="inline-flex rounded-full border border-[var(--site-border)] px-3 py-1 text-xs font-semibold text-[var(--site-text-faint)]">
                Disattivo
              </span>
            ) : null}
          </div>

          <h3 className="mt-3 text-xl font-semibold text-[var(--site-text)]">
            {form.full_name}
          </h3>

          <div className="mt-2 flex flex-wrap gap-3 text-sm text-[var(--site-text-muted)]">
            <span>@{form.username}</span>
            <span>{form.login_email}</span>
          </div>
        </div>

        <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--site-border)] text-[var(--site-text)]">
          {isOpen ? '−' : '+'}
        </div>
      </button>

      {isOpen ? (
        <div className="border-t border-[var(--site-border)] px-5 py-5">
          <div className="mb-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => applyPreset('agent')}
              className="rounded-2xl border border-[var(--site-border)] px-3 py-2 text-sm text-[var(--site-text)]"
            >
              Preset agente
            </button>
            <button
              type="button"
              onClick={() => applyPreset('editor')}
              className="rounded-2xl border border-[var(--site-border)] px-3 py-2 text-sm text-[var(--site-text)]"
            >
              Preset editor
            </button>
            <button
              type="button"
              onClick={() => applyPreset('owner')}
              className="rounded-2xl border border-[var(--site-border)] px-3 py-2 text-sm text-[var(--site-text)]"
            >
              Preset owner
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <input
              value={form.full_name}
              onChange={(e) => patch('full_name', e.target.value)}
              placeholder="Nome e cognome"
              className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-bg)] px-4 py-3 text-sm text-[var(--site-text)]"
            />
            <input
              value={form.username}
              onChange={(e) => patch('username', e.target.value)}
              placeholder="Username"
              className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-bg)] px-4 py-3 text-sm text-[var(--site-text)]"
            />
            <input
              value={form.login_email}
              onChange={(e) => patch('login_email', e.target.value)}
              placeholder="Email login"
              className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-bg)] px-4 py-3 text-sm text-[var(--site-text)]"
            />
            <input
              value={form.authorized_google_email}
              onChange={(e) => patch('authorized_google_email', e.target.value)}
              placeholder="Gmail autorizzata"
              className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-bg)] px-4 py-3 text-sm text-[var(--site-text)]"
            />

            <div className="md:col-span-2">
              <input
                value={form.new_password}
                onChange={(e) => patch('new_password', e.target.value)}
                placeholder="Resetta la password (inserisci la nuova qui e salva)"
                className="w-full rounded-2xl border border-[var(--site-border)] bg-[var(--site-bg)] px-4 py-3 text-sm text-[var(--site-text)]"
              />
              <p className="mt-2 text-xs text-[var(--site-text-muted)]">
                Se lasci vuoto questo campo, la password attuale non viene modificata.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-[220px_1fr]">
            <div className="rounded-[24px] border border-[var(--site-border)] bg-[var(--site-bg)] p-4">
              <label className="block text-sm font-medium text-[var(--site-text)]">
                Ruolo
              </label>
              <select
                value={form.role}
                onChange={(e) => applyPreset(e.target.value as UserRole)}
                className="mt-3 w-full rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] px-3 py-2 text-sm text-[var(--site-text)]"
              >
                <option value="agent">Agente</option>
                <option value="editor">Editor</option>
                <option value="owner">Proprietario</option>
              </select>

              <p className="mt-3 text-xs leading-6 text-[var(--site-text-muted)]">
                Se cambi ruolo da qui, vengono ricaricati i permessi base del preset.
                Poi puoi personalizzarli come vuoi e salvare.
              </p>

              <label className="mt-4 flex items-center gap-3 text-sm text-[var(--site-text)]">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => patch('is_active', e.target.checked)}
                />
                Account attivo
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <PermissionCheckbox
                label="Gestione immobili"
                checked={form.can_manage_properties}
                onChange={(value) => patch('can_manage_properties', value)}
              />
              <PermissionCheckbox
                label="Gestione news"
                checked={form.can_manage_news}
                onChange={(value) => patch('can_manage_news', value)}
              />
              <PermissionCheckbox
                label="Modifica contenuti sito"
                checked={form.can_manage_site_content}
                onChange={(value) => patch('can_manage_site_content', value)}
              />
              <PermissionCheckbox
                label="Gestione utenti"
                checked={form.can_manage_users}
                onChange={(value) => patch('can_manage_users', value)}
              />
              <PermissionCheckbox
                label="Visualizza logs"
                checked={form.can_view_logs}
                onChange={(value) => patch('can_view_logs', value)}
              />
              <PermissionCheckbox
                label="Visualizza KPI"
                checked={form.can_view_kpis}
                onChange={(value) => patch('can_view_kpis', value)}
              />
              <PermissionCheckbox
                label="Può pubblicare immobili"
                checked={form.can_publish_properties}
                onChange={(value) => patch('can_publish_properties', value)}
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={save}
              disabled={loading}
              className="theme-button-primary rounded-2xl px-5 py-3 text-sm font-semibold disabled:opacity-50"
            >
              {loading ? 'Salvataggio...' : 'Salva modifiche'}
            </button>

            {message ? (
              <p className="text-sm text-[var(--site-text-muted)]">{message}</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </article>
  )
}

export default function UserManagementPanel() {
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openUserId, setOpenUserId] = useState<string | null>(null)

  async function loadUsers() {
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/admin/users', {
        method: 'GET',
        cache: 'no-store',
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Errore caricamento utenti.')
        setLoading(false)
        return
      }

      setUsers(sortUsers((data.users as ManagedUser[]) ?? []))
    } catch {
      setError('Errore caricamento utenti.')
    }

    setLoading(false)
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const ownerCount = useMemo(
    () => users.filter((user) => user.role === 'owner' && user.is_active).length,
    [users]
  )

  const activeCount = useMemo(
    () => users.filter((user) => user.is_active).length,
    [users]
  )

  return (
    <div className="space-y-6">
      <section className="theme-panel rounded-[34px] border p-6 md:p-8">
        <p className="text-sm uppercase tracking-[0.24em] text-[var(--site-text-faint)]">
          Active Directory
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-[var(--site-text)] md:text-4xl">
          Agenti, editor e proprietari
        </h1>
        <p className="mt-4 max-w-4xl text-sm leading-8 text-[var(--site-text-muted)] md:text-base">
          Da qui puoi creare utenti veri, assegnare permessi, definire la Gmail
          autorizzata opzionale e gestire l’accesso interno con username e password.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--site-text-faint)]">
              Utenti totali
            </p>
            <p className="mt-2 text-2xl font-semibold text-[var(--site-text)]">
              {users.length}
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--site-text-faint)]">
              Account attivi
            </p>
            <p className="mt-2 text-2xl font-semibold text-[var(--site-text)]">
              {activeCount}
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--site-text-faint)]">
              Owner attivi
            </p>
            <p className="mt-2 text-2xl font-semibold text-[var(--site-text)]">
              {ownerCount} / 3
            </p>
          </div>
        </div>
      </section>

      <CreateUserForm
        onCreated={(createdUser) => {
          setUsers((prev) => sortUsers([...prev, createdUser]))
          setOpenUserId(createdUser.id)
        }}
      />

      <section className="theme-panel rounded-[30px] border p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-[var(--site-text)]">
              Lista utenti
            </h2>
            <p className="mt-2 text-sm text-[var(--site-text-muted)]">
              Visualizza la lista e apri solo l’utente che vuoi modificare.
            </p>
          </div>

          <button
            type="button"
            onClick={loadUsers}
            className="rounded-2xl border border-[var(--site-border)] px-4 py-2.5 text-sm font-semibold text-[var(--site-text)]"
          >
            Aggiorna lista
          </button>
        </div>

        {loading ? (
          <p className="mt-6 text-sm text-[var(--site-text-muted)]">
            Caricamento utenti...
          </p>
        ) : error ? (
          <p className="mt-6 text-sm text-red-500">{error}</p>
        ) : users.length === 0 ? (
          <p className="mt-6 text-sm text-[var(--site-text-muted)]">
            Nessun utente trovato.
          </p>
        ) : (
          <div className="mt-6 space-y-4">
            {users.map((user) => (
              <ManagedUserAccordionItem
                key={user.id}
                user={user}
                isOpen={openUserId === user.id}
                onToggle={() =>
                  setOpenUserId((prev) => (prev === user.id ? null : user.id))
                }
                onUpdated={(updatedUser) => {
                  setUsers((prev) =>
                    sortUsers(
                      prev.map((item) => (item.id === updatedUser.id ? updatedUser : item))
                    )
                  )
                }}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}