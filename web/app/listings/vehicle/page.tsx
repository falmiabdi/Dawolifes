import type { Metadata } from "next"
import { Suspense } from "react"

import VehicleListingPageWrapper from "./vehicle-listing"
import { getSiteUrl } from "@/lib/site-url"

const site = getSiteUrl()

// Static-export app (`output: "export"`): there is no runtime server, so the
// listing is resolved fully client-side from the `?id=` query string. The
// client component uses useSearchParams(), which must sit inside a Suspense
// boundary while the route is pre-rendered.
export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: "DawoLife — Ethiopia's Digital Real Estate Marketplace",
  alternates: { canonical: `${site}/listings/vehicle` },
  openGraph: {
    type: "website",
    url: `${site}/listings/vehicle`,
    siteName: "DawoLife",
    title: "DawoLife — Ethiopia's Digital Real Estate Marketplace",
  },
}

export default function VehicleListingRoute() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <VehicleListingPageWrapper />
    </Suspense>
  )
}