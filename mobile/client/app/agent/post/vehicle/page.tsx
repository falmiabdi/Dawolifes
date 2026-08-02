"use client"

import { useRouter } from "next/navigation"
import { Info } from "lucide-react"
import { useAuth } from "@/components/auth/auth-guard"
import { Button } from "@/components/ui/button"
import { PostVehicleWizard } from "@/components/post/post-vehicle-wizard"

export default function AgentPostVehiclePage() {
  const router = useRouter()
  const { user } = useAuth()

  if (user && user.status !== 'Approved') {
    return (
      <div className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <Info className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-xl font-bold text-slate-900">Posting is unavailable</h1>
        <p className="mt-2 text-sm text-slate-500">
          Your account must be approved before you can post vehicle listings. Your current status is{' '}
          <span className="font-semibold">{user.status}</span>.
        </p>
        <Button
          onClick={() => router.push('/agent')}
          className="mt-6 rounded-full bg-orange-500 text-white hover:bg-orange-600"
        >
          Back to Dashboard
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PostVehicleWizard />
    </div>
  )
}
