"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  CheckCircle2,
  ChevronRight,
  MapPin,
  Phone,
  Share2,
  CalendarDays,
  Mail,
  Building2,
  MapPinned,
  Hash,
  AlertCircle,
  FileText,
  Car,
  Gauge,
  Calendar,
  Fuel,
  Users,
  DoorOpen,
  Settings,
  ShieldCheck,
  Palette,
  Globe,
  Cog,
  Star,
  BadgeCheck,
  ClipboardList,
  CircleCheck,
  CircleX
} from "lucide-react"
import { formatPrice } from "@/lib/data"
import type { Vehicle } from "@/lib/data"
import { SiteHeader } from "@/components/site-header"
import { Gallery } from "@/components/listing/gallery"
import { Button, buttonVariants } from "@/components/ui/button"
import { MessageAgent } from "@/components/listing/message-agent"
import { PayServiceCharge } from "@/components/listing/pay-service-charge"
import { SaveButton } from "@/components/save-button"
import { getApiUrl, getImageUrl } from "@/lib/get-api-url"

function getYouTubeEmbedUrl(url: string) {
  if (!url) return ""
  try {
    const urlObj = new URL(url)
    const host = urlObj.hostname.replace("www.", "")
    if (host === "youtube.com" || host === "m.youtube.com") {
      if (urlObj.pathname.startsWith("/embed/")) {
        const id = urlObj.pathname.split("/embed/")[1]?.split("?")[0]
        return id ? `https://www.youtube.com/embed/${id}` : ""
      }
      if (urlObj.pathname.startsWith("/shorts/")) {
        const id = urlObj.pathname.split("/shorts/")[1]?.split("?")[0]
        return id ? `https://www.youtube.com/embed/${id}` : ""
      }
      const v = urlObj.searchParams.get("v")
      if (v) return `https://www.youtube.com/embed/${v}`
    }
    if (host === "youtu.be") {
      const id = urlObj.pathname.slice(1).split("?")[0]
      return id ? `https://www.youtube.com/embed/${id}` : ""
    }
    if (host === "vimeo.com") {
      const id = urlObj.pathname.slice(1).split("?")[0]
      return id ? `https://player.vimeo.com/video/${id}` : ""
    }
    return url
  } catch {
    return url
  }
}

export default function VehicleListingPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col">
          <SiteHeader />
          <main className="flex-1 flex items-center justify-center bg-muted/30">
            <p className="text-muted-foreground">Loading vehicle...</p>
          </main>
        </div>
      }
    >
      <VehicleListingPage />
    </Suspense>
  )
}

