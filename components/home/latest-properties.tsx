import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { properties } from "@/lib/data"
import { PropertyCard } from "@/components/property-card"

export function LatestProperties() {
  return (
    <section id="listings" className="bg-muted/40 py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Latest Properties</h2>
            <p className="mt-1 text-sm text-muted-foreground">Newly listed homes and lands across Ethiopia</p>
          </div>
          <Link
            href="#listings"
            className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      </div>
    </section>
  )
}
