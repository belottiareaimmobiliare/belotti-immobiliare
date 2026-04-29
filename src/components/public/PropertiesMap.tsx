'use client'

import { useEffect, useMemo, useState } from 'react'
import { MapContainer, Marker, Polygon, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import Link from 'next/link'

type MapProperty = {
  id: string
  slug: string | null
  title: string | null
  comune: string | null
  province: string | null
  price: number | null
  latitude: number | null
  longitude: number | null
  location_mode?: string | null
  coverImage?: string | null
}

type PolygonValue = {
  points: [number, number][]
}

type Props = {
  properties: MapProperty[]
  polygon?: PolygonValue | null
  enableDrawing?: boolean
  onPolygonChange?: (polygon: PolygonValue | null) => void
  emptyInsidePolygon?: boolean
  heightClassName?: string
}

const defaultCenter: [number, number] = [45.6983, 9.6773]

const propertyIcon = L.divIcon({
  className: '',
  html: `
    <div style="
      width: 26px;
      height: 26px;
      border-radius: 9999px;
      background: white;
      border: 3px solid #38bdf8;
      box-shadow: 0 8px 18px rgba(2,6,23,0.22), 0 0 0 5px rgba(56,189,248,0.18);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#0284c7">
        <path d="M3 10.8 12 3l9 7.8-1.35 1.55L18.5 11.35V20h-5v-5.2h-3V20h-5v-8.65l-1.15 1-1.35-1.55Z"/>
      </svg>
    </div>
  `,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
  popupAnchor: [0, -16],
})

function formatPrice(price: number | null) {
  if (typeof price !== 'number') return 'Trattativa riservata'

  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(price)
}

function MapResizer() {
  const map = useMap()

  useEffect(() => {
    const resize = () => map.invalidateSize()

    const t1 = window.setTimeout(resize, 100)
    const t2 = window.setTimeout(resize, 350)
    const t3 = window.setTimeout(resize, 800)

    window.addEventListener('resize', resize)

    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      window.clearTimeout(t3)
      window.removeEventListener('resize', resize)
    }
  }, [map])

  return null
}

function FitMap({
  properties,
  polygon,
}: {
  properties: MapProperty[]
  polygon?: PolygonValue | null
}) {
  const map = useMap()

  useEffect(() => {
    const polygonPoints = polygon?.points || []

    if (polygonPoints.length >= 3) {
      const bounds = L.latLngBounds(
        polygonPoints.map((point) => [point[0], point[1]] as [number, number])
      )
      map.fitBounds(bounds, { padding: [40, 40] })
      return
    }

    const coords = properties
      .filter(
        (property) =>
          typeof property.latitude === 'number' &&
          !Number.isNaN(property.latitude) &&
          typeof property.longitude === 'number' &&
          !Number.isNaN(property.longitude)
      )
      .map(
        (property) =>
          [property.latitude as number, property.longitude as number] as [
            number,
            number,
          ]
      )

    if (coords.length === 1) {
      map.setView(coords[0], 13)
      return
    }

    if (coords.length > 1) {
      const bounds = L.latLngBounds(coords)
      map.fitBounds(bounds, { padding: [40, 40] })
      return
    }

    map.setView(defaultCenter, 10)
  }, [map, properties, polygon])

  return null
}

