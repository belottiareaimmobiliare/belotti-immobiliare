'use client'

import { useEffect, useMemo, useState } from 'react'

type WorkspaceUser = {
  id: string
  auth_user_id?: string | null
  email?: string | null
  display_name?: string | null
  role: string
  can_see_all_properties: boolean
  is_active: boolean
  notes?: string | null
}

type WorkspacePermission = {
  id: string
  workspace_user_id: string
  property_id: string
  access_level: string
  can_view: boolean
  can_upload: boolean
  can_manage: boolean
  can_sync_public_gallery: boolean
  can_delete: boolean
}

type WorkspaceFolder = {
  id: string
  name: string
  propertyRef?: string
  address?: string
  visualState?: string
  visualReason?: string
}

const roles = [
  { id: 'admin', label: 'Admin' },
  { id: 'owner', label: 'Proprietario / titolare' },
  { id: 'secretariat', label: 'Segreteria' },
  { id: 'agent', label: 'Agente' },
  { id: 'photographer', label: 'Fotografo' },
  { id: 'collaborator', label: 'Collaboratore' },
  { id: 'client', label: 'Cliente' },
]

const accessLevels = [
  { id: 'view', label: 'Solo vista', description: 'Vede cartella e file.' },
  { id: 'upload', label: 'Carica file', description: 'Vede e carica foto/video/documenti.' },
  { id: 'manage', label: 'Gestisce cartella', description: 'Crea cartelle, sposta file, sincronizza.' },
  { id: 'full', label: 'Completo', description: 'Gestione piena inclusa cancellazione.' },
]

function defaultUserForm() {
  return {
    id: '',
    email: '',
    displayName: '',
    authUserId: '',
    role: 'agent',
    canSeeAllProperties: false,
    isActive: true,
    notes: '',
  }
}

function accessLabel(accessLevel: string) {
  return accessLevels.find((level) => level.id === accessLevel)?.label ?? accessLevel
}

