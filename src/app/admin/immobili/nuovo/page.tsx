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
    const { name, type } = e.target

    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement
      setForm((prev) => ({
        ...prev,
        [name]: target.checked,
      }))
      return
    }

    const value = e.target.value

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
        deposit_amount: form.deposit_amount || null,
        advance_amount: form.advance_amount || null,
        advance_deposit_amount: form.advance_deposit_amount || null,
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
    <section className="mx-auto w-full max-w-3xl px-4">
      <p className="text-sm uppercase tracking-[0.2em] text-white/40">
        Nuovo immobile
      </p>

      <h2 className="mt-2 text-3xl font-semibold text-white">
        Crea immobile
      </h2>

      <p className="mt-3 text-white/60">
        Inserisci i dati principali dell’immobile.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5 md:p-6"
      >
        <div className="grid gap-4">
          <input
            name="title"
            placeholder="Titolo"
            value={form.title}
            onChange={handleChange}
            className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/35"
            required
          />

          <input
            name="price"
            placeholder="Prezzo"
            type="number"
            value={form.price}
            onChange={handleChange}
            className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/35"
          />

          <div className="grid gap-4 md:grid-cols-3">
            <select
              name="contract_type"
              value={form.contract_type}
              onChange={handleChange}
              className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white"
            >
              <option value="vendita">Vendita</option>
              <option value="affitto">Affitto</option>
            </select>

            <select
              name="property_type"
              value={form.property_type}
              onChange={handleChange}
              className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white"
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
              className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white"
            >
              <option value="draft">Bozza</option>
              <option value="published">Pubblicato</option>
            </select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/40">
                Provincia
              </label>
              <select
                name="province"
                value={form.province}
                onChange={handleChange}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white"
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
              <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/40">
                Frazione
              </label>
              <input
                name="frazione"
                placeholder="Frazione (opzionale)"
                value={form.frazione}
                onChange={handleChange}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/35"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="mb-3">
              <p className="text-xs uppercase tracking-[0.22em] text-white/35">
                Comune
              </p>
              <p className="mt-2 text-sm text-white/55">
                Seleziona un comune della provincia scelta.
              </p>
            </div>

            {!activeProvince ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-4 text-sm text-white/45">
                Seleziona prima una provincia.
              </div>
            ) : (
              <div className="space-y-4">
                <input
                  type="text"
                  value={comuneSearch}
                  onChange={(e) => setComuneSearch(e.target.value)}
                  placeholder="Cerca comune..."
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/35"
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
                      className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs text-white/85 transition hover:bg-white/15"
                    >
                      <span>{form.comune}</span>
                      <span className="text-white/60">×</span>
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-white/40">Nessun comune selezionato</p>
                )}

                <div className="max-h-60 space-y-2 overflow-y-auto rounded-2xl border border-white/10 bg-white/5 p-2">
                  {filteredComuni.length === 0 ? (
                    <div className="px-3 py-3 text-sm text-white/45">
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
                              ? 'bg-white text-black'
                              : 'bg-transparent text-white/80 hover:bg-white/10'
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
            <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/40">
              Indirizzo completo
            </label>
            <input
              name="address"
              placeholder="Es. Via Roma 25"
              value={form.address}
              onChange={handleChange}
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/35"
            />
            <p className="mt-2 text-xs text-white/45">
              Se manca l’indirizzo preciso, la mappa userà il centro del comune.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/40">
                Locali
              </label>
              <input
                name="rooms"
                placeholder="Locali"
                type="number"
                value={form.rooms}
                onChange={handleChange}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/35"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/40">
                Bagni
              </label>
              <input
                name="bathrooms"
                placeholder="Bagni"
                type="number"
                value={form.bathrooms}
                onChange={handleChange}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/35"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/40">
                Mq
              </label>
              <input
                name="surface"
                placeholder="Superficie (mq)"
                type="number"
                value={form.surface}
                onChange={handleChange}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/35"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/40">
                Classe energetica
              </label>
              <input
                name="energy_class"
                placeholder="Es. A4, B, C..."
                value={form.energy_class}
                onChange={handleChange}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/35"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/40">
                Spese condominiali
              </label>
              <input
                name="condo_fees"
                placeholder="Es. 120€/mese, comprese, da definire"
                value={form.condo_fees}
                onChange={handleChange}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/35"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/40">
                Riscaldamento
              </label>
              <input
                name="heating_type"
                placeholder="Es. termoautonomo"
                value={form.heating_type}
                onChange={handleChange}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/35"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/40">
                Ammobiliato
              </label>
              <select
                name="furnished_status"
                value={form.furnished_status}
                onChange={handleChange}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white"
              >
                <option value="">Da definire</option>
                <option value="si">Sì</option>
                <option value="no">No</option>
                <option value="parzialmente">Parzialmente</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/40">
                Cauzione
              </label>
              <input
                name="deposit_amount"
                placeholder="Es. 2 mensilità"
                value={form.deposit_amount}
                onChange={handleChange}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/35"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/40">
                Anticipo
              </label>
              <input
                name="advance_amount"
                placeholder="Es. 1 mensilità"
                value={form.advance_amount}
                onChange={handleChange}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/35"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/40">
                Anticipo + cauzione
              </label>
              <input
                name="advance_deposit_amount"
                placeholder="Es. 3 mensilità"
                value={form.advance_deposit_amount}
                onChange={handleChange}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/35"
              />
            </div>
          </div>

          <textarea
            name="description"
            placeholder="Descrizione immobile"
            value={form.description}
            onChange={handleChange}
            rows={6}
            className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/35"
          />

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="mb-4 text-xs uppercase tracking-[0.22em] text-white/35">
              Caratteristiche aggiuntive
            </p>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
                <input
                  type="checkbox"
                  name="has_garage"
                  checked={form.has_garage}
                  onChange={handleChange}
                  className="h-4 w-4 accent-white"
                />
                Box / Garage
              </label>

              <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
                <input
                  type="checkbox"
                  name="has_parking"
                  checked={form.has_parking}
                  onChange={handleChange}
                  className="h-4 w-4 accent-white"
                />
                Posto auto
              </label>

              <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
                <input
                  type="checkbox"
                  name="has_garden"
                  checked={form.has_garden}
                  onChange={handleChange}
                  className="h-4 w-4 accent-white"
                />
                Giardino
              </label>

              <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
                <input
                  type="checkbox"
                  name="has_elevator"
                  checked={form.has_elevator}
                  onChange={handleChange}
                  className="h-4 w-4 accent-white"
                />
                Ascensore
              </label>

              <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 md:col-span-2">
                <input
                  type="checkbox"
                  name="is_auction"
                  checked={form.is_auction}
                  onChange={handleChange}
                  className="h-4 w-4 accent-white"
                />
                Immobile all’asta
              </label>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-2xl bg-white py-3 font-medium text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Creazione...' : 'Crea immobile'}
        </button>
      </form>
    </section>
  )
}