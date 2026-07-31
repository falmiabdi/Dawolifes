"use client"

import { useState, useEffect } from "react"
import { PropertyCard } from "@/components/property-card"
import { getApiUrl, getImageUrl } from "@/lib/get-api-url"

export function LatestProperties() {
  const [properties, setProperties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${getApiUrl()}/api/properties`)
      .then((res) => res.json())
      .then((data) => {
        const dbProperties = data.properties || []
        const transformed = dbProperties.map((p: any) => ({
          id: p.id,
          title: p.title,
          type: p.type,
          listingType: p.listingType,
          price: p.price,
          priceType: p.priceType,
          region: p.region,
          city: p.city,
          subCity: p.subCity || '',
          woreda: p.woreda || '',
          kebele: p.kebele || '',
          parcel: p.parcel || '',
          block: p.block || '',
          homeNo: p.homeNo || '',
          area: p.area || 0,
          bedrooms: p.bedrooms || 0,
          bathrooms: p.bathrooms || 0,
          condition: p.condition || 'Finished',
          legalizedYear: p.legalizedYear || 2024,
          description: p.description || '',
          features: p.features || [],
          images: p.images && p.images.length > 0 ? p.images.map((img: string) => getImageUrl(img)) : ["/placeholder.svg"],
          agent: {
            id: p.agent?.id || p.agentId || 'unknown',
            name: p.agent?.username || p.agentName || 'Unknown Agent',
            role: 'Real Estate Agent',
            phone: p.displayPhone || p.agent?.phone || '+251 900 000 000',
            avatar: p.agent?.profilePhoto || '/placeholder.svg',
          }
        }))
        setProperties(transformed)
      })
      .catch((err) => console.error('[API] ❌ Properties fetch failed:', err))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section id="listings" className="bg-muted/40 py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-foreground md:text-2xl">Latest Properties</h2>
            <p className="mt-1 text-sm text-muted-foreground">Newly listed homes and lands across Ethiopia</p>
          </div>
        </div>

        <div className="mt-6 sm:mt-8 grid grid-cols-1 gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>

        {!loading && properties.length === 0 && (
          <div className="mt-12 text-center text-muted-foreground">
            <p className="text-lg font-semibold">No properties listed yet</p>
            <p className="mt-1 text-sm">Check back soon for new listings.</p>
          </div>
        )}
      </div>
    </section>
  )
}
