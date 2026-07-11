import Image from "next/image"
import { Building2, MapPin, Search, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { connectToDatabase } from "@/lib/db"
import { PropertyModel } from "@/lib/models/property"
import "@/lib/models/user"

type RecentProperty = {
  id: string
  title: string
  images: string[]
  createdAt: Date
}

function timeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - new Date(date).getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 30) return `${diffDays}d ago`
  const diffMonths = Math.floor(diffDays / 30)
  return `${diffMonths}mo ago`
}

export async function Hero() {
  let recentProperties: RecentProperty[] = []

  try {
    await connectToDatabase()
    const docs = await PropertyModel.find({ status: "Approved" })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("title images createdAt")
      .lean()

    recentProperties = docs.map((p: any) => ({
      id: p._id.toString(),
      title: p.title,
      images: p.images && p.images.length > 0 ? p.images : ["/placeholder.jpg"],
      createdAt: p.createdAt,
    }))
  } catch {
    console.warn("Hero: DB fetch failed, using fallback")
    recentProperties = [
      { id: "1", title: "Mana Jireenyaa", images: ["/properties/villa-1.png"], createdAt: new Date() },
      { id: "2", title: "Sale House", images: ["/properties/house-2.png"], createdAt: new Date() },
      { id: "3", title: "Modern Bole Apartment", images: ["/properties/apartment-3.png"], createdAt: new Date() },
      { id: "4", title: "Luxury Villa", images: ["/properties/villa-5.png"], createdAt: new Date() },
      { id: "5", title: "Commercial Space", images: ["/properties/commercial-6.png"], createdAt: new Date() },
    ]
  }

  const marqueeItems = [...recentProperties, ...recentProperties, ...recentProperties]

  return (
    <section className="relative min-h-[600px] overflow-hidden bg-secondary sm:min-h-[700px]">
      <div className="relative mx-auto grid max-w-7xl lg:grid-cols-2">
        {/* ===== LEFT: Content + Scrolling Houses ===== */}
        <div className="relative z-10 flex flex-col justify-center px-4 pb-8 pt-12 sm:px-8 sm:pb-12 sm:pt-20">
          <h1 className="text-balance text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
            Find Homes for Sale &amp; Rent{" "}
            <span className="text-primary">in Ethiopia</span>
          </h1>
          <p className="mt-4 max-w-xl text-pretty text-sm leading-relaxed text-white/70 sm:text-base">
            Discover the best homes, luxury apartments, and commercial properties in Oromia,
            Addis Ababa, Shaggar and beyond.
          </p>

          <form className="mt-6 max-w-lg rounded-2xl bg-card p-3 shadow-xl">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 rounded-xl bg-muted px-3">
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="City, Woreda, Location"
                  className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-muted px-3">
                <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Region"
                  className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-muted px-3">
                <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Property Type"
                  className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
            </div>
            <Button type="submit" className="mt-2 h-12 w-full rounded-xl text-base font-semibold">
              <Search className="h-5 w-5" /> Search Properties
            </Button>
          </form>

          {/* Scrolling houses from DB */}
          <div className="mt-8">
            <p className="mb-3 text-xs font-medium uppercase tracking-widest text-white/50">
              Recently Posted
            </p>
            <div className="marquee-track overflow-hidden">
              <div className="marquee-content flex gap-3">
                {marqueeItems.map((property, i) => (
                  <div
                    key={`${property.id}-${i}`}
                    className="group relative aspect-[4/3] w-36 shrink-0 overflow-hidden rounded-xl shadow-lg sm:w-44"
                  >
                    <Image
                      src={property.images[0]}
                      alt={property.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-secondary/95 to-transparent p-2 pt-7">
                      <p className="truncate text-xs font-semibold text-white">{property.title}</p>
                      <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-white/60">
                        <Clock className="h-3 w-3" />
                        {timeAgo(property.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ===== RIGHT: Video Panel ===== */}
        <div className="relative flex min-h-[400px] items-center justify-center sm:min-h-[600px]">
          <video
            autoPlay
            muted
            loop
            playsInline
            poster="/properties/hero-bg.png"
            className="absolute inset-0 h-full w-full object-cover"
          >
            <source src="/properties/sytelecity background.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-r from-secondary via-secondary/60 to-transparent lg:bg-gradient-to-r lg:from-secondary lg:via-secondary/40 lg:to-transparent" />

          <div className="relative z-10 rounded-2xl border border-white/20 bg-white/10 px-6 py-4 text-center backdrop-blur-md">
            <p className="text-3xl font-bold text-white">360°</p>
            <p className="text-xs font-medium uppercase tracking-widest text-white/70">
              Virtual Tour
            </p>
          </div>

          <div className="absolute bottom-6 right-6 z-10 flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium text-white/80 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            Live Preview
          </div>
        </div>
      </div>
    </section>
  )
}