export default function PropertiesMap({
  properties,
  polygon = null,
  emptyInsidePolygon = false,
  heightClassName = 'h-[420px]',
}: Props) {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null)

  const validProperties = useMemo(
    () =>
      properties.filter(
        (property) =>
          typeof property.latitude === 'number' &&
          !Number.isNaN(property.latitude) &&
          typeof property.longitude === 'number' &&
          !Number.isNaN(property.longitude)
      ),
    [properties]
  )

  const selectedProperty =
    validProperties.find((property) => property.id === selectedPropertyId) || null

  const polygonPositions =
    polygon?.points?.length && polygon.points.length >= 3
      ? polygon.points.map((point) => [point[0], point[1]] as [number, number])
      : null

  return (
    <div className={`relative w-full overflow-hidden rounded-[28px] ${heightClassName}`}>
      <MapContainer
        center={defaultCenter}
        zoom={10}
        scrollWheelZoom
        dragging
        doubleClickZoom
        className="h-full w-full"
        style={{ height: '100%', width: '100%', background: '#dbe7f2' }}
      >
        <MapResizer />
        <FitMap properties={validProperties} polygon={polygon} />

        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {polygonPositions && (
          <Polygon
            positions={polygonPositions}
            pathOptions={{
              color: '#38bdf8',
              weight: 3,
              fillColor: '#38bdf8',
              fillOpacity: 0.16,
            }}
          />
        )}

        {validProperties.map((property) => (
          <Marker
            key={property.id}
            position={[property.latitude as number, property.longitude as number]}
            icon={propertyIcon}
            eventHandlers={{
              click: () => {
                setSelectedPropertyId(property.id)
              },
            }}
          />
        ))}
      </MapContainer>

      {selectedProperty && (
        <div className="absolute left-1/2 top-4 z-[500] w-[min(92%,560px)] -translate-x-1/2 md:w-[min(92%,560px)]">
          <div className="overflow-hidden rounded-[22px] bg-white text-slate-900 shadow-[0_18px_40px_rgba(2,6,23,0.16)]">
            <div className="grid min-h-[170px] grid-cols-1 bg-white md:grid-cols-[1.1fr_1fr]">
              <div className="order-2 flex min-w-0 flex-col justify-between px-5 py-5 md:order-1">
                <div>
                  <h3 className="line-clamp-2 text-[1.05rem] font-semibold leading-6 text-slate-800">
                    {selectedProperty.title || 'Immobile'}
                  </h3>

                  <p className="mt-3 text-[13px] text-slate-500">
                    {selectedProperty.comune || '—'} ({selectedProperty.province || '—'})
                  </p>
                </div>

                <div className="mt-4">
                  <p className="text-[1.65rem] font-semibold leading-none text-slate-900 md:text-[2rem]">
                    {formatPrice(selectedProperty.price)}
                  </p>
                </div>

                <div className="mt-4">
                  {selectedProperty.slug ? (
                    <Link
                      href={`/immobili/${selectedProperty.slug}`}
                      className="inline-flex rounded-[12px] bg-[#08111f] px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
                    >
                      Apri scheda
                    </Link>
                  ) : (
                    <div className="h-[42px]" />
                  )}
                </div>
              </div>

              <div className="relative order-1 overflow-hidden md:order-2 md:rounded-l-[18px]">
                {selectedProperty.coverImage ? (
                  <div
                    className="h-[160px] w-full bg-cover bg-center md:h-full md:min-h-[170px]"
                    style={{ backgroundImage: `url('${selectedProperty.coverImage}')` }}
                  />
                ) : (
                  <div className="flex h-[160px] w-full items-center justify-center bg-slate-200 text-[11px] text-slate-500 md:h-full md:min-h-[170px]">
                    Nessuna immagine
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedPropertyId(null)}
                  className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-sm text-slate-600 transition hover:bg-white"
                  aria-label="Chiudi scheda immobile"
                >
                  ×
                </button>
              </div>
            </div>

            {selectedProperty.location_mode === 'comune_center' && (
              <div className="border-t border-[#0f172a] bg-[#0b1630] px-3 py-1.5 font-mono text-[9px] leading-none tracking-[0.08em] text-[#facc15]">
                POSIZIONE NON PRECISA | {selectedProperty.comune || 'COMUNE'}
              </div>
            )}
          </div>
        </div>
      )}

      {polygonPositions && (
        <div className="pointer-events-none absolute bottom-4 left-4 z-[450] rounded-2xl border border-sky-400/20 bg-sky-500/85 px-4 py-3 text-sm text-white shadow-xl backdrop-blur">
          Area selezionata attiva sulla mappa
        </div>
      )}

      {emptyInsidePolygon && (
        <div className="pointer-events-none absolute left-4 top-4 z-[450] rounded-2xl border border-red-400/20 bg-red-500/85 px-4 py-3 text-sm text-white shadow-xl backdrop-blur">
          Non ci sono immobili nell’area selezionata, prova ad ampliare la ricerca.
        </div>
      )}
    </div>
  )
}