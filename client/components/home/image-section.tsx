import Link from "next/link"
import Image from "next/image"
import { BedDouble, Bath, MapPin, Ruler, Calendar, Gauge } from "lucide-react"
import { formatPrice } from "@/lib/data"

export interface ListingItem {
  id: string
  image: string
  href: string
  title: string
  listingType: string
  price: number
  priceType?: string
  location: string
  type?: string
  beds?: number
  baths?: number
  area?: number
  year?: number
  mileage?: number
  features?: string[]
}

interface ImageSectionProps {
  title: string
  items: ListingItem[]
}

function isRent(item: ListingItem): boolean {
  const type = item.listingType?.toLowerCase() ?? ""
  return type.includes("rent") || type.includes("both")
}

export function ImageSection({ title, items }: ImageSectionProps) {
  return (
    <section className="bg-white px-4 pt-6">
      <h2 className="text-center text-base font-bold text-[#F97316]">{title}</h2>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {items.map((item) => {
          const rent = isRent(item)
          return (
            <Link
              key={item.id}
              href={item.href}
              className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-transform active:scale-[0.98]"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(max-width: 768px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span
                  className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white ${
                    rent ? "bg-accent" : "bg-[#F97316]"
                  }`}
                >
                  {item.listingType}
                </span>
              </div>

              <div className="p-2.5">
                <p className="truncate text-sm font-bold text-[#F97316]">
                  {formatPrice(item.price)} ETB
                  {rent && <span className="text-[10px] font-medium text-muted-foreground"> /mo</span>}
                </p>
                <h3 className="mt-1 line-clamp-1 text-xs font-semibold text-foreground">{item.title}</h3>
                <p className="mt-1 flex items-center gap-1 truncate text-[11px] text-muted-foreground">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {item.location}
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 border-t border-border pt-1.5 text-[10px] text-muted-foreground">
                  {item.beds !== undefined && item.beds > 0 && (
                    <span className="flex items-center gap-1">
                      <BedDouble className="h-3 w-3" /> {item.beds}
                    </span>
                  )}
                  {item.baths !== undefined && item.baths > 0 && (
                    <span className="flex items-center gap-1">
                      <Bath className="h-3 w-3" /> {item.baths}
                    </span>
                  )}
                  {item.area !== undefined && item.area > 0 && (
                    <span className="flex items-center gap-1">
                      <Ruler className="h-3 w-3" /> {item.area} m²
                    </span>
                  )}
                  {item.year !== undefined && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {item.year}
                    </span>
                  )}
                  {item.mileage != null && item.mileage > 0 && (
                    <span className="flex items-center gap-1">
                      <Gauge className="h-3 w-3" /> {item.mileage.toLocaleString()} km
                    </span>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
