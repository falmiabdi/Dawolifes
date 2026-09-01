"use client"

import { useMemo, useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { VehicleCard } from "@/components/vehicle-card"
import { SearchSummary } from "@/components/home/search-summary"
import { getApiUrl, getImageUrl } from "@/lib/get-api-url"
import { matchesVehicle, parseSearchFilters } from "@/lib/search"
import { resolveListingAgent } from "@/lib/data"

export function LatestVehicles() {
  const [vehicles, setVehicles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()
  const { term, cats } = parseSearchFilters(searchParams.get("search"), searchParams.get("category"))
  const isSearching = term !== "" || cats.length > 0
  const showSection = !isSearching || !cats.length || cats.includes("cars")

  useEffect(() => {
    const limit = isSearching ? 100 : 20
    setLoading(true)
    fetch(`${getApiUrl()}/api/vehicles?limit=${limit}`)
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || 'Failed to fetch vehicles')
        return data
      })
      .then((data) => {
        // The public API returns { vehicles: [...] }. On an API error it
        // returns an object, so never call array methods on the raw payload.
        const dbVehicles = Array.isArray(data?.vehicles) ? data.vehicles : Array.isArray(data) ? data : []
        const transformed = dbVehicles
          .filter((v: any) => v.agent && v.agent.status !== 'Suspended')
          .map((v: any) => ({
            id: v.id,
            title: v.title || `${v.make} ${v.vehicleModel || v.model || ''} ${v.trimVersion || ''}`.trim(),
            listingType: v.listingType || 'For Sale',
            vehicleCategory: v.vehicleCategory || '',
            make: v.make || '',
            model: v.vehicleModel || v.model || '',
            trimVersion: v.trimVersion || '',
            manufacturingYear: v.manufacturingYear || 2024,
            color: v.color || '',
            countryOfOrigin: v.countryOfOrigin || '',
            fuelType: v.fuelType || '',
            engineSize: v.engineSize || undefined,
            horsepower: v.horsepower || undefined,
            transmission: v.transmission || '',
            drivetrain: v.drivetrain || '',
            seatingCapacity: v.seatingCapacity || undefined,
            doors: v.doors || undefined,
            mileage: v.mileage || undefined,
            condition: v.condition || 'Used',
            accidentFree: v.accidentFree || false,
            imported: v.imported || false,
            safetyFeatures: v.safetyFeatures || [],
            interiorFeatures: v.interiorFeatures || [],
            exteriorFeatures: v.exteriorFeatures || [],
            price: v.price || 0,
            priceType: v.priceType || '',
            region: v.region || '',
            city: v.city || '',
            subCity: v.subCity || '',
            woreda: v.woreda || '',
            description: v.description || '',
            features: v.features || [],
            images: v.images && v.images.length > 0 ? v.images.map((img: string) => getImageUrl(img)) : ["/placeholder.svg"],
            videoUrl: v.videoUrl || undefined,
            featured: v.featured || false,
            agent: { ...resolveListingAgent(v, { section: 'vehicles' }), role: v.agent?.role === 'admin' ? 'Administrator' : 'Vehicle Agent' },
          }))
        setVehicles(transformed)
      })
      .catch(() => setVehicles([]))
      .finally(() => setLoading(false))
  }, [isSearching])

  const filtered = useMemo(() => {
    if (!isSearching) return vehicles
    return vehicles.filter((v) => matchesVehicle(v, term, cats))
  }, [vehicles, isSearching, term, cats])

  if (!showSection) return null

  return (
    <section id="vehicles" className="bg-muted/40 py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-foreground md:text-2xl">
              {isSearching ? "Search Results" : "Latest Vehicles"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isSearching
                ? "Vehicles matching your search"
                : "Newly listed cars across Ethiopia"}
            </p>
          </div>
        </div>

        {isSearching && <SearchSummary anchor="vehicles" type="vehicle" count={filtered.length} />}

        <div className="mt-6 sm:mt-8 grid grid-cols-1 gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>

        {!loading && filtered.length === 0 && (
          <div className="mt-12 text-center text-muted-foreground">
            <p className="text-lg font-semibold">No vehicles found</p>
            <p className="mt-1 text-sm">Try a different search term or category.</p>
          </div>
        )}
      </div>
    </section>
  )
}
