'use client'

import * as L from 'leaflet'
import type { LatLngExpression } from 'leaflet'
import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'

import 'leaflet/dist/leaflet.css'

// Fix for default Leaflet icon issues with Webpack/Next.js
const defaultIcon = new L.Icon({
  iconUrl: '/map-pin.svg',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [1, -40],
})

export interface Location {
  latitude: number
  longitude: number
  address?: string
}

interface MapPickerProps {
  initialLocation?: Location
  onLocationSelect: (location: Location) => void
  zoom?: number
  defaultCenter?: LatLngExpression
  height?: string
}

async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<string | undefined> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
    )
    const data = await response.json()
    if (data && data.display_name) {
      return data.display_name
    }
  } catch (error) {
    console.error('Error during reverse geocoding:', error)
  }
  return undefined
}

function LocationMarker({
  initialLocation,
  onLocationSelect,
}: {
  initialLocation?: Location
  onLocationSelect: (location: Location) => void
}) {
  const [position, setPosition] = useState<LatLngExpression | null>(
    initialLocation
      ? [initialLocation.latitude, initialLocation.longitude]
      : null,
  )

  const map = useMapEvents({
    async click(e) {
      const newLat = e.latlng.lat
      const newLng = e.latlng.lng
      setPosition([newLat, newLng])
      const address = await reverseGeocode(newLat, newLng)
      onLocationSelect({ latitude: newLat, longitude: newLng, address })
    },
  })

  // Effect to handle initial location and potentially fetch its name if not provided
  useEffect(() => {
    if (initialLocation) {
      setPosition([initialLocation.latitude, initialLocation.longitude])
      map.setView(
        [initialLocation.latitude, initialLocation.longitude],
        map.getZoom(),
      )
      // اگر نام موقعیت اولیه وجود ندارد، آن را از طریق reverse geocoding دریافت کنید
      if (!initialLocation.address) {
        reverseGeocode(
          initialLocation.latitude,
          initialLocation.longitude,
        ).then((address) => {
          onLocationSelect({
            latitude: initialLocation.longitude,
            longitude: initialLocation.longitude,
            address,
          })
        })
      }
    }
  }, [initialLocation, map, onLocationSelect])

  return position === null ? null : (
    <Marker position={position} icon={defaultIcon} />
  )
}

export default function MapPicker({
  initialLocation,
  onLocationSelect,
  zoom = 13,
  defaultCenter = [35.6892, 51.389], // Tehran, Iran as a default
  height = '400px',
}: MapPickerProps) {
  return (
    <MapContainer
      center={
        initialLocation
          ? [initialLocation.latitude, initialLocation.longitude]
          : defaultCenter
      }
      zoom={zoom}
      scrollWheelZoom
      style={{ height, width: '100%' }}
      className="rounded-md"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <LocationMarker
        initialLocation={initialLocation}
        onLocationSelect={onLocationSelect}
      />
    </MapContainer>
  )
}
