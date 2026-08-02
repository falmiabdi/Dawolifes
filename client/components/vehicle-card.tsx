import Link from "next/link"
import Image from "next/image"
import { MapPin, Fuel, Gauge, Calendar, Users, Settings, CheckCircle2 } from "lucide-react"
import { type Vehicle, formatPrice } from "@/lib/data"
import { buttonVariants } from "@/components/ui/button"
import { SaveButton } from "@/components/save-button"

export function VehicleCard({
  vehicle,
  onSaveChange,
}: {
  vehicle: Vehicle
  onSaveChange?: (saved: boolean) => void
}) {
  const isRent = vehicle.listingType === "For Rent" || vehicle.listingType === "Both"
  return (
    <article className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={vehicle.images[0] || "/placeholder.svg"}
          alt={vehicle.title}
          fill
          sizes="(max-width: 768px) 100vw, 400px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span
          className={`absolute left-3 top-3 rounded-full px-3 py-1.5 text-xs font-semibold text-white ${
            vehicle.listingType === "For Sale" ? "bg-primary" : vehicle.listingType === "Both" ? "bg-purple-500" : "bg-accent"
          }`}
        >
          {vehicle.listingType}
        </span>
        {vehicle.condition && (
          <span className="absolute right-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
            {vehicle.condition}
          </span>
        )}
        <SaveButton
          itemType="vehicle"
          itemId={vehicle.id}
          className="absolute right-3 top-12"
          onChange={onSaveChange}
        />
      </div>

      <div className="p-4 sm:p-5">
        <p className="text-lg font-bold text-primary">
          {formatPrice(vehicle.price)} ETB
          {isRent && vehicle.priceType === "per month" && <span className="text-xs font-medium text-muted-foreground"> /mo</span>}
        </p>
        <h3 className="mt-1.5 line-clamp-2 text-base font-semibold text-foreground">{vehicle.title}</h3>
        <p className="mt-1.5 flex items-center gap-1 truncate text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 shrink-0" />
          {vehicle.subCity ? `${vehicle.subCity}, ` : ''}{vehicle.city}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" /> {vehicle.manufacturingYear}
          </span>
          {vehicle.mileage != null && vehicle.mileage > 0 && (
            <span className="flex items-center gap-1.5">
              <Gauge className="h-4 w-4" /> {vehicle.mileage.toLocaleString()} km
            </span>
          )}
          {vehicle.fuelType && (
            <span className="flex items-center gap-1.5">
              <Fuel className="h-4 w-4" /> {vehicle.fuelType}
            </span>
          )}
          {vehicle.transmission && (
            <span className="flex items-center gap-1.5">
              <Settings className="h-4 w-4" /> {vehicle.transmission}
            </span>
          )}
          {vehicle.seatingCapacity && (
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" /> {vehicle.seatingCapacity} seats
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-success" /> {vehicle.condition}
          </span>
        </div>

        <div className="mt-4 space-y-2.5">
          <Link
            href={`/listings/vehicle?id=${vehicle.id}`}
            className={buttonVariants({ variant: "secondary", className: "w-full rounded-xl min-h-[44px]" })}
          >
            View Details
          </Link>
        </div>
      </div>
    </article>
  )
}
