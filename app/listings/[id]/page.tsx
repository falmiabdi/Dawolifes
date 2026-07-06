import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import {
  BedDouble,
  Bath,
  CheckCircle2,
  ChevronRight,
  MapPin,
  Phone,
  Ruler,
  Share2,
  CalendarDays,
} from "lucide-react"
import { getProperty, formatPrice, properties } from "@/lib/data"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Gallery } from "@/components/listing/gallery"
import { PropertyCard } from "@/components/property-card"
import { Button, buttonVariants } from "@/components/ui/button"

export function generateStaticParams() {
  return properties.map((p) => ({ id: p.id }))
}

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const property = getProperty(id)
  if (!property) notFound()

  const isRent = property.listingType === "For Rent"
  const info: [string, string][] = [
    ["Type", property.type],
    ["Status", property.listingType],
    ["Region", property.region],
    ["City", property.city],
    ["Sub-city", property.subCity],
    ["Woreda", property.woreda],
    ["Kebele", property.kebele],
    ["Condition", property.condition],
    ["Year Built", String(property.yearBuilt)],
  ]
  const similar = properties.filter((p) => p.id !== property.id).slice(0, 3)

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <nav className="flex items-center gap-1 text-xs text-muted-foreground">
            <Link href="/" className="hover:text-primary">
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href="/#listings" className="hover:text-primary">
              Listings
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground">{property.title}</span>
          </nav>

          <div className="mt-5 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
            <div>
              <Gallery images={property.images} title={property.title} badge={property.listingType} />

              <div className="mt-6 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{property.title}</h1>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 text-primary" />
                    {property.subCity}, {property.woreda} · Parcel {property.parcel} · Block {property.block} · Home No{" "}
                    {property.homeNo}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-extrabold text-primary">{formatPrice(property.price)} ETB</p>
                  {isRent && <p className="text-xs text-muted-foreground">{property.priceType}</p>}
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat icon={<Ruler className="h-5 w-5" />} label="Area" value={`${property.area} m²`} />
                <Stat icon={<BedDouble className="h-5 w-5" />} label="Bedrooms" value={String(property.bedrooms)} />
                <Stat icon={<Bath className="h-5 w-5" />} label="Bathrooms" value={String(property.bathrooms)} />
                <Stat
                  icon={<CheckCircle2 className="h-5 w-5" />}
                  label="Condition"
                  value={property.condition}
                />
              </div>

              <section className="mt-8">
                <h2 className="text-lg font-semibold text-foreground">Description</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{property.description}</p>
              </section>

              <section className="mt-8">
                <h2 className="text-lg font-semibold text-foreground">Features</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {property.features.map((f) => (
                    <span
                      key={f}
                      className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm text-foreground"
                    >
                      <CheckCircle2 className="h-4 w-4 text-success" /> {f}
                    </span>
                  ))}
                </div>
              </section>

              <section className="mt-8">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  <MapPin className="h-5 w-5 text-primary" /> Property Location
                </h2>
                <div className="mt-3 flex aspect-[16/7] items-center justify-center rounded-2xl border border-border bg-muted text-sm text-muted-foreground">
                  <span className="flex flex-col items-center gap-2">
                    <MapPin className="h-8 w-8 text-primary/50" />
                    Interactive map · {property.city}, {property.region}
                  </span>
                </div>
              </section>
            </div>

            <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-2xl border border-border bg-card p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Advertised by</p>
                <div className="mt-3 flex items-center gap-3">
                  <Image
                    src={property.agent.avatar || "/placeholder-user.jpg"}
                    alt={property.agent.name}
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold text-foreground">{property.agent.name}</p>
                    <p className="text-xs text-muted-foreground">{property.agent.role}</p>
                  </div>
                </div>
                <p className="mt-4 flex items-center gap-2 text-sm text-foreground">
                  <Phone className="h-4 w-4 text-primary" /> {property.agent.phone}
                </p>
                <a
                  href={`tel:${property.agent.phone}`}
                  className={buttonVariants({ className: "mt-4 w-full rounded-xl font-semibold" })}
                >
                  <Phone className="h-4 w-4" /> Call Now
                </a>
                <p className="mt-2 text-center text-xs text-muted-foreground">Communication by phone only</p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Property Info</p>
                <dl className="mt-3 divide-y divide-border text-sm">
                  {info.map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between py-2">
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="font-medium text-foreground">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="rounded-xl">
                  <Share2 className="h-4 w-4" /> Share
                </Button>
                <Button variant="outline" className="rounded-xl">
                  <CalendarDays className="h-4 w-4" /> Visit
                </Button>
              </div>
            </aside>
          </div>

          <section className="mt-14">
            <h2 className="text-xl font-bold text-foreground">Similar Properties</h2>
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {similar.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-4 text-center">
      <span className="text-primary">{icon}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  )
}
