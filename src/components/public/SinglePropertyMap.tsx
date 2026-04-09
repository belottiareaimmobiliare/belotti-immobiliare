'use client'

import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import L from 'leaflet'

type Props = {
  title: string | null
  comune: string | null
  province: string | null
  price: number | null
  latitude: number | null
  longitude: number | null
  locationMode: string | null
}

const icon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

export default function SinglePropertyMap({
  title,
  comune,
  province,
  price,
  latitude,
  longitude,
  locationMode,
}: Props) {
  if (
    typeof latitude !== 'number' ||
    Number.isNaN(latitude) ||
    typeof longitude !== 'number' ||
    Number.isNaN(longitude)
  ) {
    return (
      <div className="flex min-h-[280px] items-center justify-center rounded-[24px] border border-dashed border-white/15 bg-black/20 text-sm text-white/40">
        Posizione non disponibile
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-[24px] border border-white/10">
      <MapContainer
        center={[latitude, longitude]}
        zoom={14}
        scrollWheelZoom
        className="h-[280px] w-full"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker position={[latitude, longitude]} icon={icon}>
          <Popup>
            <div className="min-w-[190px] text-black">
              <p className="font-semibold">{title || 'Immobile'}</p>

              <p className="mt-1 text-sm">
                {comune || '—'} ({province || '—'})
              </p>

              <p className="mt-2 text-sm">
                {price ? `€ ${price.toLocaleString()}` : 'Trattativa riservata'}
              </p>

              <p className="mt-2 text-xs text-black/70">
                {locationMode === 'comune_center'
                  ? 'Posizione indicativa sul comune'
                  : 'Posizione disponibile'}
              </p>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  )
}