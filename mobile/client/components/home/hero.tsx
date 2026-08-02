"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { BedDouble, Building2, Car, Clock, Home, Landmark, MapPin, Search, SlidersHorizontal, Store, Tractor, UserRound, Warehouse, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getApiUrl, getImageUrl } from "@/lib/get-api-url"

type RecentProperty = {
  id: string
  title: string
  images: string[]
  createdAt: Date
}

function timeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - new Date(date).getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 30) return `${diffDays}d ago`
  const diffMonths = Math.floor(diffDays / 30)
  return `${diffMonths}mo ago`
}

const fallbackProperties: RecentProperty[] = [
  { id: "1", title: "Mana Jireenyaa", images: ["/properties/villa-1.png"], createdAt: new Date() },
  { id: "2", title: "Sale House", images: ["/properties/house-2.png"], createdAt: new Date() },
  { id: "3", title: "Modern Bole Apartment", images: ["/properties/apartment-3.png"], createdAt: new Date() },
  { id: "4", title: "Luxury Villa", images: ["/properties/villa-5.png"], createdAt: new Date() },
  { id: "5", title: "Commercial Space", images: ["/properties/commercial-6.png"], createdAt: new Date() },
]

const propertyCategories = [
  { key: "house", label: "House", icon: Home },
  { key: "apartment", label: "Apartment", icon: Building2 },
  { key: "villa", label: "Villa", icon: Home },
  { key: "commercial", label: "Commercial", icon: Store },
  { key: "office", label: "Office", icon: Building2 },
  { key: "land", label: "Land", icon: Landmark },
  { key: "farm", label: "Farm", icon: Tractor },
  { key: "warehouse", label: "Warehouse", icon: Warehouse },
  { key: "vehicle", label: "Vehicle", icon: Car },
] as const

type FilterState = {
  search: string
  category: string
  listingType: string
  city: string
  region: string
  bedrooms: string
  bathrooms: string
  minPrice: string
  maxPrice: string
  ownerType: string
  vehicleMake: string
  vehicleModel: string
  fuelType: string
  transmission: string
  year: string
  mileage: string
}

