"use client"

import { getApiUrl } from '@/lib/get-api-url'

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

const PAYMENT_METHODS = [
  { id: "telebirr", label: "TeleBirr", icon: Phone, color: "orange", description: "Pay with Ethio Telecom mobile money" },
  { id: "chapa", label: "Chapa", icon: CreditCard, color: "blue", description: "Pay with bank card, mobile, or other methods" },
]

function PayPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const presetType = searchParams.get("type") || ""
  const presetAmount = searchParams.get("amount") || ""
  const presetTitle = searchParams.get("title") || ""
  const propertyId = searchParams.get("propertyId") || ""

  const [paymentMethod, setPaymentMethod] = useState("telebirr")
  const [customAmount, setCustomAmount] = useState(presetAmount)
  const [title, setTitle] = useState(presetTitle)
  const [email, setEmail] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "redirect" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const [payUrl, setPayUrl] = useState("")
  const [polling, setPolling] = useState(false)
  const [activeTxRef, setActiveTxRef] = useState("")

  const pollStatus = useCallback(async (orderId: string, method: string) => {
    setPolling(true)
    let attempts = 0
    const maxAttempts = 60

    const check = async () => {
      try {
        let url: string
        if (method === "chapa") {
          url = `/api/chapa/verify?txRef=${orderId}`
        } else {
          url = `/api/telebirr/status?merchOrderId=${orderId}`
        }

        const res = await fetch(url)
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

    const amount = customAmount
    if (!amount || Number(amount) <= 0) {
      setStatus("error")
      setMessage("Please enter a valid amount.")
      return
    }

    if (paymentMethod === "chapa") {
      if (!email.trim() || !firstName.trim() || !lastName.trim() || !phoneNumber.trim()) {
        setStatus("error")
        setMessage("Please fill in all your information (name, email, phone) for Chapa payment.")
        return
      }
    }

    setStatus("loading")
    setMessage("")

    try {
      let data: any

      if (paymentMethod === "chapa") {
        const res = await fetch(`${getApiUrl()}/api/chapa/initialize`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            amount,
            propertyId,
            propertyTitle: title.trim(),
            paymentType: presetType || "service_charge",
            email,
            firstName,
            lastName,
            phoneNumber,
          }),
        })
        data = await res.json()
        if (!res.ok) throw new Error(data.message || "Payment initiation failed")

        if (data.checkoutUrl) {
          setPayUrl(data.checkoutUrl)
          setActiveTxRef(data.txRef)
          setStatus("redirect")
          setMessage("Opening Chapa checkout page...")
          pollStatus(data.txRef, "chapa")
        }
      } else {
        const res = await fetch(`${getApiUrl()}/api/telebirr/create-order`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            amount,
            propertyId,
            propertyTitle: title.trim(),
            paymentType: presetType || "service_charge",
          }),
        })
        data = await res.json()
        if (!res.ok) throw new Error(data.message || "Payment initiation failed")

        if (data.toPayUrl) {
          setPayUrl(data.toPayUrl)
          setStatus("redirect")
          setMessage("Opening TeleBirr payment page...")
          pollStatus(data.merchOrderId, "telebirr")
        }
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
    setActiveTxRef("")
  }

  const selectedMethod = PAYMENT_METHODS.find((m) => m.id === paymentMethod)

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
                <p className="text-sm text-muted-foreground">Pay listing fees or commissions via TeleBirr or Chapa</p>
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
                    <p className="font-semibold text-blue-900">
                      {paymentMethod === "chapa" ? "Chapa" : "TeleBirr"} Payment Ready
                    </p>
                    <p className="text-sm text-blue-700">
                      Click the button below to open the {paymentMethod === "chapa" ? "Chapa" : "TeleBirr"} checkout page
                    </p>
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
                Open {paymentMethod === "chapa" ? "Chapa" : "TeleBirr"} Payment Page
              </button>

              <p className="text-xs text-center text-slate-500">
                {paymentMethod === "chapa"
                  ? "You will be redirected to Chapa to complete payment with card, mobile, or bank"
                  : "You will be redirected to TeleBirr to enter your phone number and complete payment"}
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
                  Select Payment Method
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {PAYMENT_METHODS.map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id)}
                      className={`flex flex-col items-center gap-2 rounded-2xl border p-4 transition ${
                        paymentMethod === method.id
                          ? "border-orange-500 bg-orange-50 shadow-sm"
                          : "border-slate-200 bg-slate-50 hover:border-orange-300"
                      }`}
                    >
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        paymentMethod === method.id ? "bg-orange-100 text-orange-600" : "bg-slate-100 text-slate-500"
                      }`}>
                        <method.icon className="h-5 w-5" />
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-slate-900 text-sm">{method.label}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{method.description}</p>
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
                      placeholder="e.g., Service Charge: Villa in Bole"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">
                      Amount (ETB)
                    </label>
                    <input
                      type="number"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      placeholder="Enter amount"
                      min="1"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition"
                    />
                  </div>
                </div>
              </div>

              {paymentMethod === "chapa" && (
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-orange-500" />
                    Your Information
                  </h3>
                  <p className="text-xs text-slate-500">Required by Chapa to process your payment</p>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-1 block">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="Bilen"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-1 block">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Gizachew"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1 block">
                        Email
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1 block">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="0912345678"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition"
                      />
                      <p className="text-xs text-slate-400 mt-1">10 digits: 09xxxxxxxx or 07xxxxxxxx</p>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handlePay}
                disabled={!title.trim() || !customAmount || Number(customAmount) <= 0 || (paymentMethod === "chapa" && (!email.trim() || !firstName.trim() || !lastName.trim() || !phoneNumber.trim()))}
                className="w-full rounded-2xl bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-4 text-sm transition shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2"
              >
                <Wallet className="h-4 w-4" />
                Pay with {selectedMethod?.label || "TeleBirr"}
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

