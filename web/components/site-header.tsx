"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, Plus, X, User, ChevronDown, Newspaper } from "lucide-react"
import { Logo } from "@/components/logo"
import { buttonVariants } from "@/components/ui/button"
import Image from "next/image"
import { LanguageDropdown } from "@/components/language-dropdown"
import { useI18n } from "@/lib/i18n"
import { useAuth } from "@/components/auth/auth-guard"

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Houses", href: "/#listings" },
  { label: "Cars", href: "/#vehicles" },
  { label: "Services", href: "/#services" },
  { label: "Map View", href: "/#map" },
  { label: "Agents", href: "/#agents" },
]

const moreLinks = [
  { label: "News", href: "/news", icon: Newspaper },
  { label: "Sell", href: "/sell", icon: Plus },
  { label: "Login", href: "/login", icon: User },
  { label: "Register", href: "/register", icon: User },
]

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const { t } = useI18n()
  const { user } = useAuth()
  const isAuth = !!user
  const photoUrl = user?.profilePhoto || null

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="hidden items-center justify-between bg-secondary px-6 py-1.5 text-xs text-secondary-foreground/80 md:flex">
        <span>dawolife@gmail.com</span>
        <div className="flex items-center gap-4">
          <LanguageDropdown className="hidden sm:block" />
          {isAuth ? (
            <Link href={user.role === "admin" ? "/admin" : user.role === "agent" ? "/agent" : "/dashboard"} className="flex items-center gap-2 hover:opacity-80 transition">
              {photoUrl ? (
                <div className="h-6 w-6 rounded-full overflow-hidden bg-primary/10 ring-2 ring-primary/30">
                  <Image src={photoUrl} alt={user.name || "Profile"} width={24} height={24} className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[10px] ring-2 ring-primary/30">
                  {(user.name || user.email || "?").charAt(0).toUpperCase()}
                </div>
              )}
              <span className="font-semibold">{user.name || user.email}</span>
            </Link>
          ) : (
            <>
              <Link href="/login" className="hover:text-primary">{t('login')}</Link>
              <span className="text-secondary-foreground/30">|</span>
              <Link href="/register" className="hover:text-primary">{t('register')}</Link>
            </>
          )}
        </div>
      </div>

      <div className="border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Logo />

          <nav className="hidden items-center gap-7 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-foreground/70 transition-colors hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
            <div className="relative">
              <button
                className="flex items-center gap-1 text-sm font-medium text-foreground/70 transition-colors hover:text-primary"
                onClick={() => setMoreOpen((o) => !o)}
                aria-expanded={moreOpen}
                aria-haspopup="menu"
              >
                More
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${moreOpen ? "rotate-180" : ""}`} />
              </button>
              {moreOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setMoreOpen(false)}
                    aria-hidden="true"
                  />
                  <div
                    role="menu"
                    className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-2xl border border-border bg-card p-1.5 shadow-xl"
                  >
                    {moreLinks.map((link) => {
                      const Icon = link.icon
                      return (
                        <Link
                          key={link.label}
                          href={link.href}
                          onClick={() => setMoreOpen(false)}
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground/80 transition hover:bg-muted"
                        >
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          {link.label}
                        </Link>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          </nav>

          <div className="flex items-center gap-2">
            {isAuth && (
              <Link href={user.role === "admin" ? "/admin" : user.role === "agent" ? "/agent" : "/dashboard"} className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/5 border border-primary/20 hover:bg-primary/10 transition text-sm font-medium text-primary">
                {photoUrl ? (
                  <div className="h-7 w-7 rounded-full overflow-hidden bg-primary/10">
                    <Image src={photoUrl} alt={user.name || "Profile"} width={28} height={28} className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center font-bold text-xs">
                    {(user.name || user.email || "?").charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="line-clamp-1">{user.name || user.email}</span>
              </Link>
            )}
            <button
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-foreground lg:hidden"
              onClick={() => setOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {open && (
          <nav className="border-t border-border bg-card px-4 py-3 lg:hidden">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-3 text-sm font-medium text-foreground/80 hover:bg-muted min-h-[44px] flex items-center"
                >
                  {link.label}
                </Link>
              ))}
              {moreLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-3 text-sm font-medium text-foreground/80 hover:bg-muted min-h-[44px] flex items-center"
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-2 border-t border-border pt-2 flex flex-col gap-1">
                {isAuth ? (
                  <Link
                    href={user.role === "admin" ? "/admin" : user.role === "agent" ? "/agent" : "/dashboard"}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-3 text-sm font-semibold text-primary hover:bg-muted min-h-[44px] flex items-center gap-2"
                  >
                    {photoUrl ? (
                      <div className="h-6 w-6 rounded-full overflow-hidden bg-primary/10">
                        <Image src={photoUrl} alt={user.name || "Profile"} width={24} height={24} className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center font-bold text-[10px]">
                        {(user.name || user.email || "?").charAt(0).toUpperCase()}
                      </div>
                    )}
                    {t('dashboard')}
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setOpen(false)}
                      className="rounded-lg px-3 py-3 text-sm font-semibold text-foreground/80 hover:bg-muted min-h-[44px] flex items-center"
                    >
                    {t('login')}
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setOpen(false)}
                      className="rounded-lg px-3 py-3 text-sm font-semibold text-primary hover:bg-muted min-h-[44px] flex items-center"
                    >
                      {t('register')}
                    </Link>
                  </>
                )}
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
