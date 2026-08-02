"use client"

import { useRouter } from "next/navigation"
import { Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PayServiceChargeProps {
  propertyId: string
  propertyTitle: string
}

export function PayServiceCharge({ propertyId, propertyTitle }: PayServiceChargeProps) {
  const router = useRouter()

  function handlePay() {
    const params = new URLSearchParams({
      type: "service_charge",
      title: `Service Charge - ${propertyTitle}`,
      propertyId,
    })
    router.push(`/pay?${params.toString()}`)
  }

  return (
    <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-orange-950">
        <Wallet className="h-4 w-4 text-orange-600" />
        <span>Pay Service Charge (ETB 500)</span>
      </div>
      <p className="text-xs text-orange-700">
        A one-time service fee to access premium listing features via TeleBirr or Chapa.
      </p>
      <Button
        onClick={handlePay}
        className="w-full rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold min-h-[44px]"
      >
        <span className="flex items-center gap-2">
          <Wallet className="h-4 w-4" />
          Pay Service Charge
        </span>
      </Button>
    </div>
  )
}
