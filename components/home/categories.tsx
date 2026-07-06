import { Building, Building2, Home, Hotel, Store, Trees } from "lucide-react"
import { categories } from "@/lib/data"

const iconMap = {
  Home,
  Building2,
  Trees,
  Store,
  Hotel,
  Building,
} as const

export function Categories() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">See The 3D View</h2>
        <p className="mt-1 text-sm text-muted-foreground">Browse by property type across Ethiopia</p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {categories.map((cat) => {
          const Icon = iconMap[cat.icon as keyof typeof iconMap]
          return (
            <button
              key={cat.key}
              className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary hover:shadow-md"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="h-6 w-6" />
              </span>
              <span className="text-sm font-semibold text-foreground">{cat.label}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
