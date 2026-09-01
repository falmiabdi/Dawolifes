"use client"

import { useMemo, useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { PropertyCard } from "@/components/property-card"
import { SearchSummary } from "@/components/home/search-summary"
import { getApiUrl, getImageUrl } from "@/lib/get-api-url"
import { matchesProperty, parseSearchFilters, PROPERTY_CATEGORY_KEYS } from "@/lib/search"
import { resolveListingAgent } from "@/lib/data"

export function LatestProperties() {
  const [properties, setProperties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()
  const { term, cats } = parseSearchFilters(searchParams.get("search"), searchParams.get("category"))
  const isSearching = term !== "" || cats.length > 0
  const propCats = cats.filter((c) => PROPERTY_CATEGORY_KEYS.includes(c))
  const showSection = !isSearching || propCats.length > 0

  useEffect(() => {
    const limit = isSearching ? 100 : 10
    setLoading(true)
    fetch(`${getApiUrl()}/api/properties?limit=${limit}`)
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || 'Failed to fetch properties')
        return data
      })
      .then((data) => {
        const dbProperties = Array.isArray(data?.properties) ? data.properties.slice(0, limit) : Array.isArray(data) ? data.slice(0, limit) : []
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
          agent: resolveListingAgent(p),
        }))
        setProperties(transformed)
      })
      .catch((err) => console.error('[API] ❌ Properties fetch failed:', err))
      .finally(() => setLoading(false))
  }, [isSearching])

  const filtered = useMemo(() => {
    if (!isSearching) return properties
    return properties.filter((p) => matchesProperty(p, term, cats))
  }, [properties, isSearching, term, cats])

  if (!showSection) return null

  return (
    <section id="listings" className="bg-muted/40 py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-foreground md:text-2xl">
              {isSearching ? "Search Results" : "Latest Properties"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isSearching
                ? "Properties matching your search"
                : "Newly listed homes and lands across Ethiopia"}
            </p>
          </div>
        </div>

        {isSearching && <SearchSummary anchor="listings" type="property" count={filtered.length} />}

        <div className="mt-6 sm:mt-8 grid grid-cols-1 gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>

        {!loading && filtered.length === 0 && (
          <div className="mt-12 text-center text-muted-foreground">
            <p className="text-lg font-semibold">No properties found</p>
            <p className="mt-1 text-sm">Try a different search term or category.</p>
          </div>
        )}
      </div>
    </section>
  )
}
