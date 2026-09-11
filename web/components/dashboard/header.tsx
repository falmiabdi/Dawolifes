"use client"

import { useState } from "react"
import { Menu, LogOut, User, Settings, ChevronDown, Phone, Globe, MessageSquare, Link2 } from "lucide-react"
import { StatusBadge } from "@/components/ui/status-badge"
import Image from "next/image"
import { NotificationBell } from "@/components/dashboard/notification-bell"
import { LanguageDropdown } from "@/components/language-dropdown"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/auth-guard"
import Link from "next/link"

interface DashboardHeaderProps {
  name: string
  email: string
  status?: string
  title: string
  profilePhoto?: string | null
  onToggleSidebar?: () => void
  role: "agent" | "admin" | "owner"
}

export function DashboardHeader({
  name,
  email,
  status,
  title,
  profilePhoto,
  onToggleSidebar,
  role,
}: DashboardHeaderProps) {
  const router = useRouter()
  const { logout } = useAuth()
  const [showDropdown, setShowDropdown] = useState(false)
  const profileHref = role === "admin" ? "/admin/profile" : "/agent/profile"
  const settingsHref = role === "admin" ? "/admin/settings" : "/agent/settings"

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  // Contact info (could come from env/settings)
  const supportPhone = "+251 911 000 001"
  const socialLinks = [
    { icon: Globe, href: "https://dawolife.com", label: "Website" },
    { icon: MessageSquare, href: "https://facebook.com/dawolife", label: "Facebook" },
    { icon: Link2, href: "https://twitter.com/dawolife", label: "Twitter" },
    { icon: MessageSquare, href: "https://instagram.com/dawolife", label: "Instagram" },
  ]

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur-sm">
      {/* Top bar: Phone + Social + Language (visible on lg+) */}
      <div className="hidden lg:flex lg:items-center lg:justify-between lg:px-6 lg:py-2 border-b border-slate-100 text-xs text-slate-500">
        <div className="flex items-center gap-4">
          <a href={`tel:${supportPhone.replace(/\s/g, '')}`} className="flex items-center gap-1.5 hover:text-orange-600 transition">
            <Phone className="h-3.5 w-3.5" />
            <span>{supportPhone}</span>
          </a>
          <div className="flex items-center gap-3">
            {socialLinks.map(({ icon: Icon, href, label }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-orange-600 transition" aria-label={label}>
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <LanguageDropdown />
        </div>
      </div>

      {/* Main header row */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur-sm md:px-6 md:py-4">
        <div className="flex items-center gap-3 min-w-0">
          {/* Hamburger — only visible on mobile (< lg) */}
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="lg:hidden flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
          <h1 className="truncate text-base font-bold text-slate-900 md:text-lg">
            {title}
          </h1>
        </div>

        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          {/* Language selector (mobile/tablet only, lg+ uses top bar) */}
          <LanguageDropdown className="lg:hidden" />

          <NotificationBell />

          {/* Desktop: Profile + Logout inline */}
          <div className="hidden lg:flex lg:items-center lg:gap-3">
            <Link
              href={profileHref}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
            >
              <User className="h-4 w-4" />
              <span>Profile</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>

          {/* Mobile/Tablet: Avatar dropdown */}
          <div className="relative flex items-center gap-2 md:gap-3 lg:hidden">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 md:gap-3 focus:outline-none"
              aria-expanded={showDropdown}
              aria-haspopup="true"
            >
              {profilePhoto ? (
                <div className="h-9 w-9 shrink-0 rounded-full overflow-hidden bg-orange-100 ring-2 ring-orange-200">
                  <Image
                    src={profilePhoto}
                    alt={name || "Profile"}
                    width={36}
                    height={36}
                    loading="eager"
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white">
                  {name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-slate-800 leading-tight">{name}</p>
                {status && <StatusBadge status={status} />}
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400 hidden sm:block" />
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-200 bg-white shadow-lg py-1 z-50 animate-in fade-in-0 zoom-in-95 duration-150">
                <Link
                  href={profileHref}
                  onClick={() => setShowDropdown(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
                >
                  <User className="h-4 w-4" /> Profile
                </Link>
                <Link
                  href={settingsHref}
                  onClick={() => setShowDropdown(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
                >
                  <Settings className="h-4 w-4" /> Settings
                </Link>
                <hr className="my-1 border-slate-100" />
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                >
                  <LogOut className="h-4 w-4" /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
