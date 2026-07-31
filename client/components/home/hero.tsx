"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Building2, MapPin, Search, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
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

export function Hero() {
  const [recentProperties, setRecentProperties] = useState<RecentProperty[]>(fallbackProperties)

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

  const marqueeItems = [...recentProperties, ...recentProperties, ...recentProperties]

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

          <form className="mt-4 max-w-lg rounded-2xl bg-card p-2 shadow-xl sm:mt-5 sm:p-3 lg:mt-6">
            <div className="flex flex-col gap-1.5 sm:gap-2">
              <div className="flex items-center gap-2 rounded-xl bg-muted px-3">
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="City, Woreda, Location"
                  className="w-full bg-transparent py-2.5 text-sm outline-none placeholder:text-muted-foreground sm:py-3"
                />
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-muted px-3">
                <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Region"
                  className="w-full bg-transparent py-2.5 text-sm outline-none placeholder:text-muted-foreground sm:py-3"
                />
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-muted px-3">
                <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Property Type"
                  className="w-full bg-transparent py-2.5 text-sm outline-none placeholder:text-muted-foreground sm:py-3"
                />
              </div>
            </div>
            <Button type="submit" className="mt-2 h-10 w-full rounded-xl text-sm font-semibold sm:h-12 sm:text-base">
              <Search className="h-5 w-5" /> Search Properties
            </Button>
          </form>

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
