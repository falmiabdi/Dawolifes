"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Search, X } from "lucide-react"
import { categories } from "@/lib/data"

interface SearchSummaryProps {
  anchor: string
  type: "property" | "vehicle"
  count?: number
}

export function SearchSummary({ anchor, type, count }: SearchSummaryProps) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const term = params.get("search") || ""
  const cats = (params.get("category") || "").split(",").filter(Boolean)
  const activeCats =
    type === "property" ? cats.filter((c) => c !== "cars") : cats.filter((c) => c === "cars")
  const isActive = term.trim() !== "" || activeCats.length > 0

  if (!isActive) return null

  function push(catsNext: string[], termNext: string) {
    const sp = new URLSearchParams()
    if (termNext) sp.set("search", termNext)
    if (catsNext.length) sp.set("category", catsNext.join(","))
    const qs = sp.toString()
    router.push(`${pathname}${qs ? `?${qs}` : ""}#${anchor}`)
  }

  function removeCat(key: string) {
    push(cats.filter((c) => c !== key), term)
  }

  function clearAll() {
    push([], "")
  }

  return (
    <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:mt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-foreground">
            <Search className="h-4 w-4 text-primary" />
            {term ? (
              <span>
                Results for <span className="text-primary">“{term}”</span>
              </span>
            ) : (
              <span>{type === "property" ? "All properties" : "All vehicles"}</span>
            )}
            {typeof count === "number" && (
              <span className="font-semibold text-muted-foreground">({count})</span>
            )}
          </span>

          {activeCats.map((key) => {
            const label = categories.find((c) => c.key === key)?.label || key
            return (
              <button
                key={key}
                onClick={() => removeCat(key)}
                title={`Remove ${label}`}
                className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground transition hover:opacity-80"
              >
                {label}
                <X className="h-3 w-3" />
              </button>
            )
          })}
        </div>

        <button
          onClick={clearAll}
          className="text-xs font-bold text-muted-foreground underline underline-offset-2 transition hover:text-primary"
        >
          Clear all
        </button>
      </div>
    </div>
  )
}