export default function AIOSWorkspaceAccessManager() {
  const [users, setUsers] = useState<WorkspaceUser[]>([])
  const [permissions, setPermissions] = useState<WorkspacePermission[]>([])
  const [folders, setFolders] = useState<WorkspaceFolder[]>([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedPropertyId, setSelectedPropertyId] = useState('')
  const [selectedAccessLevel, setSelectedAccessLevel] = useState('upload')
  const [form, setForm] = useState(defaultUserForm)
  const [loading, setLoading] = useState(true)
  const [savingUser, setSavingUser] = useState(false)
  const [savingPermission, setSavingPermission] = useState(false)
  const [notice, setNotice] = useState('')

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) ?? null,
    [users, selectedUserId],
  )

  const selectedUserPermissions = useMemo(
    () => permissions.filter((permission) => permission.workspace_user_id === selectedUserId),
    [permissions, selectedUserId],
  )

  const selectedUserPermissionPropertyIds = useMemo(
    () => new Set(selectedUserPermissions.map((permission) => permission.property_id)),
    [selectedUserPermissions],
  )

  const availableFolders = useMemo(
    () => folders.filter((folder) => !selectedUserPermissionPropertyIds.has(folder.id)),
    [folders, selectedUserPermissionPropertyIds],
  )

  async function loadAll() {
    setLoading(true)
    setNotice('')

    try {
      const [usersResponse, foldersResponse] = await Promise.all([
        fetch('/api/admin/ai-os/workspace/users', { cache: 'no-store' }),
        fetch('/api/admin/ai-os/workspace/immobili', { cache: 'no-store' }),
      ])

      const usersPayload = await usersResponse.json().catch(() => null)
      const foldersPayload = await foldersResponse.json().catch(() => null)

      if (!usersResponse.ok) {
        throw new Error(usersPayload?.error || 'Errore caricamento utenti')
      }

      if (!foldersResponse.ok) {
        throw new Error(foldersPayload?.error || 'Errore caricamento immobili')
      }

      const nextUsers = Array.isArray(usersPayload?.users) ? usersPayload.users : []
      const nextPermissions = Array.isArray(usersPayload?.permissions) ? usersPayload.permissions : []
      const nextFolders = Array.isArray(foldersPayload?.folders) ? foldersPayload.folders : []

      setUsers(nextUsers)
      setPermissions(nextPermissions)
      setFolders(nextFolders)

      if (!selectedUserId && nextUsers[0]?.id) {
        setSelectedUserId(nextUsers[0].id)
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Errore caricamento accessi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function editUser(user: WorkspaceUser) {
    setForm({
      id: user.id,
      email: user.email ?? '',
      displayName: user.display_name ?? '',
      authUserId: user.auth_user_id ?? '',
      role: user.role ?? 'agent',
      canSeeAllProperties: Boolean(user.can_see_all_properties),
      isActive: Boolean(user.is_active),
      notes: user.notes ?? '',
    })
    setSelectedUserId(user.id)
    setNotice(`Modifica utente: ${user.display_name || user.email || user.id}`)
  }

  function newUser() {
    setForm(defaultUserForm())
    setNotice('Nuovo utente workspace.')
  }

  async function saveUser() {
    setSavingUser(true)
    setNotice('Salvataggio utente workspace...')

    try {
      const response = await fetch('/api/admin/ai-os/workspace/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.error || 'Errore salvataggio utente')
      }

      setNotice('Utente workspace salvato.')
      setForm(defaultUserForm())
      await loadAll()

      if (payload?.user?.id) {
        setSelectedUserId(payload.user.id)
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Errore salvataggio utente')
    } finally {
      setSavingUser(false)
    }
  }

  async function assignPermission() {
    if (!selectedUserId || !selectedPropertyId) {
      setNotice('Seleziona utente e immobile.')
      return
    }

    setSavingPermission(true)
    setNotice('Assegno permesso workspace...')

    try {
      const response = await fetch('/api/admin/ai-os/workspace/permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspaceUserId: selectedUserId,
          propertyId: selectedPropertyId,
          accessLevel: selectedAccessLevel,
        }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.error || 'Errore assegnazione permesso')
      }

      setSelectedPropertyId('')
      setNotice('Permesso assegnato.')
      await loadAll()
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Errore assegnazione permesso')
    } finally {
      setSavingPermission(false)
    }
  }

  async function removePermission(permission: WorkspacePermission) {
    setSavingPermission(true)
    setNotice('Rimuovo accesso immobile...')

    try {
      const response = await fetch('/api/admin/ai-os/workspace/permissions', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspaceUserId: permission.workspace_user_id,
          propertyId: permission.property_id,
        }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.error || 'Errore rimozione permesso')
      }

      setNotice('Accesso rimosso.')
      await loadAll()
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Errore rimozione permesso')
    } finally {
      setSavingPermission(false)
    }
  }

  function folderById(propertyId: string) {
    return folders.find((folder) => folder.id === propertyId) ?? null
  }

  return (
    <div className="min-h-screen bg-[#111827] px-4 py-6 text-[#E5E7EB] md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 rounded-[28px] border border-[#8FBCBB]/20 bg-[#1F2937]/82 p-5 shadow-2xl shadow-black/30 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#8FBCBB]/75">
              AI-OS / Drive Workspace
            </p>
            <h1 className="mt-2 text-2xl font-bold text-white md:text-3xl">
              Accessi cartelle Immobili
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#D1D5DB]/68">
              Gestisci chi vede le cartelle Drive dentro AI-OS. Admin, proprietario e segreteria possono vedere tutto;
              agenti, fotografi e collaboratori vedono solo gli immobili assegnati.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => window.location.href = '/admin/ai-os'}
              className="rounded-full border border-[#8FBCBB]/30 bg-[#8FBCBB]/10 px-4 py-2 text-sm font-bold text-[#8FBCBB] transition hover:bg-[#8FBCBB]/18"
            >
              Torna ad AI-OS
            </button>

            <button
              type="button"
              onClick={() => void loadAll()}
              className="rounded-full border border-[#A3BE8C]/40 bg-[#A3BE8C]/12 px-4 py-2 text-sm font-bold text-[#A3BE8C] transition hover:bg-[#A3BE8C]/20"
            >
              Aggiorna
            </button>
          </div>
        </div>

        {notice ? (
          <div className="mb-5 rounded-2xl border border-[#8FBCBB]/20 bg-[#0B1220]/90 px-4 py-3 text-sm font-semibold text-[#D8DEE9]">
            {notice}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-[28px] border border-[#8FBCBB]/15 bg-[#1F2937]/70 p-8 text-sm font-semibold text-[#D1D5DB]/70">
            Caricamento gestione accessi...
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
            <section className="rounded-[28px] border border-[#8FBCBB]/18 bg-[#1F2937]/82 p-5 shadow-xl shadow-black/20">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8FBCBB]/65">
                    Utenti
                  </p>
                  <h2 className="text-xl font-bold text-white">Workspace</h2>
                </div>

                <button
                  type="button"
                  onClick={newUser}
                  className="rounded-full border border-[#A3BE8C]/45 bg-[#A3BE8C]/12 px-3 py-2 text-xs font-bold text-[#A3BE8C] transition hover:bg-[#A3BE8C]/20"
                >
                  + Nuovo
                </button>
              </div>

              <div className="mb-5 space-y-2">
                {users.length > 0 ? (
                  users.map((user) => {
                    const active = selectedUserId === user.id

                    return (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => {
                          setSelectedUserId(user.id)
                          editUser(user)
                        }}
                        className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                          active
                            ? 'border-[#A3BE8C]/65 bg-[#A3BE8C]/14 text-white'
                            : 'border-[#374151] bg-[#111827]/64 text-[#D1D5DB] hover:border-[#8FBCBB]/35 hover:bg-[#111827]/86'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold">
                              {user.display_name || user.email || user.id}
                            </p>
                            <p className="mt-1 truncate text-xs text-[#9CA3AF]">
                              {user.email || 'Email non indicata'}
                            </p>
                          </div>

                          <span className="shrink-0 rounded-full border border-[#8FBCBB]/25 bg-[#8FBCBB]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#8FBCBB]">
                            {user.role}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-[0.12em]">
                          {user.is_active ? (
                            <span className="rounded-full bg-[#A3BE8C]/13 px-2 py-1 text-[#A3BE8C]">
                              Attivo
                            </span>
                          ) : (
                            <span className="rounded-full bg-[#BF616A]/13 px-2 py-1 text-[#FFCCD2]">
                              Disattivo
                            </span>
                          )}

                          {user.can_see_all_properties ? (
                            <span className="rounded-full bg-[#EBCB8B]/13 px-2 py-1 text-[#EBCB8B]">
                              Vede tutto
                            </span>
                          ) : (
                            <span className="rounded-full bg-[#5E81AC]/13 px-2 py-1 text-[#AECBFA]">
                              Accesso limitato
                            </span>
                          )}
                        </div>
                      </button>
                    )
                  })
                ) : (
                  <div className="rounded-2xl border border-[#374151] bg-[#111827]/64 p-4 text-sm text-[#D1D5DB]/65">
                    Nessun utente workspace configurato.
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-[#374151] bg-[#0B1220]/72 p-4">
                <p className="mb-3 text-sm font-bold text-white">
                  {form.id ? 'Modifica utente' : 'Nuovo utente'}
                </p>

                <div className="space-y-3">
                  <input
                    value={form.email}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                    className="w-full rounded-2xl border border-[#374151] bg-[#111827] px-4 py-3 text-sm font-semibold text-white outline-none transition placeholder:text-[#6B7280] focus:border-[#8FBCBB]/60"
                    placeholder="email utente"
                  />

                  <input
                    value={form.displayName}
                    onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))}
                    className="w-full rounded-2xl border border-[#374151] bg-[#111827] px-4 py-3 text-sm font-semibold text-white outline-none transition placeholder:text-[#6B7280] focus:border-[#8FBCBB]/60"
                    placeholder="nome visualizzato"
                  />

                  <select
                    value={form.role}
                    onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
                    className="w-full rounded-2xl border border-[#374151] bg-[#111827] px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-[#8FBCBB]/60"
                  >
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.label}
                      </option>
                    ))}
                  </select>

                  <label className="flex items-center gap-3 rounded-2xl border border-[#374151] bg-[#111827]/72 px-4 py-3 text-sm font-semibold text-[#D1D5DB]">
                    <input
                      type="checkbox"
                      checked={form.canSeeAllProperties}
                      onChange={(event) => setForm((current) => ({ ...current, canSeeAllProperties: event.target.checked }))}
                    />
                    Vede tutte le cartelle immobili
                  </label>

                  <label className="flex items-center gap-3 rounded-2xl border border-[#374151] bg-[#111827]/72 px-4 py-3 text-sm font-semibold text-[#D1D5DB]">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
                    />
                    Utente attivo
                  </label>

                  <textarea
                    value={form.notes}
                    onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                    className="min-h-24 w-full rounded-2xl border border-[#374151] bg-[#111827] px-4 py-3 text-sm font-semibold text-white outline-none transition placeholder:text-[#6B7280] focus:border-[#8FBCBB]/60"
                    placeholder="note interne"
                  />

                  <button
                    type="button"
                    disabled={savingUser}
                    onClick={saveUser}
                    className="w-full rounded-2xl border border-[#A3BE8C]/55 bg-[#A3BE8C] px-4 py-3 text-sm font-black text-[#101820] transition hover:bg-[#111827] hover:text-[#A3BE8C] disabled:cursor-wait disabled:opacity-60"
                  >
                    {savingUser ? 'Salvo...' : 'Salva utente workspace'}
                  </button>
                </div>
              </div>
            </section>

            <section className="rounded-[28px] border border-[#8FBCBB]/18 bg-[#1F2937]/82 p-5 shadow-xl shadow-black/20">
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8FBCBB]/65">
                  Permessi immobili
                </p>
                <h2 className="text-xl font-bold text-white">
                  {selectedUser
                    ? selectedUser.display_name || selectedUser.email || 'Utente selezionato'
                    : 'Seleziona un utente'}
                </h2>
              </div>

              {!selectedUser ? (
                <div className="rounded-3xl border border-[#374151] bg-[#111827]/64 p-6 text-sm text-[#D1D5DB]/65">
                  Seleziona un utente dalla colonna sinistra.
                </div>
              ) : selectedUser.can_see_all_properties ? (
                <div className="rounded-3xl border border-[#EBCB8B]/25 bg-[#EBCB8B]/10 p-6">
                  <p className="text-lg font-bold text-[#EBCB8B]">Accesso totale</p>
                  <p className="mt-2 text-sm leading-6 text-[#E5E7EB]/72">
                    Questo utente vede tutte le cartelle immobili. Non serve assegnare immobili singoli.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-5 rounded-3xl border border-[#374151] bg-[#0B1220]/72 p-4">
                    <p className="mb-3 text-sm font-bold text-white">Assegna nuovo immobile</p>

                    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_140px]">
                      <select
                        value={selectedPropertyId}
                        onChange={(event) => setSelectedPropertyId(event.target.value)}
                        className="rounded-2xl border border-[#374151] bg-[#111827] px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-[#8FBCBB]/60"
                      >
                        <option value="">Seleziona immobile...</option>
                        {availableFolders.map((folder) => (
                          <option key={folder.id} value={folder.id}>
                            {folder.propertyRef ? `${folder.propertyRef} - ` : ''}{folder.name}
                          </option>
                        ))}
                      </select>

                      <select
                        value={selectedAccessLevel}
                        onChange={(event) => setSelectedAccessLevel(event.target.value)}
                        className="rounded-2xl border border-[#374151] bg-[#111827] px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-[#8FBCBB]/60"
                      >
                        {accessLevels.map((level) => (
                          <option key={level.id} value={level.id}>
                            {level.label}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        disabled={savingPermission}
                        onClick={assignPermission}
                        className="rounded-2xl border border-[#A3BE8C]/55 bg-[#A3BE8C] px-4 py-3 text-sm font-black text-[#101820] transition hover:bg-[#111827] hover:text-[#A3BE8C] disabled:cursor-wait disabled:opacity-60"
                      >
                        Assegna
                      </button>
                    </div>

                    <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                      {accessLevels.map((level) => (
                        <div key={level.id} className="rounded-2xl border border-[#374151] bg-[#111827]/54 p-3">
                          <p className="text-xs font-bold text-white">{level.label}</p>
                          <p className="mt-1 text-[11px] leading-4 text-[#9CA3AF]">{level.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {selectedUserPermissions.length > 0 ? (
                      selectedUserPermissions.map((permission) => {
                        const folder = folderById(permission.property_id)

                        return (
                          <div
                            key={permission.id}
                            className="rounded-3xl border border-[#374151] bg-[#111827]/72 p-4"
                          >
                            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                              <div className="min-w-0">
                                <p className="truncate text-base font-bold text-white">
                                  {folder?.name || permission.property_id}
                                </p>
                                <p className="mt-1 text-xs text-[#9CA3AF]">
                                  {folder?.propertyRef ? `Rif. ${folder.propertyRef} · ` : ''}
                                  {folder?.address || 'Indirizzo non disponibile'}
                                </p>

                                <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-[0.12em]">
                                  <span className="rounded-full bg-[#8FBCBB]/12 px-2.5 py-1 text-[#8FBCBB]">
                                    {accessLabel(permission.access_level)}
                                  </span>

                                  {permission.can_upload ? (
                                    <span className="rounded-full bg-[#A3BE8C]/12 px-2.5 py-1 text-[#A3BE8C]">
                                      Upload
                                    </span>
                                  ) : null}

                                  {permission.can_manage ? (
                                    <span className="rounded-full bg-[#EBCB8B]/12 px-2.5 py-1 text-[#EBCB8B]">
                                      Manage
                                    </span>
                                  ) : null}

                                  {permission.can_delete ? (
                                    <span className="rounded-full bg-[#BF616A]/12 px-2.5 py-1 text-[#FFCCD2]">
                                      Delete
                                    </span>
                                  ) : null}
                                </div>
                              </div>

                              <button
                                type="button"
                                disabled={savingPermission}
                                onClick={() => void removePermission(permission)}
                                className="rounded-full border border-[#BF616A]/35 bg-[#BF616A]/10 px-4 py-2 text-xs font-bold text-[#FFCCD2] transition hover:bg-[#BF616A]/20 disabled:cursor-wait disabled:opacity-60"
                              >
                                Rimuovi accesso
                              </button>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div className="rounded-3xl border border-[#374151] bg-[#111827]/64 p-6 text-sm text-[#D1D5DB]/65">
                        Nessun immobile assegnato. Questo utente non vedrà cartelle immobili finché non gli assegni almeno un accesso.
                      </div>
                    )}
                  </div>
                </>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