function VehicleListingPage() {
  const searchParams = useSearchParams()
  const id = searchParams.get("id")
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }

    const fetchVehicle = async () => {
      try {
        const res = await fetch(`${getApiUrl()}/api/vehicles/${id}`)
        if (res.ok) {
          const data = await res.json()
          const db = data.vehicle
          if (db) {
            const mapped: Vehicle = {
              id: db.id,
              title: db.title || "",
              listingType: db.listingType || "For Sale",
              vehicleCategory: db.vehicleCategory || "",
              make: db.make || "",
              model: db.vehicleModel || db.model || "",
              trimVersion: db.trimVersion || "",
              manufacturingYear: db.manufacturingYear || 0,
              color: db.color || "",
              countryOfOrigin: db.countryOfOrigin || "",
              fuelType: db.fuelType || "",
              engineSize: db.engineSize || 0,
              horsepower: db.horsepower || 0,
              transmission: db.transmission || "",
              drivetrain: db.drivetrain || "",
              seatingCapacity: db.seatingCapacity || 0,
              doors: db.doors || 0,
              mileage: db.mileage || 0,
              condition: db.condition || "Used",
              accidentFree: db.accidentFree ?? false,
              imported: db.imported ?? false,
              safetyFeatures: db.safetyFeatures || [],
              interiorFeatures: db.interiorFeatures || [],
              exteriorFeatures: db.exteriorFeatures || [],
              price: db.price || 0,
              priceType: db.priceType || "",
              region: db.region || "",
              city: db.city || "",
              subCity: db.subCity || "",
              woreda: db.woreda || "",
              description: db.description || "",
              features: db.features || [],
              images: db.images && db.images.length > 0 ? db.images.map((img: string) => getImageUrl(img)) : ["/placeholder.jpg"],
              videoUrl: db.videoUrl || "",
              featured: db.featured || false,
              dailyRate: db.dailyRate || 0,
              weeklyRate: db.weeklyRate || 0,
              monthlyRate: db.monthlyRate || 0,
              selfDrive: db.selfDrive ?? false,
              driverIncluded: db.driverIncluded ?? false,
              negotiable: db.negotiable ?? false,
              financingAvailable: db.financingAvailable ?? false,
              plateNumber: db.plateNumber || "",
              insuranceValid: db.insuranceValid ?? false,
              ownershipCertificate: db.ownershipCertificate ?? false,
              roadFundPaid: db.roadFundPaid ?? false,
              inspectionCertificate: db.inspectionCertificate ?? false,
              agent: {
                id: db.agentId || "unknown",
                name: db.agent?.username || db.agentName || "Unknown Agent",
                role: "Vehicle Agent",
                phone: db.displayPhone || db.agent?.phone || "+251 900 000 000",
                avatar: db.agent?.profilePhoto || "/placeholder-user.jpg",
              },
            }
            setVehicle(mapped)
            setLoading(false)
            return
          }
        }
      } catch (err) {
        console.error("[VehicleListing API Load Error]", err)
      }

      setLoading(false)
    }

    fetchVehicle()
  }, [id])

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center bg-muted/30">
          <p className="text-muted-foreground">Loading vehicle...</p>
        </main>
      </div>
    )
  }

  if (!vehicle) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center bg-muted/30">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">Vehicle Not Found</h1>
            <p className="mt-2 text-muted-foreground">The vehicle you&apos;re looking for doesn&apos;t exist.</p>
            <Link href="/" className="mt-4 inline-block text-primary hover:underline">
              Go Home
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const isRent = vehicle.listingType === "For Rent" || vehicle.listingType === "Both"
  const isSale = vehicle.listingType === "For Sale" || vehicle.listingType === "Both"
  const embedUrl = vehicle.videoUrl ? getYouTubeEmbedUrl(vehicle.videoUrl) : ""

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
            <Link href="/#vehicles" className="hover:text-primary">
              Vehicles
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground line-clamp-1">{vehicle.title}</span>
          </nav>

          <div className="mt-5 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
            <div>
              <Gallery images={vehicle.images} title={vehicle.title} badge={vehicle.listingType} />

              <div className="mt-6 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{vehicle.title}</h1>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 text-primary" />
                    {vehicle.subCity ? `${vehicle.subCity}, ` : ""}
                    {vehicle.city}, {vehicle.region}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-extrabold text-primary">{formatPrice(vehicle.price)} ETB</p>
                  {vehicle.priceType && <p className="text-xs text-muted-foreground">{vehicle.priceType}</p>}
                  {isRent && (
                    <div className="mt-1 space-x-3 text-xs text-muted-foreground">
                      {vehicle.dailyRate ? <span>Day: {formatPrice(vehicle.dailyRate)} ETB</span> : null}
                      {vehicle.weeklyRate ? <span>Week: {formatPrice(vehicle.weeklyRate)} ETB</span> : null}
                      {vehicle.monthlyRate ? <span>Month: {formatPrice(vehicle.monthlyRate)} ETB</span> : null}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat icon={<Car className="h-5 w-5" />} label="Make / Model" value={`${vehicle.make} ${vehicle.model}`} />
                <Stat icon={<Calendar className="h-5 w-5" />} label="Year" value={String(vehicle.manufacturingYear)} />
                <Stat icon={<Gauge className="h-5 w-5" />} label="Mileage" value={vehicle.mileage ? `${formatPrice(vehicle.mileage)} km` : "N/A"} />
                <Stat icon={<Settings className="h-5 w-5" />} label="Transmission" value={vehicle.transmission || "N/A"} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat icon={<Fuel className="h-5 w-5" />} label="Fuel Type" value={vehicle.fuelType || "N/A"} />
                <Stat icon={<Users className="h-5 w-5" />} label="Seating" value={vehicle.seatingCapacity ? `${vehicle.seatingCapacity} Seats` : "N/A"} />
                <Stat icon={<DoorOpen className="h-5 w-5" />} label="Doors" value={vehicle.doors ? String(vehicle.doors) : "N/A"} />
                <Stat icon={<CheckCircle2 className="h-5 w-5" />} label="Condition" value={vehicle.condition} />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground">
                  <Palette className="mr-1 inline h-3.5 w-3.5 text-primary" /> {vehicle.color}
                </span>
                {vehicle.vehicleCategory && (
                  <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground">
                    <Car className="mr-1 inline h-3.5 w-3.5 text-primary" /> {vehicle.vehicleCategory}
                  </span>
                )}
                {vehicle.countryOfOrigin && (
                  <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground">
                    <Globe className="mr-1 inline h-3.5 w-3.5 text-primary" /> {vehicle.countryOfOrigin}
                  </span>
                )}
                {vehicle.trimVersion && (
                  <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground">
                    <Cog className="mr-1 inline h-3.5 w-3.5 text-primary" /> {vehicle.trimVersion}
                  </span>
                )}
                {vehicle.accidentFree && (
                  <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                    <ShieldCheck className="mr-1 inline h-3.5 w-3.5" /> Accident Free
                  </span>
                )}
              </div>

              {vehicle.status === "Rejected" && (vehicle as any).rejectionReason && (
                <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-red-700 uppercase tracking-wider">Rejection Reason</p>
                    <p className="mt-1 text-sm text-red-600">{(vehicle as any).rejectionReason}</p>
                  </div>
                </div>
              )}

              <section className="mt-8">
                <h2 className="text-lg font-semibold text-foreground">Description</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{vehicle.description || "No description provided."}</p>
              </section>

              {vehicle.safetyFeatures.length > 0 && (
                <section className="mt-8">
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                    <ShieldCheck className="h-5 w-5 text-primary" /> Safety Features
                  </h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {vehicle.safetyFeatures.map((f) => (
                      <span
                        key={f}
                        className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm text-foreground"
                      >
                        <CheckCircle2 className="h-4 w-4 text-success" /> {f}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {vehicle.interiorFeatures.length > 0 && (
                <section className="mt-8">
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                    <Star className="h-5 w-5 text-primary" /> Interior Features
                  </h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {vehicle.interiorFeatures.map((f) => (
                      <span
                        key={f}
                        className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm text-foreground"
                      >
                        <CheckCircle2 className="h-4 w-4 text-success" /> {f}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {vehicle.exteriorFeatures.length > 0 && (
                <section className="mt-8">
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                    <Car className="h-5 w-5 text-primary" /> Exterior Features
                  </h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {vehicle.exteriorFeatures.map((f) => (
                      <span
                        key={f}
                        className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm text-foreground"
                      >
                        <CheckCircle2 className="h-4 w-4 text-success" /> {f}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              <section className="mt-8">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  <ClipboardList className="h-5 w-5 text-primary" /> Technical Specifications
                </h2>
                <div className="mt-3 overflow-hidden rounded-2xl border border-border">
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-border">
                      {[
                        ["Make", vehicle.make],
                        ["Model", vehicle.model],
                        ["Trim / Version", vehicle.trimVersion || "N/A"],
                        ["Year", vehicle.manufacturingYear || "N/A"],
                        ["Color", vehicle.color],
                        ["Country of Origin", vehicle.countryOfOrigin],
                        ["Category", vehicle.vehicleCategory],
                        ["Engine Size", vehicle.engineSize ? `${vehicle.engineSize} cc` : "N/A"],
                        ["Horsepower", vehicle.horsepower ? `${vehicle.horsepower} hp` : "N/A"],
                        ["Transmission", vehicle.transmission || "N/A"],
                        ["Drivetrain", vehicle.drivetrain || "N/A"],
                        ["Fuel Type", vehicle.fuelType || "N/A"],
                        ["Mileage", vehicle.mileage ? `${formatPrice(vehicle.mileage)} km` : "N/A"],
                        ["Seating Capacity", vehicle.seatingCapacity || "N/A"],
                        ["Doors", vehicle.doors || "N/A"],
                      ]
                        .filter(([, val]) => val !== "N/A")
                        .map(([label, value]) => (
                          <tr key={String(label)} className="bg-card">
                            <td className="px-4 py-2.5 font-medium text-muted-foreground w-[45%]">{String(label)}</td>
                            <td className="px-4 py-2.5 text-foreground">{String(value)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="mt-8">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  <CheckCircle2 className="h-5 w-5 text-primary" /> Vehicle Condition
                </h2>
                <div className="mt-3 flex flex-wrap gap-3">
                  <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm">
                    <span className="text-muted-foreground">Condition: </span>
                    <span className="font-medium text-foreground">{vehicle.condition}</span>
                  </div>
                  {vehicle.accidentFree !== undefined && (
                    <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm">
                      <span className="text-muted-foreground">Accident Free: </span>
                      <span className="font-medium text-foreground">{vehicle.accidentFree ? "Yes" : "No"}</span>
                    </div>
                  )}
                  {vehicle.imported !== undefined && (
                    <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm">
                      <span className="text-muted-foreground">Imported: </span>
                      <span className="font-medium text-foreground">{vehicle.imported ? "Yes" : "No"}</span>
                    </div>
                  )}
                </div>
              </section>

              {isRent && (
                <section className="mt-8">
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                    <CalendarDays className="h-5 w-5 text-primary" /> Rental Information
                  </h2>
                  <div className="mt-3 overflow-hidden rounded-2xl border border-border">
                    <table className="w-full text-sm">
                      <tbody className="divide-y divide-border">
                        {([
                          vehicle.dailyRate ? ["Daily Rate", `${formatPrice(vehicle.dailyRate)} ETB`] : null,
                          vehicle.weeklyRate ? ["Weekly Rate", `${formatPrice(vehicle.weeklyRate)} ETB`] : null,
                          vehicle.monthlyRate ? ["Monthly Rate", `${formatPrice(vehicle.monthlyRate)} ETB`] : null,
                          ["Self Drive Available", vehicle.selfDrive ? "Yes" : "No"],
                          ["Driver Included", vehicle.driverIncluded ? "Yes" : "No"],
                        ] as [string, string][])
                          .filter(Boolean)
                          .map(([label, value]) => (
                            <tr key={String(label)} className="bg-card">
                              <td className="px-4 py-2.5 font-medium text-muted-foreground w-[45%]">{String(label)}</td>
                              <td className="px-4 py-2.5 text-foreground">{String(value)}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {isSale && (
                <section className="mt-8">
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                    <BadgeCheck className="h-5 w-5 text-primary" /> Sale Information
                  </h2>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm">
                      <span className="text-muted-foreground">Negotiable: </span>
                      <span className="font-medium text-foreground">{vehicle.negotiable ? "Yes" : "No"}</span>
                    </div>
                    <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm">
                      <span className="text-muted-foreground">Financing Available: </span>
                      <span className="font-medium text-foreground">{vehicle.financingAvailable ? "Yes" : "No"}</span>
                    </div>
                  </div>
                </section>
              )}

              <section className="mt-8">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  <FileText className="h-5 w-5 text-primary" /> Ethiopian Legal Information
                </h2>
                <div className="mt-3 overflow-hidden rounded-2xl border border-border">
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-border">
                      {([
                        vehicle.plateNumber ? ["Plate Number", vehicle.plateNumber] : null,
                        ["Insurance Valid", vehicle.insuranceValid ? "Yes" : "No"],
                        ["Ownership Certificate", vehicle.ownershipCertificate ? "Yes" : "No"],
                        ["Road Fund Paid", vehicle.roadFundPaid ? "Yes" : "No"],
                        ["Inspection Certificate", vehicle.inspectionCertificate ? "Yes" : "No"],
                      ] as [string, string][])
                        .filter(Boolean)
                        .map(([label, value]) => (
                          <tr key={String(label)} className="bg-card">
                            <td className="px-4 py-2.5 font-medium text-muted-foreground w-[45%] flex items-center gap-1.5">
                              {String(value) === "Yes" ? (
                                <CircleCheck className="h-4 w-4 text-green-500 shrink-0" />
                              ) : (
                                <CircleX className="h-4 w-4 text-red-400 shrink-0" />
                              )}
                              {String(label)}
                            </td>
                            <td className="px-4 py-2.5 font-medium text-foreground">{String(value)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {embedUrl && (
                <section className="mt-8">
                  <h2 className="text-lg font-semibold text-foreground mb-3">Video</h2>
                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-border bg-slate-100 shadow-sm">
                    <iframe
                      src={embedUrl}
                      title="Vehicle Video"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="absolute inset-0 w-full h-full border-0"
                    />
                  </div>
                </section>
              )}

              <section className="mt-8">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  <MapPin className="h-5 w-5 text-primary" /> Vehicle Location
                </h2>
                <div className="mt-3 flex aspect-[16/7] items-center justify-center rounded-2xl border border-border bg-muted text-sm text-muted-foreground">
                  <span className="flex flex-col items-center gap-2">
                    <MapPin className="h-8 w-8 text-primary/50" />
                    Interactive map · {vehicle.city}, {vehicle.region}
                  </span>
                </div>
              </section>
            </div>

            <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-2xl border border-border bg-card p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Advertised by</p>
                <div className="mt-3 flex items-center gap-3">
                  <img
                    src={vehicle.agent.avatar || "/placeholder-user.jpg"}
                    alt={vehicle.agent.name}
                    className="h-12 w-12 rounded-full object-cover border border-slate-100"
                  />
                  <div>
                    <p className="font-semibold text-foreground line-clamp-1">{vehicle.agent.name}</p>
                    <p className="text-xs text-muted-foreground">{vehicle.agent.role}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-3 text-sm">
                  <p className="flex items-center gap-2 text-foreground">
                    <Phone className="h-4 w-4 text-primary shrink-0" /> {vehicle.agent.phone}
                  </p>
                  {vehicle.agent.secondaryPhone && (
                    <p className="flex items-center gap-2 text-foreground">
                      <Phone className="h-4 w-4 text-primary shrink-0" /> {vehicle.agent.secondaryPhone}
                    </p>
                  )}
                  {vehicle.agent.email && (
                    <p className="flex items-center gap-2 text-foreground">
                      <Mail className="h-4 w-4 text-primary shrink-0" /> {vehicle.agent.email}
                    </p>
                  )}
                  {vehicle.agent.companyName && (
                    <p className="flex items-center gap-2 text-foreground">
                      <Building2 className="h-4 w-4 text-primary shrink-0" /> {vehicle.agent.companyName}
                    </p>
                  )}
                  {vehicle.agent.officeAddress && (
                    <p className="flex items-center gap-2 text-foreground">
                      <MapPinned className="h-4 w-4 text-primary shrink-0" /> {vehicle.agent.officeAddress}
                    </p>
                  )}
                  {vehicle.agent.licenseNumber && (
                    <p className="flex items-center gap-2 text-foreground">
                      <Hash className="h-4 w-4 text-primary shrink-0" /> License: {vehicle.agent.licenseNumber}
                    </p>
                  )}
                </div>

                <a
                  href={`tel:${vehicle.agent.phone}`}
                  className={buttonVariants({ className: "mt-4 w-full rounded-xl font-semibold min-h-[44px]" })}
                >
                  <Phone className="h-4 w-4" /> Call Now
                </a>
                <MessageAgent
                  propertyId={vehicle.id}
                  agentId={vehicle.agent.id}
                  agentName={vehicle.agent.name}
                  propertyTitle={vehicle.title}
                />
                <p className="mt-2 text-center text-xs text-muted-foreground">Call or message the agent directly</p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Vehicle Info</p>
                <dl className="mt-3 divide-y divide-border text-sm">
                  {[
                    ["Type", vehicle.vehicleCategory],
                    ["Status", vehicle.listingType],
                    ["Make", vehicle.make],
                    ["Model", vehicle.model],
                    ["Year", String(vehicle.manufacturingYear)],
                    ["Color", vehicle.color],
                    ["Transmission", vehicle.transmission],
                    ["Fuel", vehicle.fuelType],
                    ["Mileage", vehicle.mileage ? `${formatPrice(vehicle.mileage)} km` : "N/A"],
                    ["Condition", vehicle.condition],
                    ["Region", vehicle.region],
                    ["City", vehicle.city],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between py-2">
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="font-medium text-foreground">{value || "N/A"}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" className="rounded-xl min-h-[44px] px-2">
                  <Share2 className="h-4 w-4" /> Share
                </Button>
                <Button variant="outline" className="rounded-xl min-h-[44px] px-2">
                  <CalendarDays className="h-4 w-4" /> Visit
                </Button>
                <SaveButton itemType="vehicle" itemId={vehicle.id} label="Save" />
              </div>

              <PayServiceCharge propertyId={vehicle.id} propertyTitle={vehicle.title} />
            </aside>
          </div>
        </div>
      </main>
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
