import type { Metadata } from "next"

import VehicleListingPageWrapper from "./vehicle-listing"
import { getSiteUrl } from "@/lib/site-url"
import { getApiBaseUrl, resolveApiImage } from "@/lib/server-api"

const site = getSiteUrl()

export default function VehicleListingRoute() {
  return <VehicleListingPageWrapper />
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

// Real OpenGraph tags for vehicle listings (photo + info + real page URL) so
// Facebook, Telegram and WhatsApp show a rich preview when the link is shared.
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>
}): Promise<Metadata> {
  const { id } = await searchParams
  const canonical = `${site}/listings/vehicle?id=${id ?? ''}`
  const fallback = fallbackMetadata(canonical)
  if (!id) return fallback

  try {
    const res = await fetch(`${getApiBaseUrl()}/api/vehicles/${id}`, {
      cache: 'no-store',
      next: { revalidate: 0 },
    })
    if (!res.ok) return fallback
    const { vehicle } = await res.json()
    if (!vehicle) return fallback

    const title = `${vehicle.title || 'Vehicle listing'} — DawoLife`
    const price =
      (vehicle.listingType === 'For Rent' || vehicle.listingType === 'Both') && vehicle.monthlyRate
        ? `${vehicle.monthlyRate} ETB / month`
        : `${vehicle.price || ''} ETB`
    const description = [
      vehicle.listingType,
      [vehicle.make, vehicle.vehicleModel || vehicle.model].filter(Boolean).join(' '),
      vehicle.manufacturingYear ? String(vehicle.manufacturingYear) : '',
      [vehicle.city, vehicle.region].filter(Boolean).join(', '),
      price,
      vehicle.description,
    ]
      .filter(Boolean)
      .join(' · ')
      .slice(0, 220)
    const images = Array.isArray(vehicle.images)
      ? vehicle.images.map(resolveApiImage).filter(Boolean)
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