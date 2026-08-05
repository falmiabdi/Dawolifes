"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Building2, Car, MapPin, ArrowRight, Sparkles } from "lucide-react"
import { getApiUrl, getImageUrl } from "@/lib/get-api-url"
import { formatPrice } from "@/lib/data"

type FeedItem = {
  id: string
  title: string
  price: number
  priceType?: string
  city: string
  subCity?: string
  image: string
  listingType: string
  meta?: string
}

export function HeroFeed() {
  const [homes, setHomes] = useState<FeedItem[]>([])
  const [vehicles, setVehicles] = useState<FeedItem[]>([])
  const [tab, setTab] = useState<"homes" | "vehicles">("homes")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const pickImage = (images: any, fallback: string) =>
      images && images.length > 0 ? getImageUrl(images[0]) : fallback

    Promise.all([
      fetch(`${getApiUrl()}/api/properties?limit=6`)
        .then(async (res) => {
          if (!res.ok) throw new Error('Failed to fetch properties')
          return res.json()
        }),
      fetch(`${getApiUrl()}/api/vehicles?limit=6`)
        .then(async (res) => {
          if (!res.ok) throw new Error('Failed to fetch vehicles')
          return res.json()
        }),
    ])
      .then(([p, v]) => {
        if (cancelled) return
        setHomes(
          (Array.isArray(p?.properties) ? p.properties : [])
            .filter((x: any) => x?.status !== 'Rejected' && x?.status !== 'Draft')
            .map((x: any) => ({
              id: x.id,
              title: x.title,
              price: x.price,
              priceType: x.priceType,
              city: x.city || '',
              subCity: x.subCity || '',
              image: pickImage(x.images, '/placeholder.svg'),
              listingType: x.listingType || 'For Sale',
              meta: x.bedrooms ? `${x.bedrooms} Beds` : x.area ? `${x.area} m²` : undefined,
            }))
        )
        setVehicles(
          (Array.isArray(v?.vehicles) ? v.vehicles : [])
            .filter((x: any) => x?.status !== 'Rejected' && x?.status !== 'Draft')
            .map((x: any) => ({
              id: x.id,
              title: x.title || `${x.make || ''} ${x.vehicleModel || ''}`.trim(),
              price: x.price,
              priceType: x.priceType,
              city: x.city || '',
              subCity: x.subCity || '',
              image: pickImage(x.images, '/placeholder.svg'),
              listingType: x.listingType || 'For Sale',
              meta: x.manufacturingYear ? `${x.manufacturingYear}` : undefined,
            }))
        )
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const items = tab === 'homes' ? homes : vehicles
  const empty = !loading && items.length === 0

  return (
    <div className="w-full rounded-3xl border border-white/10 bg-white/[0.07] p-4 shadow-2xl backdrop-blur-xl sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-white">
          <Sparkles className="h-4 w-4 text-primary" />
          Recent Listings
        </h3>
        <div className="flex rounded-full border border-white/15 bg-black/20 p-1">
          <button
            type="button"
            onClick={() => setTab('homes')}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              tab === 'homes' ? 'bg-primary text-white' : 'text-white/70 hover:text-white'
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            Homes
          </button>
          <button
            type="button"
            onClick={() => setTab('vehicles')}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              tab === 'vehicles' ? 'bg-primary text-white' : 'text-white/70 hover:text-white'
            }`}
          >
            <Car className="h-3.5 w-3.5" />
            Vehicles
          </button>
        </div>
      </div>

      <motion.div
        key={tab}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
        className="mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 no-scrollbar"
      >
        <AnimatePresence mode="popLayout">
          {items.map((item, i) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.96 }}
              transition={{ delay: i * 0.07, duration: 0.4, ease: 'easeOut' }}
              className="w-44 shrink-0 snap-start"
            >
              <HeroCard item={item} type={tab} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {empty && (
        <p className="mt-4 rounded-xl border border-white/10 bg-black/20 px-4 py-5 text-center text-sm text-white/60">
          No recent listings yet. Check back soon.
        </p>
      )}

      <Link
        href={tab === 'homes' ? '/#listings' : '/#vehicles'}
        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
      >
        View all {tab === 'homes' ? 'properties' : 'vehicles'}
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  )
}

function HeroCard({ item, type }: { item: FeedItem; type: 'homes' | 'vehicles' }) {
  const href = type === 'homes' ? `/listings/view?id=${item.id}` : `/listings/vehicle?id=${item.id}`
  const isRent = item.listingType === 'For Rent' || item.listingType === 'Both'

  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-2xl border border-white/10 bg-white/10 text-white transition-all hover:border-primary/60 hover:bg-white/20"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={item.image}
          alt={item.title}
          fill
          sizes="176px"
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
          {item.listingType}
        </span>
      </div>
      <div className="p-3">
        <p className="truncate text-sm font-extrabold text-primary">
          {formatPrice(item.price)} ETB
          {isRent && <span className="text-[10px] font-medium text-white/60"> /mo</span>}
        </p>
        <h4 className="mt-0.5 line-clamp-2 min-h-[2.5rem] text-xs font-semibold leading-snug">{item.title}</h4>
        <p className="mt-1 flex items-center gap-1 truncate text-[10px] text-white/60">
          <MapPin className="h-3 w-3 shrink-0" />
          {item.subCity ? `${item.subCity}, ` : ''}
          {item.city || 'Ethiopia'}
        </p>
      </div>
    </Link>
  )
}
