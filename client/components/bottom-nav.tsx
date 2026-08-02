"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { Home, Bookmark, Tag, MessageCircle, User } from "lucide-react"
import { useAuth } from "@/components/auth/auth-guard"
import { getApiUrl } from "@/lib/get-api-url"
import { cn } from "@/lib/utils"

const SCROLL_THRESHOLD = 10
const HIDE_ANIMATION = { duration: 0.25, ease: "easeInOut" as const }

// Portals / auth flows have their own navigation — hide the bottom bar there.
const HIDDEN_PATHS = ["/admin", "/agent", "/login", "/register", "/auth", "/listings"]

interface NavItem {
  label: string
  icon: typeof Home
  href?: string
  action?: () => void
  match?: (pathname: string) => boolean
}

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isLoggedIn, isVerified, getToken } = useAuth()
  const [unread, setUnread] = useState(0)
  const [navHidden, setNavHidden] = useState(false)
  const lastScrollY = useRef(0)
  const ticking = useRef(false)

  const hidden = HIDDEN_PATHS.some((path) => pathname.startsWith(path))

  // Reset visibility whenever the route changes
  useEffect(() => {
    lastScrollY.current = window.scrollY
    setNavHidden(false)
  }, [pathname])

  // Scroll-based show/hide (hide on scroll down, show on scroll up, always visible near the top)
  useEffect(() => {
    if (hidden || typeof window === "undefined") return
    lastScrollY.current = window.scrollY

    const onScroll = () => {
      if (ticking.current) return
      ticking.current = true
      requestAnimationFrame(() => {
        const y = window.scrollY
        const delta = y - lastScrollY.current

        if (y < SCROLL_THRESHOLD) {
          setNavHidden(false)
        } else if (delta > SCROLL_THRESHOLD) {
          setNavHidden(true)
        } else if (delta < -SCROLL_THRESHOLD) {
          setNavHidden(false)
        }

        lastScrollY.current = y
        ticking.current = false
      })
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [hidden])

  useEffect(() => {
    if (hidden || !user) {
      setUnread(0)
      return
    }

    let cancelled = false

    const loadUnread = async () => {
      try {
        const token = await getToken()
        if (!token) return
        const res = await fetch(`${getApiUrl()}/api/messages/unread`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        })
        if (cancelled) return
        if (res.ok) {
          const data = await res.json()
          setUnread(data.count || 0)
        } else {
          setUnread(0)
        }
      } catch {
        if (!cancelled) setUnread(0)
      }
    }

    loadUnread()
    const interval = setInterval(loadUnread, 30000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [hidden, user, getToken])

  if (hidden) return null

  const profileHref = !user ? "/auth/login" : user.role === "admin" ? "/admin" : user.role === "agent" ? "/agent" : "/verify"

  const items: NavItem[] = [
    { label: "Home", href: "/", icon: Home, match: (p) => p === "/" },
    {
      label: "Saved",
      icon: Bookmark,
      match: (p) => p.startsWith("/saved"),
      action: () => {
        if (!isLoggedIn) router.push("/auth/signup")
        else router.push("/saved")
      },
    },
    {
      label: "Sell",
      icon: Tag,
      match: (p) => p.startsWith("/sell") || p.startsWith("/post"),
      action: () => {
        if (!user) router.push("/auth/login")
        else if (!isVerified) router.push("/verify")
        else router.push("/sell")
      },
    },
    {
      label: "Messages",
      icon: MessageCircle,
      match: (p) => p.startsWith("/messages") || p.startsWith("/agent/messages"),
      action: () => {
        if (!isLoggedIn) router.push("/auth/login")
        else router.push("/messages")
      },
    },
    { label: "Profile", href: profileHref, icon: User, match: (p) => p.startsWith("/verify") || p.startsWith("/admin") || p.startsWith("/agent") || p.startsWith("/account") },
  ]

  return (
    <motion.nav
      initial={false}
      animate={{ y: navHidden ? "100%" : "0%" }}
      transition={HIDE_ANIMATION}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-white shadow-[0_-2px_12px_rgba(0,0,0,0.06)] lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Bottom navigation"
    >
      <div className="flex h-16 items-stretch">
        {items.map((item) => {
          const active = item.match ? item.match(pathname) : false
          const Icon = item.icon

          if (item.action) {
            return (
              <button
                key={item.label}
                type="button"
                onClick={item.action}
                className="flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5"
                aria-label={item.label}
              >
                <span className="relative">
                  <Icon
                    className={cn("h-6 w-6 transition-colors", active ? "text-primary" : "text-muted-foreground")}
                    strokeWidth={active ? 2.2 : 1.8}
                  />
                  {item.label === "Messages" && unread > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold leading-none text-white">
                      {unread > 99 ? "99+" : unread}
                    </span>
                  )}
                </span>
                <span
                  className={cn(
                    "text-[10px] transition-colors",
                    active ? "font-semibold text-primary" : "font-medium text-muted-foreground"
                  )}
                >
                  {item.label}
                </span>
              </button>
            )
          }

          return (
            <Link
              key={item.label}
              href={item.href || "/"}
              className="flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5"
              aria-label={item.label}
            >
              <span className="relative">
                <Icon
                  className={cn("h-6 w-6 transition-colors", active ? "text-primary" : "text-muted-foreground")}
                  strokeWidth={active ? 2.2 : 1.8}
                />
              </span>
              <span
                className={cn(
                  "text-[10px] transition-colors",
                  active ? "font-semibold text-primary" : "font-medium text-muted-foreground"
                )}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </motion.nav>
  )
}
