"use client"

import { getApiUrl } from '@/lib/get-api-url'

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { useAuth } from "@/components/auth/auth-guard"

import {
  LayoutDashboard,
  User,
  Building2,
  PlusCircle,
  MessageSquare,
  Bell,
  CreditCard,
  Settings,
  LogOut,
  Home,
  Car,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

const agentNav = [
  { href: "/agent", label: "Dashboard", icon: LayoutDashboard },
  { href: "/agent/profile", label: "Profile", icon: User },
  { href: "/agent/properties", label: "My Properties", icon: Building2 },
  { href: "/agent/post", label: "Post Property", icon: PlusCircle },
  { href: "/agent/vehicles", label: "My Vehicles", icon: Car },
  { href: "/agent/post/vehicle", label: "Post Vehicle", icon: PlusCircle },
  { href: "/agent/messages", label: "Messages", icon: MessageSquare },
  { href: "/agent/notifications", label: "Notifications", icon: Bell },
  { href: "/agent/payments", label: "Payments", icon: CreditCard },
  { href: "/agent/settings", label: "Settings", icon: Settings },
]

const adminNav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/agents", label: "Agent Management", icon: User },
  { href: "/admin/properties", label: "Properties", icon: Building2 },
  { href: "/admin/vehicles", label: "Vehicles", icon: Car },
  { href: "/admin/users", label: "Users", icon: User },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/settings", label: "Settings", icon: Settings },
]

interface SidebarProps {
  role: "agent" | "admin"
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ role, isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { logout, getToken } = useAuth()
  const nav = role === "admin" ? adminNav : agentNav
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchUnreadCount = useCallback(async () => {
    const token = await getToken()
    if (!token) return
    fetch(`${getApiUrl()}/api/notifications/count`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (typeof data.count === "number") setUnreadCount(data.count)
      })
      .catch(() => {})
  }, [getToken])

  useEffect(() => {
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [fetchUnreadCount])

  const isActive = useCallback(
    (path: string) => {
      if (path === "/") return pathname === "/"
      if (pathname === path) return true
      if (pathname.startsWith(`${path}/`)) return true
      return false
    },
    [pathname],
  )

  const sidebarContent = (
    <aside className="flex h-full w-64 flex-col border-r border-slate-800 bg-slate-900 text-white">
      {/* Logo + close button (close only visible when drawer on mobile) */}
      <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500">
            <Home className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-extrabold tracking-tight">
            Dela<span className="text-orange-400">Harme</span>
          </span>
        </div>
        {/* Close button â€” only useful in mobile drawer mode */}
        <button
          onClick={onClose}
          className="lg:hidden flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition"
          aria-label="Close sidebar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Role tag */}
      <div className="px-6 py-3">
        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
          {role} portal
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {nav.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          const showBadge = (item.href === "/agent/notifications" || item.href === "/admin/notifications") && unreadCount > 0
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "mb-1 flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {showBadge && (
                <span className="inline-flex items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white min-w-[18px]">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-800 p-4">
        <button
          onClick={() => {
            logout()
            router.push("/login")
          }}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-red-900/30 hover:text-red-400"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  )

  return (
    <>
      {/* â”€â”€ Desktop (lg+): static sidebar column â”€â”€ */}
      <div className="hidden lg:flex lg:h-screen lg:w-64 lg:flex-shrink-0">
        {sidebarContent}
      </div>

      {/* â”€â”€ Mobile: slide-in drawer with backdrop â”€â”€ */}
      {/* Backdrop overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Drawer panel */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transition-transform duration-300 ease-in-out lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </div>
    </>
  )
}

