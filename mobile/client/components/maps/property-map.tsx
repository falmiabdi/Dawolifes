"use client"

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import { MapPin, ExternalLink, Loader2, Navigation } from "lucide-react"
import { Button } from "@/components/ui/button"

const mapContainerStyle = {
  width: "100%",
  height: "450px",
  borderRadius: "20px",
}

const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

interface PropertyMapProps {
  latitude: number
  longitude: number
  title: string
  city: string
  region: string
}

export function PropertyMap({ latitude, longitude, title, city, region }: PropertyMapProps) {
  const center: L.LatLngExpression = latitude && longitude ? [latitude, longitude] : [9.0375, 38.7612]
  const hasCoordinates = latitude !== 0 && longitude !== 0

  const googleMapsUrl = hasCoordinates
    ? `https://www.google.com/maps?q=${latitude},${longitude}&z=18`
    : `https://www.google.com/maps/search/${encodeURIComponent(`${title}, ${city}, ${region}`)}`

  const directionsUrl = hasCoordinates
    ? `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${city}, ${region}`)}`

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-2xl border border-border shadow-sm" style={mapContainerStyle}>
        <MapContainer
          center={center}
          zoom={hasCoordinates ? 18 : 14}
          className="z-0 h-full w-full"
          style={{ height: "450px" }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {hasCoordinates && (
            <Marker position={center} icon={defaultIcon}>
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">{title}</p>
                  <p className="text-muted-foreground">
                    {latitude.toFixed(6)}, {longitude.toFixed(6)}
                  </p>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>

        {!hasCoordinates && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="rounded-xl bg-white p-4 text-center shadow-lg">
              <MapPin className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">Location not available</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          <ExternalLink className="h-4 w-4 text-primary" />
          Open in Google Maps
        </a>
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          <Navigation className="h-4 w-4 text-primary" />
          Get Directions
        </a>
      </div>

      {hasCoordinates && (
        <div className="flex items-center gap-2 rounded-xl bg-primary/10 p-3 text-sm text-primary">
          <MapPin className="h-4 w-4 shrink-0" />
          <p>
            {title} - {latitude.toFixed(6)}, {longitude.toFixed(6)}
          </p>
        </div>
      )}
    </div>
  )
}
