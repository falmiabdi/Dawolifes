import Link from "next/link"
import { Mail, MapPin, Phone, Globe } from "lucide-react"
import { Logo } from "@/components/logo"

const quickLinks = ["Home", "Listings", "Map View", "Agents", "Post Property"]
const propertyTypes = ["Houses", "Apartments", "Land", "Commercial", "Villas"]

export function SiteFooter() {
  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-12 sm:px-6 sm:py-14 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo dark />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-secondary-foreground/70">
            Ethiopia&apos;s trusted real estate marketplace. Find your dream home, land, or commercial property.
          </p>
          <div className="mt-5 flex gap-3">
            {[Globe, Mail, Phone].map((Icon, i) => (
              <span
                key={i}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-secondary-foreground/80"
              >
                <Icon className="h-4 w-4" />
              </span>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide">Quick Links</h3>
          <ul className="mt-4 space-y-3 text-sm text-secondary-foreground/70">
            {quickLinks.map((link) => (
              <li key={link}>
                <Link href="/" className="block py-1 transition-colors hover:text-primary">
                  {link}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide">Property Types</h3>
          <ul className="mt-4 space-y-3 text-sm text-secondary-foreground/70">
            {propertyTypes.map((type) => (
              <li key={type}>
                <Link href="/" className="block py-1 transition-colors hover:text-primary">
                  {type}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide">Contact</h3>
          <ul className="mt-4 space-y-3 text-sm text-secondary-foreground/70">
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0 text-primary" /> <span>dawolife@gmail.com</span>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0 text-primary" /> <span>+251 911 000 000</span>
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-primary" /> <span>Addis Ababa, Ethiopia</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 px-4 py-5 text-center text-xs text-secondary-foreground/50">
        © {new Date().getFullYear()} DawoLife. All rights reserved. | Ethiopia Real Estate Marketplace
      </div>
    </footer>
  )
}
