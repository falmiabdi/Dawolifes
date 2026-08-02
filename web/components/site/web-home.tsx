"use client"

import { SiteHeader } from "@/components/site-header"
import { WebHero } from "@/components/site/web-hero"
import { Services } from "@/components/home/services"
import { LatestProperties } from "@/components/home/latest-properties"
import { LatestVehicles } from "@/components/home/latest-vehicles"
import { Categories } from "@/components/home/categories"
import { MapBanner } from "@/components/home/map-banner"
import { WebFooter } from "@/components/site/web-footer"

export function WebHome() {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <main>
        <WebHero />
        <LatestProperties />
        <Services />
        <LatestVehicles />
        <Categories />
        <MapBanner />
      </main>
      <WebFooter />
    </div>
  )
}
