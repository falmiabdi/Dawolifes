import Link from "next/link"
import Image from "next/image"
import { BedDouble, MapPin, Phone, Ruler, CheckCircle2 } from "lucide-react"
import { type Property, formatPrice } from "@/lib/data"
import { buttonVariants } from "@/components/ui/button"

export function PropertyCard({ property }: { property: Property }) {
  const isRent = property.listingType === "For Rent"
  return (
    <article className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={property.images[0] || "/placeholder.svg"}
          alt={property.title}
          fill
          sizes="(max-width: 768px) 100vw, 400px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span
          className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold text-white ${
            isRent ? "bg-accent" : "bg-primary"
          }`}
        >
          {property.listingType}
        </span>
      </div>

      <div className="p-4">
        <p className="text-lg font-bold text-primary">
          {formatPrice(property.price)} ETB
          {isRent && <span className="text-xs font-medium text-muted-foreground"> /mo</span>}
        </p>
        <h3 className="mt-1 truncate text-base font-semibold text-foreground">{property.title}</h3>
        <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          {property.subCity}, {property.city}
        </p>

        <div className="mt-3 flex items-center gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Ruler className="h-3.5 w-3.5" /> {property.area} m²
          </span>
          {property.bedrooms > 0 && (
            <span className="flex items-center gap-1">
              <BedDouble className="h-3.5 w-3.5" /> {property.bedrooms} Beds
            </span>
          )}
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-success" /> {property.condition}
          </span>
        </div>

        <div className="mt-4 space-y-2">
          <Link
            href={`/listings/view?id=${property.id}`}
            className={buttonVariants({ variant: "secondary", className: "w-full rounded-lg" })}
          >
            View Details
          </Link>
          <a
            href={`tel:${property.agent.phone}`}
            className={buttonVariants({ className: "w-full rounded-lg" })}
          >
            <Phone className="h-4 w-4" /> Call Now — DelaInfo
          </a>
        </div>
      </div>
    </article>
  )
}