export function Hero() {
  const router = useRouter()
  const pathname = usePathname()
  const [recentProperties, setRecentProperties] = useState<RecentProperty[]>(fallbackProperties)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    category: "",
    listingType: "",
    city: "",
    region: "",
    bedrooms: "",
    bathrooms: "",
    minPrice: "",
    maxPrice: "",
    ownerType: "",
    vehicleMake: "",
    vehicleModel: "",
    fuelType: "",
    transmission: "",
    year: "",
    mileage: "",
  })

  useEffect(() => {
    fetch(`${getApiUrl()}/api/properties?status=Approved`)
      .then((res) => res.json())
      .then((data) => {
        const docs = (data.properties || []).slice(0, 5)
        setRecentProperties(
          docs.map((p: any) => ({
            id: p.id,
            title: p.title,
            images: p.images && p.images.length > 0 ? p.images.map((img: string) => getImageUrl(img)) : ["/placeholder.svg"],
            createdAt: p.createdAt,
          }))
        )
      })
      .catch((err) => console.error('[API] ❌ Hero properties fetch failed:', err))
  }, [])

  useEffect(() => {
    document.body.style.overflow = sheetOpen ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [sheetOpen])

  const selectedCategoryLabel = useMemo(
    () => propertyCategories.find((item) => item.key === filters.category)?.label,
    [filters.category]
  )

  const summaryText = useMemo(() => {
    if (filters.search.trim()) return filters.search.trim()
    if (filters.city.trim()) return filters.city.trim()
    if (filters.region.trim()) return filters.region.trim()
    if (selectedCategoryLabel) return selectedCategoryLabel
    return ""
  }, [filters.search, filters.city, filters.region, selectedCategoryLabel])

  const isVehicleCategory = filters.category === "vehicle"
  const marqueeItems = [...recentProperties, ...recentProperties, ...recentProperties]
  const updateFilter = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handleSearch = () => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      const clean = value.trim()
      if (clean) params.set(key, clean)
    })
    const query = params.toString()
    const hash = isVehicleCategory ? "#vehicles" : "#listings"
    router.push(`${pathname}${query ? `?${query}` : ""}${hash}`)
    setSheetOpen(false)
  }

  return (
    <section className="relative min-h-[360px] overflow-hidden bg-secondary sm:min-h-[480px] lg:min-h-[700px]">
      <video
        autoPlay
        muted
        loop
        playsInline
        poster="/properties/hero-bg.png"
        className="absolute inset-0 h-full w-full object-cover lg:left-1/2 lg:w-1/2"
      >
        <source src="https://res.cloudinary.com/y7q39zm5/video/upload/v1783767160/sytelecity_background_uu31gf.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-secondary/80 lg:w-1/2 lg:bg-secondary lg:shadow-[8px_0_30px_rgba(0,0,0,0.3)]" />

      <div className="relative z-10 mx-auto grid max-w-7xl lg:grid-cols-2">
        <div className="relative z-10 flex flex-col justify-center px-4 pb-6 pt-8 sm:px-8 sm:pb-8 sm:pt-14 lg:pb-12 lg:pt-20">
          <h1 className="text-balance text-2xl font-extrabold leading-tight text-white sm:text-3xl md:text-4xl lg:text-6xl">
            Find Homes for Sale &amp; Rent{" "}
            <span className="text-primary">in Ethiopia</span>
          </h1>
          <p className="mt-2 max-w-xl text-pretty text-xs leading-relaxed text-white/70 sm:mt-3 sm:text-sm lg:mt-4 lg:text-base">
            Discover the best homes, luxury apartments, and commercial properties in Oromia,
            Addis Ababa, Shaggar and beyond.
          </p>

          <div className="mt-4 lg:mt-6">
            <div className="sticky top-16 z-30 lg:static">
              <button
                type="button"
                onClick={() => setSheetOpen(true)}
                className="flex w-full max-w-xl items-center gap-3 rounded-[24px] border border-primary/20 bg-white/95 px-4 py-3.5 text-left shadow-[0_12px_30px_rgba(15,23,42,0.18)] backdrop-blur-sm transition hover:shadow-[0_14px_34px_rgba(15,23,42,0.22)] sm:px-5 sm:py-4"
                aria-label="Open search filters"
              >
                <Search className="h-5 w-5 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm ${summaryText ? "text-foreground" : "text-muted-foreground"}`}>
                    {summaryText || "Search properties, vehicles, city, region..."}
                  </p>
                </div>
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <SlidersHorizontal className="h-4 w-4" />
                </span>
              </button>
            </div>
          </div>

          <AnimatePresence>
            {sheetOpen && (
              <>
                <motion.button
                  type="button"
                  aria-label="Close search filters"
                  className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[2px]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSheetOpen(false)}
                />
                <motion.div
                  className="fixed inset-x-0 bottom-0 z-50 max-h-[88vh] overflow-y-auto rounded-t-3xl border border-border bg-background"
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", stiffness: 260, damping: 28 }}
                >
                  <div className="mx-auto w-full max-w-2xl p-4 pb-24 sm:p-6 sm:pb-24">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-foreground">Search Filters</h3>
                      <button
                        type="button"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground"
                        onClick={() => setSheetOpen(false)}
                        aria-label="Close filters"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mb-4 rounded-2xl border border-border bg-card p-2 sm:p-3">
                      <div className="flex items-center gap-2 rounded-xl border border-input bg-background px-3 sm:rounded-2xl">
                        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <Input
                          value={filters.search}
                          onChange={(e) => updateFilter("search", e.target.value)}
                          placeholder="Search properties, vehicles, city, region..."
                          className="h-12 border-0 bg-transparent px-0 text-base shadow-none focus-visible:ring-0 sm:h-11 sm:text-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-5">
                      <section>
                        <p className="mb-2 text-sm font-semibold text-foreground">Categories</p>
                        <div className="grid grid-cols-3 gap-2">
                          {propertyCategories.map(({ key, label, icon: Icon }) => (
                            <button
                              key={key}
                              type="button"
                              onClick={() => updateFilter("category", filters.category === key ? "" : key)}
                              className={`flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border px-2 py-2 text-xs font-medium transition ${
                                filters.category === key
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border bg-muted/40 text-foreground/80"
                              }`}
                            >
                              <Icon className="h-3.5 w-3.5" />
                              {label}
                            </button>
                          ))}
                        </div>
                      </section>

                      <section>
                        <p className="mb-2 text-sm font-semibold text-foreground">Listing Type</p>
                        <div className="grid grid-cols-2 gap-2">
                          {["Rent", "Sale"].map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => updateFilter("listingType", filters.listingType === type ? "" : type)}
                              className={`min-h-[44px] rounded-xl border px-3 py-2 text-sm font-medium transition ${
                                filters.listingType === type
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border bg-muted/40 text-foreground/80"
                              }`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </section>

                      <section>
                        <p className="mb-2 text-sm font-semibold text-foreground">Location & Property</p>
                        <div className="grid grid-cols-2 gap-2">
                          <Input placeholder="City" value={filters.city} onChange={(e) => updateFilter("city", e.target.value)} />
                          <Input placeholder="Region" value={filters.region} onChange={(e) => updateFilter("region", e.target.value)} />
                          <Input placeholder="Bedrooms" inputMode="numeric" value={filters.bedrooms} onChange={(e) => updateFilter("bedrooms", e.target.value)} />
                          <Input placeholder="Bathrooms" inputMode="numeric" value={filters.bathrooms} onChange={(e) => updateFilter("bathrooms", e.target.value)} />
                          <Input placeholder="Min Price" inputMode="numeric" value={filters.minPrice} onChange={(e) => updateFilter("minPrice", e.target.value)} />
                          <Input placeholder="Max Price" inputMode="numeric" value={filters.maxPrice} onChange={(e) => updateFilter("maxPrice", e.target.value)} />
                          <div className="col-span-2 relative">
                            <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <select
                              value={filters.ownerType}
                              onChange={(e) => updateFilter("ownerType", e.target.value)}
                              className="h-10 w-full rounded-lg border border-input bg-transparent pl-9 pr-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                            >
                              <option value="">Owner Type</option>
                              <option value="owner">Owner</option>
                              <option value="agent">Agent</option>
                              <option value="farmer">Farmer</option>
                            </select>
                          </div>
                        </div>
                      </section>

                      {isVehicleCategory && (
                        <section>
                          <p className="mb-2 text-sm font-semibold text-foreground">Vehicle Filters</p>
                          <div className="grid grid-cols-2 gap-2">
                            <Input placeholder="Make" value={filters.vehicleMake} onChange={(e) => updateFilter("vehicleMake", e.target.value)} />
                            <Input placeholder="Model" value={filters.vehicleModel} onChange={(e) => updateFilter("vehicleModel", e.target.value)} />
                            <Input placeholder="Fuel Type" value={filters.fuelType} onChange={(e) => updateFilter("fuelType", e.target.value)} />
                            <Input placeholder="Transmission" value={filters.transmission} onChange={(e) => updateFilter("transmission", e.target.value)} />
                            <Input placeholder="Year" inputMode="numeric" value={filters.year} onChange={(e) => updateFilter("year", e.target.value)} />
                            <Input placeholder="Mileage" inputMode="numeric" value={filters.mileage} onChange={(e) => updateFilter("mileage", e.target.value)} />
                          </div>
                        </section>
                      )}
                    </div>
                  </div>

                  <div className="sticky bottom-0 border-t border-border bg-background/95 p-3 backdrop-blur sm:p-4">
                    <Button
                      type="button"
                      onClick={handleSearch}
                      className="h-12 w-full rounded-2xl text-base font-semibold"
                    >
                      Search
                    </Button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          <div className="mt-5 sm:mt-6 lg:mt-8">
            <p className="mb-2 text-[10px] font-medium uppercase tracking-widest text-white/50 sm:mb-3 sm:text-xs">
              Recently Posted
            </p>
            <div className="marquee-track overflow-hidden">
              <div className="marquee-content flex gap-2 sm:gap-3">
                {marqueeItems.map((property, i) => (
                  <div
                    key={`${property.id}-${i}`}
                    className="group relative aspect-[4/3] w-28 shrink-0 overflow-hidden rounded-xl shadow-lg sm:w-36 md:w-40 lg:w-44"
                  >
                    <Image
                      src={property.images[0]}
                      alt={property.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-secondary/95 to-transparent p-1.5 pt-6 sm:p-2 sm:pt-7">
                      <p className="truncate text-[10px] font-semibold text-white sm:text-xs">{property.title}</p>
                      <span className="mt-0.5 inline-flex items-center gap-1 text-[9px] text-white/60 sm:text-[10px]">
                        <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        <span suppressHydrationWarning>{timeAgo(property.createdAt)}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="relative hidden items-center justify-center lg:flex">
          <div className="relative z-10 rounded-2xl border border-white/20 bg-white/10 px-6 py-4 text-center backdrop-blur-md">
            <p className="text-3xl font-bold text-white">360°</p>
            <p className="text-xs font-medium uppercase tracking-widest text-white/70">
              Virtual Tour
            </p>
          </div>

          <div className="absolute bottom-6 right-6 z-10 flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium text-white/80 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            Live Preview
          </div>
        </div>
      </div>
    </section>
  )
}
