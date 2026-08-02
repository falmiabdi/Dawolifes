"use client"

import { useEffect, useMemo, useState } from "react"
import { MobileHeader } from "@/components/home/mobile-header"
import { ServiceCards } from "@/components/home/service-cards"
import { ImageSection, type ListingItem } from "@/components/home/image-section"
import { useI18n } from "@/lib/i18n"
import { getApiUrl, getImageUrl } from "@/lib/get-api-url"

const FALLBACK_HOUSE_IMAGES = [
  "/properties/villa-1.png",
  "/properties/house-2.png",
  "/properties/apartment-3.png",
  "/properties/villa-5.png",
  "/properties/commercial-6.png",
  "/properties/interior-4.png",
]

function fallbackHouseItems(): ListingItem[] {
  return FALLBACK_HOUSE_IMAGES.map((image, index) => ({
    id: `fallback-${index}`,
    image,
    href: "/listings/view",
    title: "Featured Home",
    listingType: index % 2 === 0 ? "For Rent" : "For Sale",
    price: 15000 + index * 5000,
    location: "Ethiopia",
  }))
}

export function MobileHome() {
  const { t } = useI18n()
  const [houseItems, setHouseItems] = useState<ListingItem[]>(fallbackHouseItems)
  const [vehicleItems, setVehicleItems] = useState<ListingItem[]>([])
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("")

  useEffect(() => {
    let cancelled = false

    fetch(`${getApiUrl()}/api/properties?status=Approved`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return
        const docs = data.properties || []
        const items: ListingItem[] = docs
          .filter((p: any) => p.images && p.images.length > 0)
          .slice(0, 8)
          .map((p: any) => ({
            id: p.id,
            image: getImageUrl(p.images[0]),
            href: `/listings/view?id=${p.id}`,
            title: p.title,
            listingType: p.listingType || "For Sale",
            price: p.price || 0,
            priceType: p.priceType,
            location: [p.subCity, p.city, p.region].filter(Boolean).join(", ") || "Ethiopia",
            type: p.type || "",
            beds: p.bedrooms,
            baths: p.bathrooms,
            area: p.area,
            features: p.features || [],
          }))
        if (items.length > 0) setHouseItems(items)
      })
      .catch((err) => console.error("[API] ❌ Mobile home properties fetch failed:", err))

    fetch(`${getApiUrl()}/api/vehicles`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return
        const docs = Array.isArray(data) ? data : data.vehicles || []
        const items: ListingItem[] = docs
          .filter((v: any) => v.images && v.images.length > 0)
          .slice(0, 8)
          .map((v: any) => ({
            id: v.id,
            image: getImageUrl(v.images[0]),
            href: `/listings/vehicle?id=${v.id}`,
            title: v.title || `${v.make || ""} ${v.vehicleModel || v.model || ""}`.trim(),
            listingType: v.listingType || "For Sale",
            price: v.price || 0,
            priceType: v.priceType,
            location: [v.subCity, v.city, v.region].filter(Boolean).join(", ") || "Ethiopia",
            type: "Vehicle",
            year: v.manufacturingYear,
            mileage: v.mileage,
          }))
        if (items.length > 0) setVehicleItems(items)
      })
      .catch((err) => console.error("[API] ❌ Mobile home vehicles fetch failed:", err))

    return () => {
      cancelled = true
    }
  }, [])

  function matchesQuery(item: ListingItem, term: string, cat: string): boolean {
    const t = term.trim().toLowerCase()

    if (cat) {
      const isVehicleCat = cat === "Vehicle"
      const itemType = (item.type || "").toLowerCase()
      const itemListingType = (item.listingType || "").toLowerCase()
      const itemTitle = (item.title || "").toLowerCase()
      const matchesType = isVehicleCat
        ? itemType === "vehicle"
        : itemType === cat.toLowerCase() ||
          itemListingType.includes(cat.toLowerCase()) ||
          itemTitle.includes(cat.toLowerCase())
      if (!matchesType) return false
    }

    if (!t) return true

    const searchable = [
      item.title,
      item.location,
      item.listingType,
      item.type,
      item.priceType,
      item.price ? String(item.price) : "",
      item.beds ? `bed ${item.beds}` : "",
      item.beds ? String(item.beds) : "",
      item.baths ? `bath ${item.baths}` : "",
      item.baths ? String(item.baths) : "",
      item.area ? `area ${item.area}` : "",
      item.area ? String(item.area) : "",
      item.year ? String(item.year) : "",
      item.mileage ? String(item.mileage) : "",
      ...(item.features || []),
    ]
      .join(" ")
      .toLowerCase()

    return searchable.includes(t)
  }

  const visibleHouseItems = useMemo(() => {
    const cat = category
    return houseItems.filter((item) => matchesQuery(item, query, cat))
  }, [houseItems, query, category])

  const visibleVehicleItems = useMemo(() => {
    const cat = category
    if (cat && cat !== "Vehicle") return []
    return vehicleItems.filter((item) => matchesQuery(item, query, ""))
  }, [vehicleItems, query, category])

  return (
    <div className="min-h-screen bg-white">
      <MobileHeader onSearch={setQuery} onCategory={setCategory} />
      <main>
        <ServiceCards />
        <ImageSection title={t("buy_or_sell_house")} items={visibleHouseItems} />
        <ImageSection title={t("buy_or_sell_vehicle")} items={visibleVehicleItems} />
      </main>
    </div>
  )
}
