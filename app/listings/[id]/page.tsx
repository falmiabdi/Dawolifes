import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import mongoose from "mongoose"
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
  Video,
  Mail,
  Building2,
  MapPinned,
  Hash,
  AlertCircle,
  FileText
} from "lucide-react"
import { getProperty, formatPrice, properties } from "@/lib/data"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Gallery } from "@/components/listing/gallery"
import { PropertyCard } from "@/components/property-card"
import { Button, buttonVariants } from "@/components/ui/button"
import { MessageAgent } from "@/components/listing/message-agent"
import { PayServiceCharge } from "@/components/listing/pay-service-charge"
import { connectToDatabase } from "@/lib/db"
import { PropertyModel } from "@/lib/models/property"
import "@/lib/models/user"

export function generateStaticParams() {
  return properties.map((p) => ({ id: p.id }))
}

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let property: any = null

  if (mongoose.Types.ObjectId.isValid(id)) {
    try {
      await connectToDatabase()
      const dbProp = await PropertyModel.findById(id).populate('agentId').lean()
      if (dbProp) {
        // Hide properties from suspended agents
        if (dbProp.agentId && (dbProp.agentId as any).status === 'Suspended') {
          property = null
        } else {
          property = {
            id: dbProp._id.toString(),
            title: dbProp.title,
            type: dbProp.type,
            listingType: dbProp.listingType,
            price: dbProp.price,
            priceType: dbProp.priceType,
            region: dbProp.region,
            city: dbProp.city,
            subCity: dbProp.subCity || '',
            woreda: dbProp.woreda || '',
            kebele: dbProp.kebele || '',
            parcel: dbProp.parcel || '',
            block: dbProp.block || '',
            homeNo: dbProp.homeNo || '',
            area: dbProp.area || 0,
            bedrooms: dbProp.bedrooms || 0,
            bathrooms: dbProp.bathrooms || 0,
            condition: dbProp.condition || 'Finished',
            legalizedYear: dbProp.legalizedYear || 2024,
            description: dbProp.description || '',
            features: dbProp.features || [],
            images: dbProp.images && dbProp.images.length > 0 ? dbProp.images : ["/placeholder.jpg"],
            videoUrl: dbProp.videoUrl || '',
            locationDocument: dbProp.locationDocument || '',
            status: dbProp.status || '',
            rejectionReason: dbProp.rejectionReason || '',
            agent: {
              id: dbProp.agentId?._id?.toString() || 'unknown',
              name: dbProp.agentId?.fullName || dbProp.agentId?.username || 'Unknown Agent',
              role: dbProp.agentId?.role === 'admin' ? 'Administrator' : 'Real Estate Agent',
              phone: dbProp.agentId?.ethPhone || dbProp.agentId?.safaricomPhone || '+251 900 000 000',
              avatar: dbProp.agentId?.profilePhoto || '/placeholder-user.jpg',
              email: dbProp.agentId?.email || '',
              secondaryPhone: dbProp.agentId?.safaricomPhone || '',
              companyName: dbProp.agentId?.companyName || '',
              officeAddress: dbProp.agentId?.officeAddress || '',
              licenseNumber: dbProp.agentId?.businessLicenseNumber || '',
            }
          }
        }
      }
    } catch (err) {
      console.error('[ListingDetails DB Load Error]', err)
    }
  }

  if (!property) {
    property = getProperty(id)
  }

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
    ["Parcel", property.parcel],
    ["Block", property.block],
    ["Home No", property.homeNo],
    ["Condition", property.condition],
    ["Legalized Year", String(property.legalizedYear)],
  ]
  const similar = properties.filter((p) => p.id !== property.id).slice(0, 3)

  function getYouTubeEmbedUrl(url: string) {
    if (!url) return ''
    try {
      const urlObj = new URL(url)
      const host = urlObj.hostname.replace('www.', '')

      if (host === 'youtube.com' || host === 'm.youtube.com') {
        if (urlObj.pathname.startsWith('/embed/')) {
          const id = urlObj.pathname.split('/embed/')[1]?.split('?')[0]
          return id ? `https://www.youtube.com/embed/${id}` : ''
        }
        if (urlObj.pathname.startsWith('/shorts/')) {
          const id = urlObj.pathname.split('/shorts/')[1]?.split('?')[0]
          return id ? `https://www.youtube.com/embed/${id}` : ''
        }
        const v = urlObj.searchParams.get('v')
        if (v) return `https://www.youtube.com/embed/${v}`
      }

      if (host === 'youtu.be') {
        const id = urlObj.pathname.slice(1).split('?')[0]
        return id ? `https://www.youtube.com/embed/${id}` : ''
      }

      if (host === 'vimeo.com') {
        const id = urlObj.pathname.slice(1).split('?')[0]
        return id ? `https://player.vimeo.com/video/${id}` : ''
      }

      return url
    } catch {
      return url
    }
  }

  const embedUrl = property.videoUrl ? getYouTubeEmbedUrl(property.videoUrl) : ''

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
            <span className="text-foreground line-clamp-1">{property.title}</span>
          </nav>

          <div className="mt-5 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
            <div>
              <Gallery images={property.images} title={property.title} badge={property.listingType} />

              <div className="mt-6 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{property.title}</h1>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 text-primary" />
                    {property.subCity}, {property.woreda} · Parcel {property.parcel || 'N/A'} · Block {property.block || 'N/A'} · Home No{" "}
                    {property.homeNo || 'N/A'}
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

              {property.status === 'Rejected' && property.rejectionReason && (
                <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-red-700 uppercase tracking-wider">Rejection Reason</p>
                    <p className="mt-1 text-sm text-red-600">{property.rejectionReason}</p>
                  </div>
                </div>
              )}

              <section className="mt-8">
                <h2 className="text-lg font-semibold text-foreground">Description</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{property.description}</p>
              </section>

              <section className="mt-8">
                <h2 className="text-lg font-semibold text-foreground">Features</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {property.features.map((f: string) => (
                    <span
                      key={f}
                      className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm text-foreground"
                    >
                      <CheckCircle2 className="h-4 w-4 text-success" /> {f}
                    </span>
                  ))}
                </div>
              </section>

              {embedUrl && (
                <section className="mt-8">
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground mb-3">
                    <Video className="h-5 w-5 text-primary" /> Video Tour
                  </h2>
                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-border bg-slate-100 shadow-sm">
                    <iframe
                      src={embedUrl}
                      title="Property Video Tour"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="absolute inset-0 w-full h-full border-0"
                    />
                  </div>
                </section>
              )}

              {property.locationDocument && (
                <section className="mt-8">
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground mb-3">
                    <FileText className="h-5 w-5 text-primary" /> Location Document
                  </h2>
                  <a
                    href={property.locationDocument}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-accent/5"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <FileText className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">View Property Document</p>
                      <p className="text-xs text-muted-foreground">Boundaries, title, or location verification (PDF/IMAGE)</p>
                    </div>
                  </a>
                </section>
              )}

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
                  <img
                    src={property.agent.avatar || "/placeholder-user.jpg"}
                    alt={property.agent.name}
                    className="h-12 w-12 rounded-full object-cover border border-slate-100"
                  />
                  <div>
                    <p className="font-semibold text-foreground line-clamp-1">{property.agent.name}</p>
                    <p className="text-xs text-muted-foreground">{property.agent.role}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-3 text-sm">
                  <p className="flex items-center gap-2 text-foreground">
                    <Phone className="h-4 w-4 text-primary shrink-0" /> {property.agent.phone}
                  </p>
                  {property.agent.secondaryPhone && (
                    <p className="flex items-center gap-2 text-foreground">
                      <Phone className="h-4 w-4 text-primary shrink-0" /> {property.agent.secondaryPhone}
                    </p>
                  )}
                  {property.agent.email && (
                    <p className="flex items-center gap-2 text-foreground">
                      <Mail className="h-4 w-4 text-primary shrink-0" /> {property.agent.email}
                    </p>
                  )}
                  {property.agent.companyName && (
                    <p className="flex items-center gap-2 text-foreground">
                      <Building2 className="h-4 w-4 text-primary shrink-0" /> {property.agent.companyName}
                    </p>
                  )}
                  {property.agent.officeAddress && (
                    <p className="flex items-center gap-2 text-foreground">
                      <MapPinned className="h-4 w-4 text-primary shrink-0" /> {property.agent.officeAddress}
                    </p>
                  )}
                  {property.agent.licenseNumber && (
                    <p className="flex items-center gap-2 text-foreground">
                      <Hash className="h-4 w-4 text-primary shrink-0" /> License: {property.agent.licenseNumber}
                    </p>
                  )}
                </div>

                <a
                  href={`tel:${property.agent.phone}`}
                  className={buttonVariants({ className: "mt-4 w-full rounded-xl font-semibold min-h-[44px]" })}
                >
                  <Phone className="h-4 w-4" /> Call Now
                </a>
                <MessageAgent
                  propertyId={property.id}
                  agentId={property.agent.id}
                  agentName={property.agent.name}
                  propertyTitle={property.title}
                />
                <p className="mt-2 text-center text-xs text-muted-foreground">Call or message the agent directly</p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Property Info</p>
                <dl className="mt-3 divide-y divide-border text-sm">
                  {info.map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between py-2">
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="font-medium text-foreground">{value || 'N/A'}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="rounded-xl min-h-[44px]">
                  <Share2 className="h-4 w-4" /> Share
                </Button>
                <Button variant="outline" className="rounded-xl min-h-[44px]">
                  <CalendarDays className="h-4 w-4" /> Visit
                </Button>
              </div>

              <PayServiceCharge propertyId={property.id} propertyTitle={property.title} />
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
