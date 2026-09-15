"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Car,
  Headphones,
  Search,
  ShieldCheck,
  Star,
  Users,
  type LucideIcon,
} from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { categories } from "@/lib/data"
import { getApiUrl } from "@/lib/get-api-url"

const HERO_VIDEO =
  "https://res.cloudinary.com/y7q39zm5/video/upload/v1783767160/sytelecity_background_uu31gf.mp4"

type StatItem = { value: string; label: string; icon: LucideIcon }

const initialStats: StatItem[] = [
  { value: "1,200+", label: "Properties Listed", icon: Building2 },
  { value: "350+", label: "Vehicles Listed", icon: Car },
  { value: "300+", label: "Trusted Agents", icon: BadgeCheck },
  { value: "24/7", label: "Customer Support", icon: Headphones },
]

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" as const },
  }),
}

const trustItems = [
  { icon: ShieldCheck, text: "Verified sellers & agents" },
  { icon: Users, text: "Ethiopian community trusted" },
  { icon: Star, text: "Quality listings daily" },
]

export function WebHero() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const paramsString = searchParams.toString()
  const [search, setSearch] = useState("")
  const [selectedCats, setSelectedCats] = useState<string[]>([])
  const [videoFailed, setVideoFailed] = useState(false)
  const [stats, setStats] = useState<StatItem[]>(initialStats)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`${getApiUrl()}/api/stats/overview`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return
        const fmt = (n: number) => `${Number(n || 0).toLocaleString()}+`
        setStats([
          { value: fmt(data.listedHouses), label: "Properties Listed", icon: Building2 },
          { value: fmt(data.listedCars), label: "Vehicles Listed", icon: Car },
          { value: fmt(data.verifiedAgents), label: "Trusted Agents", icon: BadgeCheck },
          { value: "24/7", label: "Customer Support", icon: Headphones },
        ])
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video || videoFailed) return
    let cancelled = false
    const attempt = video.play()
    if (attempt) {
      attempt.catch((err) => {
        if (cancelled) return
        if (err?.name === 'AbortError') return
        setVideoFailed(true)
      })
    }
    return () => {
      cancelled = true
      try {
        video.pause()
      } catch {}
    }
  }, [videoFailed])

  useEffect(() => {
    setSearch(searchParams.get("search") || "")
    setSelectedCats((searchParams.get("category") || "").split(",").filter(Boolean))
  }, [paramsString]) 

  function toggleCat(key: string) {
    setSelectedCats((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]
    )
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const term = search.trim()
    const sp = new URLSearchParams()
    if (term) sp.set("search", term)
    if (selectedCats.length) sp.set("category", selectedCats.join(","))
    const qs = sp.toString()
    const onlyCars = selectedCats.length > 0 && selectedCats.every((c) => c === "cars")
    router.push(`${pathname}${qs ? `?${qs}` : ""}#${onlyCars ? "vehicles" : "listings"}`)
  }

  return (
    <section className="relative flex min-h-[88vh] items-center overflow-hidden bg-secondary">
      {videoFailed ? (
        <img
          src="/properties/hero-bg.png"
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <video
          ref={videoRef}
          muted
          loop
          playsInline
          aria-hidden
          poster="/properties/hero-bg.png"
          onError={() => setVideoFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src={HERO_VIDEO} type="video/mp4" />
        </video>
      )}

      <div className="absolute inset-0 bg-slate-950/45" />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/50 to-slate-900/15" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-950 to-transparent" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[11fr_9fr] lg:gap-12">
          <motion.div initial="hidden" animate="show" className="min-w-0">
            <motion.span
              variants={fadeUp}
              custom={0}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white/90 backdrop-blur-sm"
            >
              <Building2 className="h-3.5 w-3.5 text-primary" />
              Ethiopia&apos;s Real Estate &amp; Vehicles Marketplace
            </motion.span>

            <motion.h1
              variants={fadeUp}
              custom={1}
              className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl"
            >
              Turn Your Dream Into a Key
            </motion.h1>

            <motion.p
              variants={fadeUp}
              custom={1.5}
              className="mt-2 text-2xl font-bold text-primary sm:text-3xl lg:text-4xl"
            >
              Your Home. Your Car. Your Story.
            </motion.p>

            <motion.p
              variants={fadeUp}
              custom={2}
              className="mt-4 max-w-2xl text-sm italic leading-relaxed text-white/75 sm:text-base"
            >
              Every great story begins at home. Whether it&apos;s your first house, a
              forever villa, or the car you&apos;ve always wanted — DawoLife brings
              trusted sellers and verified listings together, so you can move forward
              with confidence.
            </motion.p>

            <motion.form
              variants={fadeUp}
              custom={3}
              onSubmit={handleSearch}
              className="mt-8 flex w-full max-w-xl items-center gap-2 rounded-2xl border border-white/20 bg-white/15 p-2 shadow-2xl backdrop-blur-xl"
            >
              <span className="pl-2 text-white/70">
                <Search className="h-5 w-5" />
              </span>
              <label htmlFor="hero-search" className="sr-only">
                Search listings
              </label>
              <Input
                id="hero-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search houses, cars, cities, regions..."
                className="h-12 flex-1 border-0 bg-transparent text-base text-white shadow-none placeholder:text-white/60 focus-visible:ring-0 dark:bg-transparent"
              />
              <Button
                type="submit"
                className="h-12 shrink-0 rounded-xl bg-primary px-5 font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:bg-primary/90 active:scale-95"
              >
                Search
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </motion.form>

            <motion.div
              variants={fadeUp}
              custom={3.5}
              className="mt-3 flex w-full max-w-xl flex-wrap gap-2"
            >
              {categories.map((cat) => {
                const active = selectedCats.includes(cat.key)
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => toggleCat(cat.key)}
                    className={`inline-flex items-center rounded-full border px-3.5 py-1.5 text-xs font-semibold backdrop-blur-sm transition-all active:scale-95 ${
                      active
                        ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                        : "border-white/25 bg-white/10 text-white/90 hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/20 hover:text-white"
                    }`}
                  >
                    {cat.label}
                  </button>
                )
              })}
            </motion.div>

            <motion.div variants={fadeUp} custom={4} className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/#listings"
                className={buttonVariants({
                  variant: "ghost",
                  className: "h-12 bg-primary px-6 font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:bg-primary/90 hover:shadow-primary/40 active:scale-95",
                })}
              >
                Browse Properties
              </Link>
              <Link
                href="/#vehicles"
                className={buttonVariants({
                  variant: "ghost",
                  className: "h-12 border border-white/25 bg-white/10 px-6 text-white backdrop-blur-sm transition hover:bg-white/20 hover:text-white active:scale-95",
                })}
              >
                <Car className="mr-1.5 h-4 w-4" />
                Explore Vehicles
              </Link>
            </motion.div>

            <motion.div variants={fadeUp} custom={5} className="mt-7 flex flex-wrap gap-4 text-sm text-white/65">
              {trustItems.map(({ icon: Icon, text }) => (
                <span key={text} className="inline-flex items-center gap-1.5">
                  <Icon className="h-4 w-4 text-primary" />
                  {text}
                </span>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35, duration: 0.7, ease: "easeOut" }}
            className="w-full max-w-lg lg:justify-self-end"
          >
            <div className="rounded-[28px] border border-white/15 bg-white/10 p-4 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-5">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {stats.map((stat) => {
                  const Icon = stat.icon
                  return (
                    <motion.div
                      key={stat.label}
                      whileHover={{ y: -4 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="rounded-2xl border border-white/15 bg-white/10 px-3 py-4 text-center backdrop-blur-md sm:py-5"
                    >
                      <span className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-primary">
                        <Icon className="h-4.5 w-4.5" />
                      </span>
                      <p className="text-xl font-extrabold text-white sm:text-2xl">
                        {stat.value}
                      </p>
                      <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-white/65 sm:text-[11px]">
                        {stat.label}
                      </p>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}