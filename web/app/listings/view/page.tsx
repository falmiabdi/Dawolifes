import type { Metadata } from "next"

import ListingPageWrapper from "./view-listing"
import { getSiteUrl } from "@/lib/site-url"
import { getApiBaseUrl, resolveApiImage } from "@/lib/server-api"

const site = getSiteUrl()

export default function PropertyListingRoute() {
  return <ListingPageWrapper />
}

function fallbackMetadata(canonical: string): Metadata {
  return {
    metadataBase: new URL(site),
    alternates: { canonical },
    title: "DawoLife — Ethiopia's Digital Real Estate Marketplace",
    openGraph: {
      type: "website",
      url: canonical,
      siteName: "DawoLife",
      title: "DawoLife — Ethiopia's Digital Real Estate Marketplace",
    },
  }
}

// Serves real OpenGraph tags (title/description/image/url) for the listing so
// Facebook, Telegram and WhatsApp show the property photo + info + the real
// dawolife.jebugeneraltrading.com page when the share link is posted.
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>
}): Promise<Metadata> {
  const { id } = await searchParams
  const canonical = `${site}/listings/view?id=${id ?? ''}`
  const fallback = fallbackMetadata(canonical)
  if (!id) return fallback

  try {
    const res = await fetch(`${getApiBaseUrl()}/api/properties/${id}`, {
      cache: 'no-store',
      next: { revalidate: 0 },
    })
    if (!res.ok) return fallback
    const { property } = await res.json()
    if (!property) return fallback

    const title = `${property.title || 'Property listing'} — DawoLife`
    const description = [
      property.listingType,
      [property.city, property.region].filter(Boolean).join(', '),
      property.price ? `${property.price} ETB` : '',
      property.description,
    ]
      .filter(Boolean)
      .join(' · ')
      .slice(0, 220)
    const images = Array.isArray(property.images)
      ? property.images.map(resolveApiImage).filter(Boolean)
      : []

    return {
      metadataBase: new URL(site),
      alternates: { canonical },
      title,
      description,
      openGraph: {
        type: 'article',
        url: canonical,
        siteName: 'DawoLife',
        title,
        description,
        images,
      },
      twitter: {
        card: images.length ? 'summary_large_image' : 'summary',
        title,
        description,
        images,
      },
    }
  } catch {
    return fallback
  }
}