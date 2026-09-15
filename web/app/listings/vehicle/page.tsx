import type { Metadata } from "next"
import { Suspense } from "react"

import VehicleListingPageWrapper from "./vehicle-listing"
import { getSiteUrl } from "@/lib/site-url"

const site = getSiteUrl()





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