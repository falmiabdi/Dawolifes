"use client"

import type { ReactNode } from 'react'
import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'
import { Logo } from '@/components/logo'

export function AuthShell({
  title,
  subtitle,
  children,
  backgroundUrl,
  footer,
}: {
  title: string
  subtitle: string
  children: ReactNode
  backgroundUrl?: string
  footer?: ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur z-10">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-orange-300 hover:text-orange-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            Home
          </Link>
        </div>
      </header>

      {/* Main content */}
      <div
        className="flex-1 px-4 py-10 text-slate-900 sm:px-6 lg:px-8"
        style={
          backgroundUrl
            ? {
                backgroundImage: `url(${backgroundUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }
            : {
                background: 'radial-gradient(circle at top, rgba(249,115,22,0.18), transparent 40%), linear-gradient(135deg, #fff7ed 0%, #f8fafc 40%, #fef3c7 100%)',
              }
        }
      >
        <div className="relative mx-auto flex max-w-6xl flex-col gap-8 lg:flex-row lg:items-center">
          {backgroundUrl && (
            <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-black/40" />
          )}

          <div className={`relative flex-1 rounded-[28px] border border-white/70 p-8 shadow-2xl shadow-orange-100 backdrop-blur-xl ${backgroundUrl ? 'bg-white/90' : 'bg-white/80'}`}>
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-sm font-semibold text-orange-700">
              <ShieldCheck className="h-4 w-4" /> DawoLife Secure Access
            </div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
            <p className="mt-3 max-w-xl text-base text-slate-600">{subtitle}</p>
            <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50/80 p-6">
              <h2 className="text-lg font-semibold">Why agents trust DawoLife</h2>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                <li>• Secure onboarding with review-based approval.</li>
                <li>• Role-based access for admins, agents, and pending accounts.</li>
                <li>• Modern workflows that align with the DawoLife brand.</li>
              </ul>
            </div>
          </div>
          <div className={`relative flex-1 rounded-[28px] border border-slate-200 p-6 shadow-xl shadow-slate-200/70 sm:p-8 ${backgroundUrl ? 'bg-white/95' : 'bg-white/90'}`}>
            {children}
            {footer && <div className="mt-6">{footer}</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
