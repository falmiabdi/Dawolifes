import { Menu } from "lucide-react"
import { StatusBadge } from "@/components/ui/status-badge"
import Image from "next/image"
import { NotificationBell } from "@/components/dashboard/notification-bell"

interface DashboardHeaderProps {
  name: string
  email: string
  status?: string
  title: string
  profilePhoto?: string | null
  onToggleSidebar?: () => void
}

export function DashboardHeader({
  name,
  email,
  status,
  title,
  profilePhoto,
  onToggleSidebar,
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur-sm md:px-6 md:py-4">
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
        <NotificationBell />
        <div className="flex items-center gap-2 md:gap-3">
          {profilePhoto ? (
            <div className="h-9 w-9 shrink-0 rounded-full overflow-hidden bg-orange-100 ring-2 ring-orange-200">
              <Image
                src={profilePhoto}
                alt={name || "Profile"}
                width={36}
                height={36}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-slate-800 leading-tight">{name}</p>
            {status && <StatusBadge status={status} />}
          </div>
        </div>
      </div>
    </header>
  )
}
