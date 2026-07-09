import Image from "next/image"
import { Building2, MapPin, Search } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Hero() {
  return (
    <section className="relative overflow-hidden min-h-[380px] sm:min-h-[480px]">
      <Image
        src="/properties/hero-bg.png"
        alt=""
        fill
        priority
        className="object-cover"
        aria-hidden
      />
      <div className="absolute inset-0 bg-secondary/75" />

      <div className="relative mx-auto max-w-5xl px-4 py-14 text-center sm:px-6 sm:py-28">
        <h1 className="text-balance text-4xl font-extrabold leading-tight text-white sm:text-5xl">
          Find Homes for Sale &amp; Rent{" "}
          <span className="text-primary">in Ethiopia</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-pretty text-sm leading-relaxed text-white/80 sm:text-base">
          Discover the best homes, luxury apartments, and commercial properties in Oromia, Addis Ababa,
          Shaggar and beyond. Your trusted source for Ethiopian real estate.
        </p>

        <form className="mx-auto mt-8 max-w-3xl rounded-2xl bg-card p-3 shadow-xl">
          <div className="flex flex-col gap-2 md:flex-row">
            <div className="flex flex-1 items-center gap-2 rounded-xl bg-muted px-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="City, Woreda, Location"
                className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex flex-1 items-center gap-2 rounded-xl bg-muted px-3">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Region"
                className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex flex-1 items-center gap-2 rounded-xl bg-muted px-3">
              <Building2 className="h-4 w-4 text-muted-foreground" />
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
      </div>
    </section>
  )
}
