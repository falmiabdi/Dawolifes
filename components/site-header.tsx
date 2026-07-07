"use client"

import { useState } from "react"
import Link from "next/link"
import { Globe, Menu, Plus, X } from "lucide-react"
import { Logo } from "@/components/logo"
import { buttonVariants } from "@/components/ui/button"

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Listings", href: "/#listings" },
  { label: "Find Rental", href: "/#listings" },
  { label: "Map View", href: "/#map" },
  { label: "Agents", href: "/#agents" },
]

export function SiteHeader() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="hidden items-center justify-between bg-secondary px-6 py-1.5 text-xs text-secondary-foreground/80 md:flex">
        <span>delaharme@gmail.com</span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Globe className="h-3.5 w-3.5" /> English
          </span>
          <Link href="/login" className="hover:text-primary">
            Login
          </Link>
          <span className="text-secondary-foreground/30">|</span>
          <Link href="/register" className="hover:text-primary">
            Register
          </Link>
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
            <span className="text-sm font-medium text-foreground/70">More</span>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/post"
              className={buttonVariants({ className: "hidden rounded-full font-semibold sm:inline-flex" })}
            >
              <Plus className="h-4 w-4" /> POST
            </Link>
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
                  className="rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-muted"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/post"
                onClick={() => setOpen(false)}
                className={buttonVariants({ className: "mt-2 rounded-full font-semibold" })}
              >
                <Plus className="h-4 w-4" /> POST
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
