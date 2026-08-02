import { SiteHeader } from "@/components/site-header"
import { Hero } from "@/components/home/hero"
import { Categories } from "@/components/home/categories"
import { LatestProperties } from "@/components/home/latest-properties"
import { LatestVehicles } from "@/components/home/latest-vehicles"
import { MapBanner } from "@/components/home/map-banner"
import { Services } from "@/components/home/services"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <Categories />
        <LatestProperties />
        <LatestVehicles />
        <MapBanner />
        <Services />
      </main>
    </div>
  )
}
