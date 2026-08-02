"use client"

import type { ReactNode } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/logo'
import { LanguageDropdown } from '@/components/language-dropdown'
import { useI18n } from '@/lib/i18n'

export function AuthShell({
  title,
  children,
  footer,
  backgroundUrl = "/properties/hero-bg.png",
}: {
  title: string
  subtitle?: string
  children: ReactNode
  backgroundUrl?: string
  footer?: ReactNode
}) {
  const { t } = useI18n()

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-slate-950">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${backgroundUrl})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 bg-black/30 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo className="text-white" />
          <div className="flex items-center gap-3">
            <LanguageDropdown dark />
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow-sm backdrop-blur transition hover:border-orange-300 hover:text-orange-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              {t("home")}
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-white/95 p-6 shadow-2xl shadow-black/40 backdrop-blur sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
          {children}
          {footer && <div className="mt-6">{footer}</div>}
        </div>
      </div>
    </div>
  )
}
