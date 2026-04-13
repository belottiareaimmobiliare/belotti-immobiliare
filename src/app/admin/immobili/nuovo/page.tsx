'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import italyLocations from '@/data/italyLocations.json'

type ProvinceItem = {
  name: string
  code: string
  region: string
  comuni: { name: string; code: string }[]
}

const provinces = (italyLocations.provinces || []) as ProvinceItem[]

function generateSlug(title: string) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

function normalizeOptionalField(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null
  if (trimmed === '-') return '-'
  return trimmed
}

type FeatureToggleProps = {
  label: string
  checked: boolean
  onClick: () => void
  fullWidth?: boolean
}

function FeatureToggle({
  label,
  checked,
  onClick,
  fullWidth = false,
}: FeatureToggleProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`theme-admin-input flex items-center justify-between gap-4 rounded-2xl px-4 py-3 text-left text-sm transition hover:opacity-95 ${
        fullWidth ? 'md:col-span-2' : ''
      }`}
    >
      <span className="text-[var(--site-text-soft)]">{label}</span>

      <span
        className={`relative inline-flex h-7 w-12 shrink-0 rounded-full border transition ${
          checked
            ? 'border-[var(--site-gold)] bg-[var(--site-gold)]'
            : 'border-[var(--site-border-strong)] bg-[var(--site-surface-2)]'
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full shadow transition ${
            checked ? 'left-6 bg-[#0b0f17]' : 'left-1 bg-white'
          }`}
        />
      </span>
    </button>
  )
}

