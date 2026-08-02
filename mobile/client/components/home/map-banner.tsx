import { Map } from "lucide-react"
import { Button } from "@/components/ui/button"

export function MapBanner() {
  return (
    <section id="map" className="bg-primary py-14 text-primary-foreground">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/15">
          <Map className="h-6 w-6" />
        </span>
        <h2 className="mt-4 text-2xl font-bold">Explore Properties on the Map</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-primary-foreground/85">
          See all listings across Ethiopia on an interactive map. Click any marker to preview the property.
        </p>
        <Button variant="secondary" className="mt-6 rounded-full font-semibold">
          <Map className="h-4 w-4" /> Open Map View
        </Button>
      </div>
    </section>
  )
}
