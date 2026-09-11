"use client"

import { Menu, Phone } from "lucide-react"
import { StatusBadge } from "@/components/ui/status-badge"
import Image from "next/image"
import { NotificationBell } from "@/components/dashboard/notification-bell"
import { LanguageDropdown } from "@/components/language-dropdown"

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
  // Contact info (could come from env/settings)
  const supportPhone = "+251 911 000 001"

  return (
    <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-900 text-white">
      {/* Top bar: Support + Language (visible on lg+). Matches the sidebar's dark theme. */}
      <div className="hidden lg:flex lg:items-center lg:justify-between lg:px-6 lg:py-2 border-b border-slate-800 text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <a href={`tel:${supportPhone.replace(/\s/g, '')}`} className="flex items-center gap-1.5 hover:text-orange-400 transition">
            <Phone className="h-3.5 w-3.5" />
            <span>{supportPhone}</span>
          </a>
        </div>
        <div className="flex items-center gap-3">
          <LanguageDropdown dark />
        </div>
      </div>

      {/* Main header row */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-3 md:px-6 md:py-4">
        <div className="flex items-center gap-3 min-w-0">
          {/* Hamburger — only visible on mobile (< lg) */}
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="lg:hidden flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
          <h1 className="truncate text-base font-bold text-white md:text-lg">
            {title}
          </h1>
        </div>

        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          {/* Language selector (mobile/tablet only, lg+ uses top bar). Shares the pill style below. */}
          <LanguageDropdown dark className="lg:hidden" />

          <NotificationBell dark />

          {/* Profile summary — matches the language selector pill style.
              Profile/Settings/Sign Out live in the sidebar, so the header stays clean. */}
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800 px-3 py-1.5">
            {profilePhoto ? (
              <div className="h-8 w-8 shrink-0 rounded-full overflow-hidden bg-slate-700 ring-2 ring-orange-400/60">
                <Image
                  src={profilePhoto}
                  alt={name || "Profile"}
                  width={32}
                  height={32}
                  loading="eager"
                  className="h-full w-full object-contain"
                />
              </div>
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white">
                {name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="text-left leading-tight">
              <p className="text-sm font-semibold text-white truncate max-w-[160px]">{name}</p>
              {status && <StatusBadge status={status} />}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
