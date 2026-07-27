import Link from "next/link"
import Image from "next/image"
import { MapPin, Fuel, Gauge, Calendar, Users, Settings, CheckCircle2 } from "lucide-react"
import { type Vehicle, formatPrice } from "@/lib/data"
import { buttonVariants } from "@/components/ui/button"

export function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
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
          className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold text-white ${
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
      </div>

      <div className="p-4">
        <p className="text-lg font-bold text-primary">
          {formatPrice(vehicle.price)} ETB
          {isRent && vehicle.priceType === "per month" && <span className="text-xs font-medium text-muted-foreground"> /mo</span>}
        </p>
        <h3 className="mt-1 truncate text-base font-semibold text-foreground">{vehicle.title}</h3>
        <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          {vehicle.subCity ? `${vehicle.subCity}, ` : ''}{vehicle.city}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-border pt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" /> {vehicle.manufacturingYear}
          </span>
          {vehicle.mileage !== undefined && (
            <span className="flex items-center gap-1">
              <Gauge className="h-3.5 w-3.5" /> {vehicle.mileage.toLocaleString()} km
            </span>
          )}
          {vehicle.fuelType && (
            <span className="flex items-center gap-1">
              <Fuel className="h-3.5 w-3.5" /> {vehicle.fuelType}
            </span>
          )}
          {vehicle.transmission && (
            <span className="flex items-center gap-1">
              <Settings className="h-3.5 w-3.5" /> {vehicle.transmission}
            </span>
          )}
          {vehicle.seatingCapacity && (
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> {vehicle.seatingCapacity} seats
            </span>
          )}
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-success" /> {vehicle.condition}
          </span>
        </div>

        <div className="mt-4 space-y-2">
          <Link
            href={`/listings/vehicle?id=${vehicle.id}`}
            className={buttonVariants({ variant: "secondary", className: "w-full rounded-lg" })}
          >
            View Details
          </Link>
        </div>
      </div>
    </article>
  )
}
