import type { Metadata } from "next"
import { Suspense } from "react"

import ListingPageWrapper from "./view-listing"
import { getSiteUrl } from "@/lib/site-url"

const site = getSiteUrl()

// Static-export app (`output: "export"`): there is no runtime server, so the
// listing is resolved fully client-side from the `?id=` query string. The
// client component uses useSearchParams(), which must sit inside a Suspense
// boundary while the route is pre-rendered.
export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: "DawoLife — Ethiopia's Digital Real Estate Marketplace",
  alternates: { canonical: `${site}/listings/view` },
  openGraph: {
    type: "website",
    url: `${site}/listings/view`,
    siteName: "DawoLife",
    title: "DawoLife — Ethiopia's Digital Real Estate Marketplace",
  },
}

export default function PropertyListingRoute() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <ListingPageWrapper />
    </Suspense>
  )
}