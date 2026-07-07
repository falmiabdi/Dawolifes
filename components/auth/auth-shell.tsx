"use client"

import type { ReactNode } from 'react'
import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.18),_transparent_40%),linear-gradient(135deg,#fff7ed_0%,#f8fafc_40%,#fef3c7_100%)] px-4 py-10 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 lg:flex-row lg:items-center">
        <div className="flex-1 rounded-[28px] border border-white/70 bg-white/80 p-8 shadow-2xl shadow-orange-100 backdrop-blur-xl">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-sm font-semibold text-orange-700">
            <ShieldCheck className="h-4 w-4" /> DelaHarme Secure Access
          </div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-3 max-w-xl text-base text-slate-600">{subtitle}</p>
          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50/80 p-6">
            <h2 className="text-lg font-semibold">Why agents trust DelaHarme</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li>• Secure onboarding with review-based approval.</li>
              <li>• Role-based access for admins, agents, and pending accounts.</li>
              <li>• Modern workflows that align with the DelaHarme brand.</li>
            </ul>
          </div>
        </div>
        <div className="flex-1 rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-xl shadow-slate-200/70 sm:p-8">
          {children}
          <p className="mt-6 text-center text-sm text-slate-500">
            Need a new account?{' '}
            <Link className="font-semibold text-orange-600 hover:text-orange-700" href="/register">
              Register as an agent
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
