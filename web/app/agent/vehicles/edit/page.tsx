"use client"

import { Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, Loader2 } from "lucide-react"
import { useAuth } from "@/components/auth/auth-guard"
import { PostVehicleWizard } from "@/components/post/post-vehicle-wizard"


export default function EditVehiclePageWrapper() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    }>
      <EditVehiclePage />
    </Suspense>
  )
}

function EditVehiclePage() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const router = useRouter()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin' || user?.roles?.includes?.('admin') || false
  const homePath = isAdmin ? '/admin/vehicles' : '/agent/vehicles'

  useEffect(() => {
    if (!id) {
      router.push(homePath)
    }
  }, [id, router, homePath])

  if (!id) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link
        href={homePath}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-orange-600 transition"
      >
        <ChevronLeft className="h-4 w-4" /> Back to My Vehicles
      </Link>
      <div className="mt-4">
        <PostVehicleWizard vehicleId={id} />
      </div>
    </div>
  )
}