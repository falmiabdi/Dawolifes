"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  Wallet,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Clock,
  Home,
  CreditCard,
  Shield,
  Phone,
  ExternalLink,
} from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

const COMMISSION_TYPES = [
  {
    id: "service_charge",
    label: "Listing Service Fee",
    defaultAmount: "500",
    description: "One-time fee to activate premium listing features",
  },
  {
    id: "selling_commission",
    label: "Selling Commission (2.5%)",
    defaultAmount: "",
    description: "2.5% commission on successful property sale",
  },
  {
    id: "renting_commission",
    label: "Renting Commission (5%)",
    defaultAmount: "",
    description: "5% commission on successful property rental",
  },
]

function PayPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const presetType = searchParams.get("type") || "service_charge"
  const presetAmount = searchParams.get("amount") || ""
  const presetTitle = searchParams.get("title") || ""
  const propertyId = searchParams.get("propertyId") || ""

  const [paymentType, setPaymentType] = useState(presetType)
  const [customAmount, setCustomAmount] = useState(presetAmount)
  const [title, setTitle] = useState(presetTitle)
  const [status, setStatus] = useState<"idle" | "loading" | "redirect" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const [payUrl, setPayUrl] = useState("")
  const [polling, setPolling] = useState(false)

  useEffect(() => {
    const type = COMMISSION_TYPES.find((t) => t.id === paymentType)
    if (paymentType === "service_charge" && !customAmount) {
      setCustomAmount(type?.defaultAmount || "500")
    }
  }, [paymentType, customAmount])

  const pollStatus = useCallback(async (merchOrderId: string) => {
    setPolling(true)
    let attempts = 0
    const maxAttempts = 60

    const check = async () => {
      try {
        const res = await fetch(`/api/telebirr/status?merchOrderId=${merchOrderId}`)
        const data = await res.json()

        if (data.status === "Completed") {
          setStatus("success")
          setMessage("Payment completed successfully!")
          setPolling(false)
          return
        }
        if (data.status === "Failed" || data.status === "Refunded") {
          setStatus("error")
          setMessage("Payment was not completed. Please try again.")
          setPolling(false)
          return
        }

        attempts++
        if (attempts < maxAttempts) {
          setTimeout(check, 5000)
        } else {
          setPolling(false)
          setMessage("Payment is still being processed. Check back later.")
        }
      } catch {
        attempts++
        if (attempts < maxAttempts) {
          setTimeout(check, 5000)
        } else {
          setPolling(false)
        }
      }
    }

    setTimeout(check, 3000)
  }, [])

  async function handlePay() {
    if (!title.trim()) {
      setStatus("error")
      setMessage("Please enter a description for the payment.")
      return
    }

    const amount = paymentType === "service_charge" ? (customAmount || "500") : customAmount
    if (!amount || Number(amount) <= 0) {
      setStatus("error")
      setMessage("Please enter a valid amount.")
      return
    }

    setStatus("loading")
    setMessage("")

    try {
      const res = await fetch("/api/telebirr/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          amount,
          propertyId,
          propertyTitle: title.trim(),
          paymentType,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Payment initiation failed")
      }

      if (data.toPayUrl) {
        setPayUrl(data.toPayUrl)
        setStatus("redirect")
        setMessage("Opening TeleBirr payment page...")
        pollStatus(data.merchOrderId)
      }
    } catch (err: any) {
      setStatus("error")
      setMessage(err.message || "Something went wrong. Please try again.")
    }
  }

  function openPayPage() {
    if (payUrl) {
      window.location.href = payUrl
    }
  }

  function reset() {
    setStatus("idle")
    setMessage("")
    setPolling(false)
    setPayUrl("")
  }

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

          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Commission Payment</h1>
                <p className="text-sm text-muted-foreground">Pay listing fees or commissions via TeleBirr</p>
              </div>
            </div>
          </div>

          {status === "success" && (
            <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-green-900">Payment Successful</p>
                  <p className="text-sm text-green-700">{message}</p>
                </div>
              </div>
              <button
                onClick={reset}
                className="mt-4 w-full rounded-xl border border-green-200 bg-white py-2.5 text-sm font-semibold text-green-800 hover:bg-green-50 transition"
              >
                Make Another Payment
              </button>
            </div>
          )}

          {status === "error" && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="font-semibold text-red-900">Payment Error</p>
                  <p className="text-sm text-red-700">{message}</p>
                </div>
              </div>
              <button
                onClick={reset}
                className="mt-4 w-full rounded-xl border border-red-200 bg-white py-2.5 text-sm font-semibold text-red-800 hover:bg-red-50 transition"
              >
                Try Again
              </button>
            </div>
          )}

          {status === "redirect" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                    <Phone className="h-5 w-5 text-blue-600 animate-pulse" />
                  </div>
                  <div>
                    <p className="font-semibold text-blue-900">TeleBirr Payment Ready</p>
                    <p className="text-sm text-blue-700">Click the button below to open the TeleBirr payment page</p>
                    {polling && (
                      <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Waiting for payment confirmation...
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={openPayPage}
                className="w-full rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 text-sm transition shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Open TeleBirr Payment Page
              </button>

              <p className="text-xs text-center text-slate-500">
                You will be redirected to TeleBirr to enter your phone number and complete payment
              </p>

              <button
                onClick={reset}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
            </div>
          )}

          {status === "idle" && (
            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Home className="h-4 w-4 text-orange-500" />
                  Select Payment Type
                </h3>
                <div className="space-y-3">
                  {COMMISSION_TYPES.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => {
                        setPaymentType(type.id)
                        if (type.defaultAmount) setCustomAmount(type.defaultAmount)
                        else setCustomAmount("")
                      }}
                      className={`w-full text-left rounded-2xl border p-4 transition ${
                        paymentType === type.id
                          ? "border-orange-500 bg-orange-50 shadow-sm"
                          : "border-slate-200 bg-slate-50 hover:border-orange-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{type.label}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{type.description}</p>
                        </div>
                        <div className="text-right">
                          {type.defaultAmount ? (
                            <p className="font-bold text-orange-600">ETB {type.defaultAmount}</p>
                          ) : (
                            <p className="text-xs text-slate-400">Variable</p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-orange-500" />
                  Payment Details
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">
                      Description
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Listing Fee: Villa in Bole"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition"
                    />
                  </div>

                  {paymentType !== "service_charge" && (
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1 block">
                        Property Value (ETB)
                      </label>
                      <input
                        type="number"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        placeholder="Enter property value"
                        min="1"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition"
                      />
                      {customAmount && Number(customAmount) > 0 && (
                        <p className="mt-1 text-xs text-slate-500">
                          Commission ({paymentType === "selling_commission" ? "2.5%" : "5%"}): ETB{" "}
                          {(Number(customAmount) * (paymentType === "selling_commission" ? 0.025 : 0.05)).toFixed(2)}
                        </p>
                      )}
                    </div>
                  )}

                  {paymentType === "service_charge" && (
                    <div className="rounded-xl bg-orange-50 border border-orange-100 p-3">
                      <p className="text-sm font-semibold text-orange-900">
                        Fixed Amount: ETB {customAmount || "500"}
                      </p>
                      <p className="text-xs text-orange-700 mt-0.5">
                        One-time service charge for listing activation
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-orange-500" />
                  Payment Method
                </h3>
                <div className="flex items-center gap-3 rounded-xl bg-slate-50 border border-slate-200 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600 font-bold text-sm">
                    TB
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">TeleBirr Mobile Money</p>
                    <p className="text-xs text-slate-500">Pay with your Ethio Telecom phone number</p>
                  </div>
                </div>
              </div>

              <button
                onClick={handlePay}
                disabled={!title.trim() || !customAmount || Number(customAmount) <= 0}
                className="w-full rounded-2xl bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-4 text-sm transition shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2"
              >
                <Wallet className="h-4 w-4" />
                Pay with TeleBirr
              </button>

              <div className="flex items-center justify-center gap-6 text-xs text-slate-400 pb-8">
                <span className="flex items-center gap-1">
                  <Shield className="h-3.5 w-3.5" />
                  Secure Payment
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Instant Confirmation
                </span>
              </div>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}

export default function PayPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    }>
      <PayPageContent />
    </Suspense>
  )
}
