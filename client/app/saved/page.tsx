"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Bookmark, Loader2, Trash2 } from "lucide-react"
import { useAuth } from "@/components/auth/auth-guard"
import { SiteHeader } from "@/components/site-header"
import { PropertyCard } from "@/components/property-card"
import { VehicleCard } from "@/components/vehicle-card"
import { getApiUrl, getImageUrl } from "@/lib/get-api-url"

interface SavedEntry {
  itemType: "property" | "vehicle"
  itemId: string
  item: any
}

function mapProperty(p: any) {
  return {
    id: p.id,
    title: p.title,
    type: p.type,
    listingType: p.listingType,
    price: p.price,
    priceType: p.priceType,
    region: p.region,
    city: p.city,
    subCity: p.subCity || "",
    woreda: p.woreda || "",
    kebele: p.kebele || "",
    parcel: p.parcel || "",
    block: p.block || "",
    homeNo: p.homeNo || "",
    area: p.area || 0,
    bedrooms: p.bedrooms || 0,
    bathrooms: p.bathrooms || 0,
    condition: p.condition || "Finished",
    legalizedYear: p.legalizedYear || 2024,
    description: p.description || "",
    features: p.features || [],
    images: p.images && p.images.length > 0 ? p.images.map((img: string) => getImageUrl(img)) : ["/placeholder.svg"],
    agent: {
      id: p.agent?.id || p.agentId || "",
      name: p.agent?.username || p.agentName || "Agent",
      role: "Real Estate Agent",
      phone: p.displayPhone || p.agent?.phone || "+251 900 000 000",
      avatar: p.agent?.profilePhoto || "/placeholder-user.jpg",
    },
  }
}

function mapVehicle(v: any) {
  return {
    id: v.id,
    title: v.title || `${v.make || ""} ${v.vehicleModel || v.model || ""}`.trim(),
    listingType: v.listingType || "For Sale",
    vehicleCategory: v.vehicleCategory || "",
    make: v.make || "",
    model: v.vehicleModel || v.model || "",
    trimVersion: v.trimVersion || "",
    manufacturingYear: v.manufacturingYear || 2024,
    color: v.color || "",
    countryOfOrigin: v.countryOfOrigin || "",
    fuelType: v.fuelType || "",
    transmission: v.transmission || "",
    seatingCapacity: v.seatingCapacity || undefined,
    mileage: v.mileage || undefined,
    condition: v.condition || "Used",
    safetyFeatures: v.safetyFeatures || [],
    interiorFeatures: v.interiorFeatures || [],
    exteriorFeatures: v.exteriorFeatures || [],
    price: v.price || 0,
    priceType: v.priceType || "",
    region: v.region || "",
    city: v.city || "",
    subCity: v.subCity || "",
    features: v.features || [],
    images: v.images && v.images.length > 0 ? v.images.map((img: string) => getImageUrl(img)) : ["/placeholder.svg"],
    agent: {
      id: v.agent?.id || v.agentId || "",
      name: v.agent?.username || v.agentName || "Agent",
      role: "Vehicle Agent",
      phone: v.agent?.phone || "+251 900 000 000",
      avatar: v.agent?.profilePhoto || "/placeholder-user.jpg",
    },
  }
}

export default function SavedPage() {
  const { user, getToken } = useAuth()
  const [items, setItems] = useState<SavedEntry[]>([])
  const [loading, setLoading] = useState(true)

  const loadSaved = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }
    try {
      const token = await getToken()
      if (!token) {
        setLoading(false)
        return
      }
      const res = await fetch(`${getApiUrl()}/api/favorites`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      })
      if (res.ok) {
        const data = await res.json()
        setItems(data.items || [])
      }
    } catch {
      // silently ignore
    } finally {
      setLoading(false)
    }
  }, [user, getToken])

  useEffect(() => {
    loadSaved()
  }, [loadSaved])

  const handleRemoved = (itemId: string) => {
    setItems((prev) => prev.filter((entry) => entry.itemId !== itemId))
  }

  const removeSavedItem = useCallback(
    async (entry: SavedEntry) => {
      setItems((prev) => prev.filter((e) => e.itemId !== entry.itemId))
      try {
        const token = await getToken()
        const res = await fetch(`${getApiUrl()}/api/favorites`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: JSON.stringify({ itemType: entry.itemType, itemId: entry.itemId }),
        })
        if (!res.ok) {
          setItems((prev) => (prev.some((e) => e.itemId === entry.itemId) ? prev : [entry, ...prev]))
        }
      } catch {
        setItems((prev) => (prev.some((e) => e.itemId === entry.itemId) ? prev : [entry, ...prev]))
      }
    },
    [getToken]
  )

  const renderRemoveButton = (entry: SavedEntry) => (
    <button
      type="button"
      onClick={() => removeSavedItem(entry)}
      aria-label="Remove from saved"
      title="Remove from saved"
      className="absolute right-3 top-24 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-slate-500 shadow-sm ring-1 ring-black/5 transition hover:bg-red-50 hover:text-red-600 active:scale-95"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  )

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <div className="flex items-center gap-2">
            <Bookmark className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold text-foreground sm:text-2xl">Saved Items</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Properties and vehicles you&apos;ve bookmarked for later.
          </p>

          {!user ? (
            <div className="mt-16 flex flex-col items-center text-center">
              <Bookmark className="h-12 w-12 text-muted-foreground/30" />
              <p className="mt-4 text-lg font-semibold text-foreground">Sign in to see your saved items</p>
              <p className="mt-1 text-sm text-muted-foreground">Bookmark homes and cars to compare them later.</p>
              <Link
                href={`/login?redirect=${encodeURIComponent("/saved")}`}
                className="mt-6 inline-flex min-h-[44px] items-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              >
                Sign in
              </Link>
            </div>
          ) : loading ? (
            <div className="mt-16 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : items.length === 0 ? (
            <div className="mt-16 flex flex-col items-center text-center">
              <Bookmark className="h-12 w-12 text-muted-foreground/30" />
              <p className="mt-4 text-lg font-semibold text-foreground">Nothing saved yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Tap the bookmark on any property or vehicle to save it here.
              </p>
              <Link
                href="/"
                className="mt-6 inline-flex min-h-[44px] items-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              >
                Browse listings
              </Link>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((entry) => {
                const { itemType, itemId, item } = entry
                if (itemType === "property") {
                  const property = mapProperty(item)
                  return (
                    <div key={`${itemType}-${itemId}`} className="relative">
                      {renderRemoveButton(entry)}
                      <PropertyCard
                        property={property}
                        onSaveChange={(saved) => {
                          if (!saved) handleRemoved(itemId)
                        }}
                      />
                    </div>
                  )
                }
                const vehicle = mapVehicle(item)
                return (
                  <div key={`${itemType}-${itemId}`} className="relative">
                    {renderRemoveButton(entry)}
                    <VehicleCard
                      vehicle={vehicle}
                      onSaveChange={(saved) => {
                        if (!saved) handleRemoved(itemId)
                      }}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
