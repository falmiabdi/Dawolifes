"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowRight, Building2, Car, Search, ShieldCheck, Star, Users } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const HERO_VIDEO =
  "https://res.cloudinary.com/y7q39zm5/video/upload/v1783767160/sytelecity_background_uu31gf.mp4"

const stats = [
  { value: "1,200+", label: "Properties Listed" },
  { value: "350+", label: "Vehicles Listed" },
  { value: "300+", label: "Trusted Agents" },
  { value: "24/7", label: "Customer Support" },
]

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: "easeOut" as const },
  }),
}

export function WebHero() {
  const router = useRouter()
  const pathname = usePathname()
  const [search, setSearch] = useState("")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const term = search.trim()
    router.push(`${pathname}${term ? `?search=${encodeURIComponent(term)}` : ""}#listings`)
  }

  const trustItems = useMemo(
    () => [
      { icon: ShieldCheck, text: "Verified sellers & agents" },
      { icon: Users, text: "Ethiopian community trusted" },
      { icon: Star, text: "Quality listings daily" },
    ],
    []
  )

  return (
    <section className="relative flex min-h-[88vh] items-center overflow-hidden bg-secondary">
      <video
        autoPlay
        muted
        loop
        playsInline
        poster="/properties/hero-bg.png"
        className="absolute inset-0 h-full w-full object-cover"
      >
        <source src={HERO_VIDEO} type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-r from-secondary via-secondary/85 to-secondary/40" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-secondary to-transparent" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <motion.div initial="hidden" animate="show" className="max-w-3xl">
          <motion.span
            variants={fadeUp}
            custom={0}
            className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary"
          >
            <Building2 className="h-3.5 w-3.5" />
            Ethiopia&apos;s Real Estate &amp; Vehicles Marketplace
          </motion.span>

          <motion.h1
            variants={fadeUp}
            custom={1}
            className="mt-6 text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl"
          >
            Turn Your Dream Into a Key
            <span className="mt-2 block text-primary">
              Your Home. Your Car. Your Story.
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            custom={2}
            className="mt-5 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg"
          >
            Every great story begins at home. Whether it&apos;s your first house, a
            forever villa, or the car you&apos;ve always wanted — DawoLife brings
            trusted sellers and verified listings to your doorstep, so you can
            move forward with confidence.
          </motion.p>

          <motion.form
            variants={fadeUp}
            custom={3}
            onSubmit={handleSearch}
            className="mt-8 flex w-full max-w-xl items-center gap-2 rounded-2xl border border-white/15 bg-white p-2 shadow-2xl"
          >
            <span className="pl-2 text-muted-foreground">
              <Search className="h-5 w-5" />
            </span>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search houses, cars, cities, regions..."
              className="h-12 flex-1 border-0 bg-transparent text-base shadow-none focus-visible:ring-0"
            />
            <Button type="submit" className="h-12 shrink-0 rounded-xl px-5 font-semibold">
              Search
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </motion.form>

          <motion.div variants={fadeUp} custom={4} className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/#listings"
              className={buttonVariants({
                variant: "outline",
                className: "h-12 border-white/25 bg-white/10 px-6 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white",
              })}
            >
              Browse Properties
            </Link>
            <Link
              href="/#vehicles"
              className={buttonVariants({
                variant: "ghost",
                className: "h-12 px-6 text-white/85 hover:bg-white/10 hover:text-white",
              })}
            >
              <Car className="mr-1.5 h-4 w-4" />
              Explore Vehicles
            </Link>
          </motion.div>

          <motion.div variants={fadeUp} custom={5} className="mt-8 flex flex-wrap gap-4 text-sm text-white/65">
            {trustItems.map(({ icon: Icon, text }) => (
              <span key={text} className="inline-flex items-center gap-1.5">
                <Icon className="h-4 w-4 text-primary" />
                {text}
              </span>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="mt-14 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur-sm">
              <p className="text-2xl font-extrabold text-primary sm:text-3xl">{stat.value}</p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wide text-white/60">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
