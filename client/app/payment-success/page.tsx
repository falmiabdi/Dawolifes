"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import Link from "next/link"
import { CheckCircle2, ArrowLeft, Home } from "lucide-react"
import { SiteHeader } from "@/components/site-header"

function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const merchOrderId = searchParams.get("merch_order_id") || ""
  const txRef = searchParams.get("trx_ref") || searchParams.get("tx_ref") || ""
  const orderId = merchOrderId || txRef

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 bg-muted/30">
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>

          <div className="rounded-3xl border border-green-200 bg-green-50 p-8 text-center space-y-4">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-green-900">Payment Received</h1>
            <p className="text-sm text-green-700">
              Your payment has been received. We will verify and confirm your order shortly.
            </p>
            {orderId && (
              <p className="text-xs text-green-600 font-mono">Order ID: {orderId}</p>
            )}
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white hover:bg-green-700 transition"
            >
              <Home className="h-4 w-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  )
}
