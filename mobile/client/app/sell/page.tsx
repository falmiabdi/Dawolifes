"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Building2, Car, Loader2, Tag } from 'lucide-react'

import { useAuth } from '@/components/auth/auth-guard'
import { SiteHeader } from '@/components/site-header'

export default function SellPage() {
  const router = useRouter()
  const { user, loading, isVerified } = useAuth()

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace('/auth/login?redirect=/sell')
    } else if (!isVerified) {
      router.replace('/verify')
    }
  }, [loading, user, isVerified, router])

  if (loading || !user || !isVerified) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 bg-muted/30">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
          <div className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold text-foreground sm:text-2xl">Sell on DawoLife</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Choose what you want to list. Buyers will find it instantly.</p>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Link
              href="/post"
              className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                <Building2 className="h-7 w-7" />
              </div>
              <h2 className="mt-4 text-lg font-bold text-foreground">Post a Property</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                List a house, apartment, land or commercial space for sale or rent.
              </p>
            </Link>

            <Link
              href="/post/vehicle"
              className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                <Car className="h-7 w-7" />
              </div>
              <h2 className="mt-4 text-lg font-bold text-foreground">Post a Vehicle</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                List a car, SUV, truck or motorbike for sale or rental.
              </p>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
