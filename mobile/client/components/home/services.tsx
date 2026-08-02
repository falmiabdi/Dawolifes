import { Building2, Headphones, LayoutGrid, MapPin, Search, Users } from "lucide-react"
import { services } from "@/lib/data"

const iconMap = {
  LayoutGrid,
  Headphones,
  Search,
  MapPin,
  Users,
  Building2,
} as const

export function Services() {
  return (
    <section id="services" className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">Our Services</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Everything you need to buy, sell, or rent property in Ethiopia
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => {
          const Icon = iconMap[service.icon as keyof typeof iconMap]
          return (
            <div
              key={service.title}
              className="rounded-2xl border border-border bg-card p-6 text-center transition-all hover:shadow-md"
            >
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-6 w-6" />
              </span>
              <h3 className="mt-4 text-base font-semibold text-foreground">{service.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{service.description}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