export default function NewPropertyPage() {
  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [comuneSearch, setComuneSearch] = useState('')

  const [form, setForm] = useState({
    title: '',
    price: '',
    province: '',
    comune: '',
    frazione: '',
    address: '',
    rooms: '',
    bathrooms: '',
    surface: '',
    contract_type: 'vendita',
    property_type: 'appartamento',
    description: '',
    status: 'draft',
    has_garage: false,
    has_parking: false,
    has_garden: false,
    has_elevator: false,
    is_auction: false,
    energy_class: '',
    condo_fees: '',
    heating_type: '',
    furnished_status: '',
    deposit_amount: '',
    advance_amount: '',
    advance_deposit_amount: '',
  })

  const activeProvince = useMemo(
    () => provinces.find((province) => province.code === form.province) || null,
    [form.province]
  )

  const filteredComuni = useMemo(() => {
    if (!activeProvince) return []

    const search = comuneSearch.trim().toLowerCase()
    if (!search) return activeProvince.comuni

    return activeProvince.comuni.filter((comune) =>
      comune.name.toLowerCase().includes(search)
    )
  }, [activeProvince, comuneSearch])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target

    if (name === 'province') {
      setForm((prev) => ({
        ...prev,
        province: value,
        comune: '',
      }))
      setComuneSearch('')
      return
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const toggleBooleanField = (
    name: 'has_garage' | 'has_parking' | 'has_garden' | 'has_elevator' | 'is_auction'
  ) => {
    setForm((prev) => ({
      ...prev,
      [name]: !prev[name],
    }))
  }

  const handleComuneSelect = (comuneName: string) => {
    setForm((prev) => ({
      ...prev,
      comune: comuneName,
    }))
  }

  const geocodeProperty = async (propertyId: string) => {
    try {
      const response = await fetch('/api/geocode-property', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: form.address,
          comune: form.comune,
          province: form.province,
        }),
      })

      const data = await response.json()

      const { error } = await supabase
        .from('properties')
        .update({
          latitude: data.latitude,
          longitude: data.longitude,
          location_mode: data.locationMode,
          geocode_query: data.queryUsed || null,
          geocode_status: data.geocodeStatus || null,
        })
        .eq('id', propertyId)

      if (error) throw error
    } catch (error) {
      console.error('Errore geocodifica nuovo immobile:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const slug = generateSlug(form.title)

    const { data, error } = await supabase
      .from('properties')
      .insert({
        title: form.title,
        slug,
        price: form.price ? Number(form.price) : null,
        province: form.province || null,
        comune: form.comune || null,
        frazione: form.frazione || null,
        address: form.address || null,
        rooms: form.rooms ? Number(form.rooms) : null,
        bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
        surface: form.surface ? Number(form.surface) : null,
        contract_type: form.contract_type || null,
        property_type: form.property_type || null,
        description: form.description || null,
        status: form.status || 'draft',
        has_garage: form.has_garage,
        has_parking: form.has_parking,
        has_garden: form.has_garden,
        has_elevator: form.has_elevator,
        is_auction: form.is_auction,
        energy_class: form.energy_class || null,
        condo_fees: form.condo_fees || null,
        heating_type: form.heating_type || null,
        furnished_status: form.furnished_status || null,
        deposit_amount: normalizeOptionalField(form.deposit_amount),
        advance_amount: normalizeOptionalField(form.advance_amount),
        advance_deposit_amount: normalizeOptionalField(form.advance_deposit_amount),
      })
      .select('id')
      .single()

    if (error || !data) {
      setLoading(false)
      console.error(error)
      alert('Errore creazione immobile')
      return
    }

    await geocodeProperty(data.id)

    setLoading(false)
    router.push('/admin/immobili')
    router.refresh()
  }

  return (
    <section className="mx-auto w-full max-w-3xl px-4 text-[var(--site-text)]">
      <p className="theme-admin-faint text-sm uppercase tracking-[0.2em]">
        Nuovo immobile
      </p>

      <h2 className="mt-2 text-3xl font-semibold">Crea immobile</h2>

      <p className="theme-admin-muted mt-3">
        Inserisci i dati principali dell’immobile.
      </p>

      <form
        onSubmit={handleSubmit}
        className="theme-admin-card mt-8 rounded-3xl p-5 md:p-6"
      >
        <div className="grid gap-4">
          <input
            name="title"
            placeholder="Titolo"
            value={form.title}
            onChange={handleChange}
            className="theme-admin-input rounded-xl px-4 py-3"
            required
          />

          <input
            name="price"
            placeholder="Prezzo"
            type="number"
            value={form.price}
            onChange={handleChange}
            className="theme-admin-input rounded-xl px-4 py-3"
          />

          <div className="grid gap-4 md:grid-cols-3">
            <select
              name="contract_type"
              value={form.contract_type}
              onChange={handleChange}
              className="theme-admin-select rounded-xl px-4 py-3"
            >
              <option value="vendita">Vendita</option>
              <option value="affitto">Affitto</option>
            </select>

            <select
              name="property_type"
              value={form.property_type}
              onChange={handleChange}
              className="theme-admin-select rounded-xl px-4 py-3"
            >
              <option value="appartamento">Appartamento</option>
              <option value="attico">Attico</option>
              <option value="villa">Villa</option>
              <option value="trilocale">Trilocale</option>
              <option value="bilocale">Bilocale</option>
              <option value="box">Box / Garage</option>
              <option value="ufficio">Ufficio</option>
              <option value="negozio">Negozio</option>
            </select>

            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="theme-admin-select rounded-xl px-4 py-3"
            >
              <option value="draft">Bozza</option>
              <option value="published">Pubblicato</option>
            </select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="theme-admin-faint mb-2 block text-xs uppercase tracking-[0.2em]">
                Provincia
              </label>
              <select
                name="province"
                value={form.province}
                onChange={handleChange}
                className="theme-admin-select w-full rounded-xl px-4 py-3"
              >
                <option value="">Seleziona provincia</option>
                {provinces.map((province) => (
                  <option
                    key={`${province.code}-${province.name}`}
                    value={province.code}
                  >
                    {province.name} ({province.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="theme-admin-faint mb-2 block text-xs uppercase tracking-[0.2em]">
                Frazione
              </label>
              <input
                name="frazione"
                placeholder="Frazione (opzionale)"
                value={form.frazione}
                onChange={handleChange}
                className="theme-admin-input w-full rounded-xl px-4 py-3"
              />
            </div>
          </div>

          <div className="theme-admin-card rounded-2xl p-4">
            <div className="mb-3">
              <p className="theme-admin-faint text-xs uppercase tracking-[0.22em]">
                Comune
              </p>
              <p className="theme-admin-muted mt-2 text-sm">
                Seleziona un comune della provincia scelta.
              </p>
            </div>

            {!activeProvince ? (
              <div className="theme-admin-input rounded-2xl border-dashed px-4 py-4 text-sm text-[var(--site-text-muted)]">
                Seleziona prima una provincia.
              </div>
            ) : (
              <div className="space-y-4">
                <input
                  type="text"
                  value={comuneSearch}
                  onChange={(e) => setComuneSearch(e.target.value)}
                  placeholder="Cerca comune..."
                  className="theme-admin-input w-full rounded-2xl px-4 py-3"
                />

                {form.comune ? (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          comune: '',
                        }))
                      }
                      className="theme-admin-chip flex items-center gap-2 rounded-full px-3 py-1.5 text-xs transition hover:opacity-95"
                    >
                      <span>{form.comune}</span>
                      <span className="opacity-60">×</span>
                    </button>
                  </div>
                ) : (
                  <p className="theme-admin-faint text-xs">Nessun comune selezionato</p>
                )}

                <div className="theme-admin-card max-h-60 space-y-2 overflow-y-auto rounded-2xl p-2">
                  {filteredComuni.length === 0 ? (
                    <div className="px-3 py-3 text-sm text-[var(--site-text-muted)]">
                      Nessun comune trovato.
                    </div>
                  ) : (
                    filteredComuni.map((comune) => {
                      const selected = form.comune === comune.name

                      return (
                        <button
                          key={comune.code || comune.name}
                          type="button"
                          onClick={() => handleComuneSelect(comune.name)}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${
                            selected
                              ? 'theme-admin-chip-active'
                              : 'theme-admin-chip hover:opacity-95'
                          }`}
                        >
                          <span>{comune.name}</span>
                          <span className="text-xs opacity-70">
                            {selected ? 'Selezionato' : 'Seleziona'}
                          </span>
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="theme-admin-faint mb-2 block text-xs uppercase tracking-[0.2em]">
              Indirizzo completo
            </label>
            <input
              name="address"
              placeholder="Es. Via Roma 25"
              value={form.address}
              onChange={handleChange}
              className="theme-admin-input w-full rounded-xl px-4 py-3"
            />
            <p className="theme-admin-faint mt-2 text-xs">
              Se manca l’indirizzo preciso, la mappa userà il centro del comune.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="theme-admin-faint mb-2 block text-xs uppercase tracking-[0.2em]">
                Locali
              </label>
              <input
                name="rooms"
                placeholder="Locali"
                type="number"
                value={form.rooms}
                onChange={handleChange}
                className="theme-admin-input w-full rounded-xl px-4 py-3"
              />
            </div>

            <div>
              <label className="theme-admin-faint mb-2 block text-xs uppercase tracking-[0.2em]">
                Bagni
              </label>
              <input
                name="bathrooms"
                placeholder="Bagni"
                type="number"
                value={form.bathrooms}
                onChange={handleChange}
                className="theme-admin-input w-full rounded-xl px-4 py-3"
              />
            </div>

            <div>
              <label className="theme-admin-faint mb-2 block text-xs uppercase tracking-[0.2em]">
                Mq
              </label>
              <input
                name="surface"
                placeholder="Superficie (mq)"
                type="number"
                value={form.surface}
                onChange={handleChange}
                className="theme-admin-input w-full rounded-xl px-4 py-3"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="theme-admin-faint mb-2 block text-xs uppercase tracking-[0.2em]">
                Classe energetica
              </label>
              <input
                name="energy_class"
                placeholder="Es. A4, B, C..."
                value={form.energy_class}
                onChange={handleChange}
                className="theme-admin-input w-full rounded-xl px-4 py-3"
              />
            </div>

            <div>
              <label className="theme-admin-faint mb-2 block text-xs uppercase tracking-[0.2em]">
                Spese condominiali
              </label>
              <input
                name="condo_fees"
                placeholder="Es. 120€/mese, comprese, da definire"
                value={form.condo_fees}
                onChange={handleChange}
                className="theme-admin-input w-full rounded-xl px-4 py-3"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="theme-admin-faint mb-2 block text-xs uppercase tracking-[0.2em]">
                Riscaldamento
              </label>
              <input
                name="heating_type"
                placeholder="Es. termoautonomo"
                value={form.heating_type}
                onChange={handleChange}
                className="theme-admin-input w-full rounded-xl px-4 py-3"
              />
            </div>

            <div>
              <label className="theme-admin-faint mb-2 block text-xs uppercase tracking-[0.2em]">
                Ammobiliato
              </label>
              <select
                name="furnished_status"
                value={form.furnished_status}
                onChange={handleChange}
                className="theme-admin-select w-full rounded-xl px-4 py-3"
              >
                <option value="">Da definire</option>
                <option value="si">Sì</option>
                <option value="no">No</option>
                <option value="parzialmente">Parzialmente</option>
              </select>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-400/25 bg-amber-500/12 px-4 py-4 text-sm text-amber-900 dark:text-amber-100">
  <p>
    Per le voci <strong>cauzione</strong>, <strong>anticipo</strong> e{' '}
    <strong>anticipo + cauzione</strong> puoi inserire:
  </p>
  
  <div className="mt-3 space-y-1 text-amber-800 dark:text-amber-100/90">
    <div>• <strong>da definire</strong></div>
    <div>• una cifra in euro</div>
    <div>• un testo come “2 mensilità”</div>
    <div>• nulla, se non vuoi mostrarle nella scheda immobile</div>
  </div>
</div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="theme-admin-faint mb-2 block text-xs uppercase tracking-[0.2em]">
                Cauzione
              </label>
              <input
                name="deposit_amount"
                placeholder="Es. 2 mensilità / da definire / -"
                value={form.deposit_amount}
                onChange={handleChange}
                className="theme-admin-input w-full rounded-xl px-4 py-3"
              />
            </div>

            <div>
              <label className="theme-admin-faint mb-2 block text-xs uppercase tracking-[0.2em]">
                Anticipo
              </label>
              <input
                name="advance_amount"
                placeholder="Es. 1 mensilità / da definire / -"
                value={form.advance_amount}
                onChange={handleChange}
                className="theme-admin-input w-full rounded-xl px-4 py-3"
              />
            </div>

            <div>
              <label className="theme-admin-faint mb-2 block text-xs uppercase tracking-[0.2em]">
                Anticipo + cauzione
              </label>
              <input
                name="advance_deposit_amount"
                placeholder="Es. 3 mensilità / da definire / -"
                value={form.advance_deposit_amount}
                onChange={handleChange}
                className="theme-admin-input w-full rounded-xl px-4 py-3"
              />
            </div>
          </div>

          <textarea
            name="description"
            placeholder="Descrizione immobile"
            value={form.description}
            onChange={handleChange}
            rows={6}
            className="theme-admin-input w-full rounded-xl px-4 py-3"
          />

          <div className="theme-admin-card rounded-2xl p-4">
            <p className="theme-admin-faint mb-4 text-xs uppercase tracking-[0.22em]">
              Caratteristiche aggiuntive
            </p>

            <div className="grid gap-3 md:grid-cols-2">
              <FeatureToggle
                label="Box / Garage"
                checked={form.has_garage}
                onClick={() => toggleBooleanField('has_garage')}
              />
              <FeatureToggle
                label="Posto auto"
                checked={form.has_parking}
                onClick={() => toggleBooleanField('has_parking')}
              />
              <FeatureToggle
                label="Giardino"
                checked={form.has_garden}
                onClick={() => toggleBooleanField('has_garden')}
              />
              <FeatureToggle
                label="Ascensore"
                checked={form.has_elevator}
                onClick={() => toggleBooleanField('has_elevator')}
              />
              <FeatureToggle
                label="Immobile all’asta"
                checked={form.is_auction}
                onClick={() => toggleBooleanField('is_auction')}
                fullWidth
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="theme-admin-button-primary mt-6 w-full rounded-2xl py-3 font-medium transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Creazione...' : 'Crea immobile'}
        </button>
      </form>
    </section>
  )
}