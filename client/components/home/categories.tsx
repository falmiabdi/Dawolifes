import { Building, Building2, Car, Home, Hotel, Store, Trees } from "lucide-react"
import { categories } from "@/lib/data"

const iconMap = {
  Home,
  Building2,
  Trees,
  Store,
  Hotel,
  Building,
  Car,
} as const

export function Categories() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">See The 3D View</h2>
        <p className="mt-1 text-sm text-muted-foreground">Browse by property type across Ethiopia</p>
      </div>

      <div className="mt-8 -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0 sm:pb-0">
        {categories.map((cat) => {
          const Icon = iconMap[cat.icon as keyof typeof iconMap]
          return (
            <button
              key={cat.key}
              className="group flex shrink-0 items-center gap-2.5 rounded-full border border-border bg-card px-5 py-3 transition-all hover:border-primary hover:shadow-md sm:shrink"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="h-4.5 w-4.5" />
              </span>
              <span className="whitespace-nowrap text-sm font-semibold text-foreground">{cat.label}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
