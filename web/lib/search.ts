export const PROPERTY_CATEGORY_KEYS = ["houses", "apartments", "land", "commercial", "villas"]
export const VEHICLE_CATEGORY_KEYS = ["cars"]

const CATEGORY_TYPES: Record<string, string[]> = {
  houses: ["House"],
  apartments: ["Apartment"],
  villas: ["Villa"],
  land: ["Land"],
  commercial: ["Commercial"],
}

export interface SearchFilters {
  term: string
  cats: string[]
}

export function parseSearchFilters(search: string | null, category: string | null): SearchFilters {
  return {
    term: (search || "").toLowerCase().trim(),
    cats: (category || "")
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean),
  }
}

function termMatches(term: string, values: Array<string | undefined | null>): boolean {
  if (!term) return true
  return values.some((v) => (v || "").toLowerCase().includes(term))
}

export function matchesProperty(
  p: { type?: string; title?: string; city?: string; region?: string; subCity?: string; description?: string },
  term: string,
  cats: string[]
): boolean {
  const propCats = cats.filter((c) => PROPERTY_CATEGORY_KEYS.includes(c))
  if (propCats.length > 0) {
    const types = propCats.flatMap((c) => CATEGORY_TYPES[c] || [])
    if (types.length > 0 && !types.some((t) => (p.type || "").toLowerCase() === t.toLowerCase())) {
      return false
    }
  }
  return termMatches(term, [p.title, p.city, p.region, p.subCity, p.description, p.type])
}

export function matchesVehicle(
  v: { title?: string; make?: string; model?: string; city?: string; region?: string; fuelType?: string },
  term: string,
  cats: string[]
): boolean {
  const propCats = cats.filter((c) => PROPERTY_CATEGORY_KEYS.includes(c))
  if (propCats.length > 0) return false
  return termMatches(term, [v.title, v.make, v.model, v.city, v.region, v.fuelType])
}
