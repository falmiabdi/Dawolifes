import Link from "next/link"
import { useEffect, useState } from "react"
import { Mail, MapPin, MessageCircle, Music2, Phone, Send } from "lucide-react"
import { Logo } from "@/components/logo"
import { getApiUrl } from "@/lib/get-api-url"

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.9 3.78-3.9 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.9h-2.33V22c4.78-.76 8.44-4.92 8.44-9.94Z" />
    </svg>
  )
}

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
  { label: "News", href: "/news" },
  { label: "Register", href: "/register" },
]

interface Settings {
  contactPhone1?: string
  contactPhone2?: string
  contactPhone3?: string
  contactEmail?: string
  socialFacebook?: string
  socialTelegram?: string
  socialWhatsapp?: string
  socialTiktok?: string
}

export function WebFooter() {
  const [settings, setSettings] = useState<Settings>({})

  useEffect(() => {
    let active = true
    fetch(`${getApiUrl()}/api/settings`)
      .then((r) => r.json())
      .then((data) => {
        if (active && data) setSettings(data)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  const phones = [settings.contactPhone1, settings.contactPhone2, settings.contactPhone3].filter(Boolean) as string[]
  const email = settings.contactEmail || "info@dawolife.com"

  const socials = [
    { label: "Facebook", href: settings.socialFacebook, icon: FacebookIcon },
    { label: "Telegram", href: settings.socialTelegram, icon: Send },
    { label: "WhatsApp", href: settings.socialWhatsapp, icon: MessageCircle },
    { label: "TikTok", href: settings.socialTiktok, icon: Music2 },
  ].filter((s) => s.href)

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
            {socials.length > 0 && (
              <div className="mt-5 flex gap-3">
                {socials.map(({ label, href, icon: Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-secondary-foreground/70 transition-colors hover:border-primary hover:bg-primary hover:text-white"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            )}
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
                <a href={`mailto:${email}`} className="transition-colors hover:text-primary">
                  {email}
                </a>
              </li>
              {phones.map((phone) => (
                <li key={phone} className="flex items-start gap-2.5">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <a href={`tel:${phone.replace(/[^0-9+]/g, "")}`} className="transition-colors hover:text-primary">
                    {phone}
                  </a>
                </li>
              ))}
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
