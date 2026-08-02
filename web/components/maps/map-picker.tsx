"use client"

import { useCallback, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import { MapPin, Search, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const defaultCenter: L.LatLngExpression = [9.0375, 38.7612]

const mapContainerStyle = {
  width: "100%",
  height: "400px",
  borderRadius: "16px",
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

L.Marker.prototype.options.icon = defaultIcon

interface MapPickerProps {
  latitude: number
  longitude: number
  onLocationChange: (lat: number, lng: number) => void
}

function MapClickHandler({
  onMapClick,
}: {
  onMapClick: (lat: number, lng: number) => void
}) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng
      onMapClick(lat, lng)
    },
  })
  return null
}

function SearchFetcher({
  latitude,
  longitude,
}: {
  latitude: number
  longitude: number
}) {
  const map = useMap()
  if (latitude && longitude) {
    map.setView([latitude, longitude], 17)
  }
  return null
}

export function MapPicker({ latitude, longitude, onLocationChange }: MapPickerProps) {
  const [selectedPosition, setSelectedPosition] = useState<[number, number] | null>(
    latitude && longitude ? [latitude, longitude] : null
  )
  const [searchQuery, setSearchQuery] = useState("")
  const [searching, setSearching] = useState(false)

  const onMapClick = useCallback(
    (lat: number, lng: number) => {
      setSelectedPosition([lat, lng])
      onLocationChange(lat, lng)
    },
    [onLocationChange]
  )

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setSearching(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery + ", Ethiopia")}&format=json&limit=1`,
        { headers: { "User-Agent": "DawoLife/1.0" } }
      )
      const data = await res.json()
      if (data[0]) {
        const lat = Number.parseFloat(data[0].lat)
        const lng = Number.parseFloat(data[0].lon)
        setSelectedPosition([lat, lng])
        onLocationChange(lat, lng)
      }
    } catch (error) {
      console.error("Geocoding error:", error)
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                handleSearch()
              }
            }}
            placeholder="Search address in Ethiopia..."
            className="pl-10"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleSearch}
          disabled={searching || !searchQuery.trim()}
        >
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-border" style={mapContainerStyle}>
        <MapContainer
          center={selectedPosition ?? defaultCenter}
          zoom={selectedPosition ? 17 : 12}
          className="z-0 h-full w-full"
          style={{ height: "400px" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onMapClick={onMapClick} />
          {latitude && longitude && <SearchFetcher latitude={latitude} longitude={longitude} />}
          {selectedPosition && (
            <>
              <Marker position={selectedPosition} icon={defaultIcon}>
                <Popup>
                  <div className="p-2 text-sm">
                    <p className="font-semibold">Selected Location</p>
                    <p className="text-muted-foreground">
                      {selectedPosition[0].toFixed(6)}, {selectedPosition[1].toFixed(6)}
                    </p>
                  </div>
                </Popup>
              </Marker>
            </>
          )}
        </MapContainer>
      </div>

      <div className="flex items-center gap-2 rounded-xl bg-primary/10 p-3 text-sm text-primary">
        <MapPin className="h-4 w-4 shrink-0" />
        <p>
          {selectedPosition
            ? `Location selected: ${selectedPosition[0].toFixed(6)}, ${selectedPosition[1].toFixed(6)}`
            : "Click on the map to select the property location"}
        </p>
      </div>

      {selectedPosition && (
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-border bg-card p-3">
            <p className="text-xs text-muted-foreground">Latitude</p>
            <p className="font-mono text-sm font-semibold">{selectedPosition[0].toFixed(6)}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3">
            <p className="text-xs text-muted-foreground">Longitude</p>
            <p className="font-mono text-sm font-semibold">{selectedPosition[1].toFixed(6)}</p>
          </div>
        </div>
      )}
    </div>
  )
}
