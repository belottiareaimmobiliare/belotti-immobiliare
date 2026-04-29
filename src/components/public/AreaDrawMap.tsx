'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  MapContainer,
  Marker,
  Polygon,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import L, { LatLngExpression } from 'leaflet'
import 'leaflet/dist/leaflet.css'

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

type ValidMapProperty = MapProperty & {
  latitude: number
  longitude: number
}

type Props = {
  properties: MapProperty[]
}

type Point = {
  lat: number
  lng: number
}

const DEFAULT_CENTER: [number, number] = [45.6983, 9.6773]

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

const vertexIcon = L.divIcon({
  className: '',
  html: `
    <div style="
      width: 14px;
      height: 14px;
      border-radius: 9999px;
      background: #22c55e;
      border: 2px solid white;
      box-shadow: 0 0 0 4px rgba(34,197,94,0.18);
    "></div>
  `,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
})

const closeVertexIcon = L.divIcon({
  className: '',
  html: `
    <div style="
      width: 18px;
      height: 18px;
      border-radius: 9999px;
      background: #f59e0b;
      border: 2px solid white;
      box-shadow: 0 0 0 4px rgba(245,158,11,0.22);
    "></div>
  `,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

function formatPrice(price: number | null) {
  if (!price) return 'Prezzo riservato'
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(price)
}

function isValidCoordinate(value: number | null): value is number {
  return typeof value === 'number' && !Number.isNaN(value)
}

function isValidMapProperty(property: MapProperty): property is ValidMapProperty {
  return isValidCoordinate(property.latitude) && isValidCoordinate(property.longitude)
}

function pointInPolygon(point: Point, polygon: Point[]) {
  let inside = false

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng
    const yi = polygon[i].lat
    const xj = polygon[j].lng
    const yj = polygon[j].lat

    const intersect =
      yi > point.lat !== yj > point.lat &&
      point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi + Number.EPSILON) + xi

    if (intersect) inside = !inside
  }

  return inside
}

function serializePolygon(points: Point[]) {
  return points.map((point) => `${point.lat}:${point.lng}`).join(';')
}

function FitMapToProperties({ properties }: { properties: MapProperty[] }) {
  const map = useMap()

  useEffect(() => {
    const valid = properties.filter(isValidMapProperty)

    if (valid.length === 0) return

    if (valid.length === 1) {
      map.setView([valid[0].latitude, valid[0].longitude], 13)
      return
    }

    const bounds = L.latLngBounds(
      valid.map((property) => [property.latitude, property.longitude] as [number, number])
    )

    map.fitBounds(bounds, { padding: [40, 40] })
  }, [map, properties])

  return null
}

function DrawingEvents({
  drawingEnabled,
  onAddPoint,
}: {
  drawingEnabled: boolean
  onAddPoint: (point: Point) => void
}) {
  useMapEvents({
    click(event) {
      if (!drawingEnabled) return

      onAddPoint({
        lat: event.latlng.lat,
        lng: event.latlng.lng,
      })
    },
  })

  return null
}

