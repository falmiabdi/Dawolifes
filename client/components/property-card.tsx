import Link from "next/link"
import Image from "next/image"
import { BedDouble, MapPin, Phone, Ruler, CheckCircle2 } from "lucide-react"
import { type Property, formatPrice } from "@/lib/data"
import { buttonVariants } from "@/components/ui/button"
import { SaveButton } from "@/components/save-button"

export function PropertyCard({
  property,
  onSaveChange,
}: {
  property: Property
  onSaveChange?: (saved: boolean) => void
}) {
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
          className={`absolute left-3 top-3 rounded-full px-3 py-1.5 text-xs font-semibold text-white ${
            isRent ? "bg-accent" : "bg-primary"
          }`}
        >
          {property.listingType}
        </span>
        <SaveButton
          itemType="property"
          itemId={property.id}
          className="absolute right-3 top-3"
          onChange={onSaveChange}
        />
      </div>

      <div className="p-4 sm:p-5">
        <p className="text-lg font-bold text-primary">
          {formatPrice(property.price)} ETB
          {isRent && <span className="text-xs font-medium text-muted-foreground"> /mo</span>}
        </p>
        <h3 className="mt-1.5 line-clamp-2 text-base font-semibold text-foreground">{property.title}</h3>
        <p className="mt-1.5 flex items-center gap-1 truncate text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 shrink-0" />
          {property.subCity}, {property.city}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Ruler className="h-4 w-4" /> {property.area} m²
          </span>
          {property.bedrooms > 0 && (
            <span className="flex items-center gap-1.5">
              <BedDouble className="h-4 w-4" /> {property.bedrooms} Beds
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-success" /> {property.condition}
          </span>
        </div>

        <div className="mt-4 space-y-2.5">
          <Link
            href={`/listings/view?id=${property.id}`}
            className={buttonVariants({ variant: "secondary", className: "w-full rounded-xl min-h-[44px]" })}
          >
            View Details
          </Link>
          <a
            href={`tel:${property.agent.phone}`}
            className={buttonVariants({ className: "w-full rounded-xl min-h-[44px]" })}
          >
            <Phone className="h-4 w-4" /> Call Now — DelaInfo
          </a>
        </div>
      </div>
    </article>
  )
}
