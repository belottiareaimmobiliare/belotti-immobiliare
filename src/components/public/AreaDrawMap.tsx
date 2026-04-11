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
      width: 14px;
      height: 14px;
      border-radius: 9999px;
      background: white;
      border: 3px solid #38bdf8;
      box-shadow: 0 0 0 4px rgba(56,189,248,0.18);
    "></div>
  `,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
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
      <div className="absolute left-6 top-24 z-[30] w-[min(420px,calc(100%-3rem))]">
        <div className="theme-panel overflow-hidden rounded-[30px] border p-6 backdrop-blur-xl">
          <div>
            <p className="text-xs uppercase tracking-[0.26em] text-[var(--site-text-faint)]">
              Ricerca avanzata
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-[var(--site-text)]">
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
            <div className="theme-card rounded-[24px] border p-4">
              <div className="text-[var(--site-text-faint)]">Punti area</div>
              <div className="mt-3 text-4xl font-semibold text-[var(--site-text)]">
                {polygonPoints.length}
              </div>
            </div>

            <div className="theme-card rounded-[24px] border p-4">
              <div className="text-[var(--site-text-faint)]">Immobili trovati</div>
              <div className="mt-3 text-4xl font-semibold text-[var(--site-text)]">
                {polygonClosed ? matchingProperties.length : '—'}
              </div>
            </div>
          </div>

          {drawingEnabled && (
            <div className="mt-5 rounded-2xl border border-emerald-500/25 bg-emerald-500/12 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-100">
              Modalità disegno attiva: clicca sulla mappa per aggiungere i vertici.
            </div>
          )}

          {polygonClosed && (
            <div className="mt-5 rounded-2xl border border-sky-500/25 bg-sky-500/12 px-4 py-3 text-sm text-sky-700 dark:text-sky-100">
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
              <Popup>
                <div className="min-w-[220px]">
                  <div className="text-sm font-semibold text-slate-900">
                    {property.title || 'Immobile'}
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    {[property.comune, property.province].filter(Boolean).join(' • ')}
                  </div>
                  <div className="mt-2 text-sm font-medium text-slate-900">
                    {formatPrice(property.price)}
                  </div>
                  {property.slug && (
                    <a
                      href={`/immobili/${property.slug}`}
                      className="mt-3 inline-block text-sm font-medium text-sky-700 underline"
                    >
                      Vai al dettaglio
                    </a>
                  )}
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