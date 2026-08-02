import Link from "next/link"
import { AtSign, Globe, Mail, MapPin, Phone, Send, Share2 } from "lucide-react"
import { Logo } from "@/components/logo"

const serviceLinks = [
  { label: "Buy a House", href: "/#listings" },
  { label: "Rent a House", href: "/#listings" },
  { label: "Sell a Property", href: "/sell" },
  { label: "Sell a Vehicle", href: "/sell" },
  { label: "Post a Free Ad", href: "/sell" },
  { label: "Agent Dashboard", href: "/auth/login" },
]

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "Houses", href: "/#listings" },
  { label: "Cars", href: "/#vehicles" },
  { label: "Map View", href: "/#map" },
  { label: "Our Services", href: "/#services" },
  { label: "Register", href: "/register" },
]

const socials = [
  { label: "Website", href: "#", icon: Globe },
  { label: "Facebook", href: "#", icon: Share2 },
  { label: "Telegram", href: "#", icon: Send },
  { label: "Email", href: "#", icon: AtSign },
]

export function WebFooter() {
  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo dark />
            <p className="mt-4 text-sm leading-relaxed text-secondary-foreground/70">
              DawoLife is Ethiopia&apos;s trusted marketplace for real estate and
              vehicles. We connect buyers, sellers, and agents with verified
              listings and honest deals — from dream homes to dream rides.
            </p>
            <div className="mt-5 flex gap-3">
              {socials.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-secondary-foreground/70 transition-colors hover:border-primary hover:bg-primary hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-white">Services</h3>
            <ul className="mt-4 space-y-2.5">
              {serviceLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-secondary-foreground/70 transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-white">Quick Links</h3>
            <ul className="mt-4 space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-secondary-foreground/70 transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-white">Contact</h3>
            <ul className="mt-4 space-y-3 text-sm text-secondary-foreground/70">
              <li className="flex items-start gap-2.5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <a href="mailto:dawolife@gmail.com" className="transition-colors hover:text-primary">
                  dawolife@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <a href="tel:+251900000000" className="transition-colors hover:text-primary">
                  +251 900 000 000
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>Addis Ababa, Ethiopia</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-xs text-secondary-foreground/50 sm:flex-row sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} DawoLife. All rights reserved.</p>
          <div className="flex gap-5">
            <Link href="/" className="transition-colors hover:text-primary">
              Privacy Policy
            </Link>
            <Link href="/" className="transition-colors hover:text-primary">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
