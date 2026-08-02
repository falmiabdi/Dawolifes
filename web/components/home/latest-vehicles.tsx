"use client"

import { useState, useEffect } from "react"
import { VehicleCard } from "@/components/vehicle-card"
import { getApiUrl, getImageUrl } from "@/lib/get-api-url"

export function LatestVehicles() {
  const [vehicles, setVehicles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${getApiUrl()}/api/vehicles`)
      .then((res) => res.json())
      .then((data) => {
        const dbVehicles = data.vehicles || data || []
        const transformed = dbVehicles
          .filter((v: any) => v.agentId && v.agentId.status !== 'Suspended')
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
            agent: {
              id: v.agentId || 'unknown',
              name: v.agentId?.fullName || v.agentId?.username || 'Unknown Agent',
              role: v.agentId?.role === 'admin' ? 'Administrator' : 'Vehicle Agent',
              phone: v.agentId?.ethPhone || v.agentId?.safaricomPhone || '+251 900 000 000',
              avatar: v.agentId?.profilePhoto || '/placeholder.svg',
            }
          }))
        setVehicles(transformed)
      })
      .catch((err) => console.error('[API] ❌ Vehicles fetch failed:', err))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section id="vehicles" className="bg-muted/40 py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-foreground md:text-2xl">Latest Vehicles</h2>
            <p className="mt-1 text-sm text-muted-foreground">Newly listed cars across Ethiopia</p>
          </div>
        </div>

        <div className="mt-6 sm:mt-8 grid grid-cols-1 gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>

        {!loading && vehicles.length === 0 && (
          <div className="mt-12 text-center text-muted-foreground">
            <p className="text-lg font-semibold">No vehicles listed yet</p>
            <p className="mt-1 text-sm">Check back soon for new listings.</p>
          </div>
        )}
      </div>
    </section>
  )
}