export default function AreaDrawMap({ properties }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [drawingEnabled, setDrawingEnabled] = useState(false)
  const [polygonPoints, setPolygonPoints] = useState<Point[]>([])
  const [isClosed, setIsClosed] = useState(false)

  const polygonClosed = isClosed && polygonPoints.length >= 3

  const matchingProperties = useMemo(() => {
    if (!polygonClosed) return []

    return properties.filter((property) => {
      if (!isValidMapProperty(property)) return false

      return pointInPolygon(
        { lat: property.latitude, lng: property.longitude },
        polygonPoints
      )
    })
  }, [polygonClosed, polygonPoints, properties])

  function handleStartDrawing() {
    setDrawingEnabled(true)
    setPolygonPoints([])
    setIsClosed(false)
  }

  function handleAddPoint(point: Point) {
    if (isClosed) return
    setPolygonPoints((prev) => [...prev, point])
  }

  function handleClosePolygon() {
    if (polygonPoints.length < 3) return
    setIsClosed(true)
    setDrawingEnabled(false)
  }

  function handleUndoLastPoint() {
    if (isClosed) return
    setPolygonPoints((prev) => prev.slice(0, -1))
  }

  function handleResetArea() {
    setDrawingEnabled(false)
    setPolygonPoints([])
    setIsClosed(false)
  }

  function handleShowResults() {
    if (!polygonClosed) return

    const polygonParam = serializePolygon(polygonPoints)
    const params = new URLSearchParams(searchParams.toString())
    params.delete('page')
    params.delete('province')
    params.delete('comune')
    params.set('polygon', polygonParam)

    router.push(`/immobili?${params.toString()}`)
  }

  const polylinePositions: LatLngExpression[] = polygonPoints.map((point) => [
    point.lat,
    point.lng,
  ])

  const polygonPositions: LatLngExpression[] = polygonPoints.map((point) => [
    point.lat,
    point.lng,
  ])

  
return (
    <div className="relative h-full w-full">
      <style jsx global>{`
        .custom-popup .leaflet-popup-content-wrapper {
          background: transparent !important;
          box-shadow: none !important;
          padding: 0 !important;
        }

        .custom-popup .leaflet-popup-content {
          margin: 0 !important;
        }

        .custom-popup .leaflet-popup-tip {
          background: #0f172a !important;
          box-shadow: none !important;
        }
      `}</style>


      <div className="absolute left-6 top-24 z-[30] w-[min(420px,calc(100%-3rem))]">
        <div className="theme-map-floating overflow-hidden rounded-[30px] p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.26em] text-[var(--site-text-faint)]">
              Ricerca avanzata
            </p>
            <h2 className="mt-2 text-3xl font-semibold leading-tight text-[var(--site-text)]">
              Disegna la tua area sulla mappa
            </h2>
          </div>

          <p className="mt-5 text-base leading-8 text-[var(--site-text-soft)]">
            Clicca sulla mappa per aggiungere i punti dell’area. Quando vuoi
            chiudere il poligono, clicca sul primo punto evidenziato.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleStartDrawing}
              className="theme-button-primary rounded-2xl px-5 py-3 text-sm font-semibold transition hover:opacity-95"
            >
              Disegna la tua area
            </button>

            <button
              type="button"
              onClick={handleUndoLastPoint}
              disabled={polygonPoints.length === 0 || isClosed}
              className="theme-button-secondary rounded-2xl px-5 py-3 text-sm transition disabled:cursor-not-allowed disabled:opacity-40"
            >
              Annulla ultimo punto
            </button>

            <button
              type="button"
              onClick={handleResetArea}
              disabled={polygonPoints.length === 0 && !isClosed}
              className="theme-button-secondary rounded-2xl px-5 py-3 text-sm transition disabled:cursor-not-allowed disabled:opacity-40"
            >
              Reset area
            </button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <div className="theme-card rounded-[24px] p-4">
              <div className="text-[var(--site-text-faint)]">Punti area</div>
              <div className="mt-3 text-4xl font-semibold text-[var(--site-text)]">
                {polygonPoints.length}
              </div>
            </div>

            <div className="theme-card rounded-[24px] p-4">
              <div className="text-[var(--site-text-faint)]">Immobili trovati</div>
              <div className="mt-3 text-4xl font-semibold text-[var(--site-text)]">
                {polygonClosed ? matchingProperties.length : '—'}
              </div>
            </div>
          </div>

          {drawingEnabled && (
            <div className="theme-info-emerald mt-5 rounded-2xl px-4 py-3 text-sm font-medium">
              Modalità disegno attiva: clicca sulla mappa per aggiungere i vertici.
            </div>
          )}

          {polygonClosed && (
            <div className="theme-info-sky mt-5 rounded-2xl px-4 py-3 text-sm font-medium">
              Area chiusa correttamente. Ora puoi vedere gli immobili contenuti nella zona selezionata.
            </div>
          )}

          <button
            type="button"
            onClick={handleShowResults}
            disabled={!polygonClosed}
            className="mt-5 w-full rounded-2xl bg-sky-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Vedi {matchingProperties.length} immobili
          </button>
        </div>
      </div>

      <MapContainer
        center={DEFAULT_CENTER}
        zoom={11}
        className="h-full w-full"
        zoomControl={true}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitMapToProperties properties={properties} />

        <DrawingEvents
          drawingEnabled={drawingEnabled}
          onAddPoint={handleAddPoint}
        />

        {properties.map((property) => {
          if (!isValidMapProperty(property)) return null

          
return (
            <Marker
              key={property.id}
              position={[property.latitude, property.longitude]}
              icon={propertyIcon}
            >
              <Popup closeButton={false} className="property-preview-popup custom-popup">
                <div className="w-[min(82vw,560px)] overflow-hidden rounded-[22px] bg-white text-slate-900 shadow-[0_18px_40px_rgba(2,6,23,0.16)]">
                  <div className="grid min-h-[118px] grid-cols-1 bg-white md:grid-cols-[1.15fr_1fr]">
                    <div className="order-2 flex min-w-0 flex-col justify-between px-5 py-2.5 md:order-1">
                      <div>
                        <h3 className="line-clamp-2 text-[0.95rem] font-semibold leading-5 text-slate-800">
                          {property.title || 'Immobile'}
                        </h3>

                        <p className="mt-1.5 text-[12px] text-slate-500">
                          {property.comune || '—'} ({property.province || '—'})
                        </p>
                      </div>

                      <div className="mt-2">
                        <p className="text-[1.45rem] font-semibold leading-none text-slate-900 md:text-[1.65rem]">
                          {formatPrice(property.price)}
                        </p>
                      </div>

                      <div className="mt-2">
                        {property.slug ? (
                          <a
                            href={`/immobili/${property.slug}`}
                            className="inline-flex rounded-[12px] bg-[#08111f] px-3.5 py-2 text-sm font-medium text-white transition hover:opacity-90"
                          >
                            Apri scheda
                          </a>
                        ) : (
                          <div className="h-[42px]" />
                        )}
                      </div>
                    </div>

                    <div className="relative order-1 overflow-hidden md:order-2 md:rounded-l-[18px]">
                      {property.coverImage ? (
                        <div
                          className="h-[118px] w-full bg-cover bg-center md:h-full md:min-h-[118px]"
                          style={{ backgroundImage: `url('${property.coverImage}')` }}
                        />
                      ) : (
                        <div className="flex h-[118px] w-full items-center justify-center bg-slate-200 text-[11px] text-slate-500 md:h-full md:min-h-[118px]">
                          Nessuna immagine
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}

        {polygonPoints.length > 0 && !isClosed && (
          <Polyline
            positions={polylinePositions}
            pathOptions={{
              color: '#38bdf8',
              weight: 3,
              opacity: 0.95,
            }}
          />
        )}

        {polygonClosed && (
          <Polygon
            positions={polygonPositions}
            pathOptions={{
              color: '#38bdf8',
              weight: 3,
              fillColor: '#38bdf8',
              fillOpacity: 0.18,
            }}
          />
        )}

        {polygonPoints.map((point, index) => {
          const isFirst = index === 0
          const canClose = isFirst && polygonPoints.length >= 3 && !isClosed

          
return (
            <Marker
              key={`${point.lat}-${point.lng}-${index}`}
              position={[point.lat, point.lng]}
              icon={canClose ? closeVertexIcon : vertexIcon}
              eventHandlers={
                canClose
                  ? {
                      click: () => {
                        handleClosePolygon()
                      },
                    }
                  : undefined
              }
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                {canClose ? 'Clicca per chiudere l’area' : `Punto ${index + 1}`}
              </Tooltip>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}