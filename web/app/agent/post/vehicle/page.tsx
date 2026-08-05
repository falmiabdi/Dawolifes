"use client"

import { useRouter } from "next/navigation"
import { Info } from "lucide-react"
import { useAuth } from "@/components/auth/auth-guard"
import { Button } from "@/components/ui/button"
import { PostVehicleWizard } from "@/components/post/post-vehicle-wizard"
import { useI18n } from '@/lib/i18n'

export default function AgentPostVehiclePage() {
  const router = useRouter()
  const { user } = useAuth()
  const { t, tv } = useI18n()

  if (user && user.status !== 'Approved') {
    return (
      <div className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <Info className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-xl font-bold text-slate-900">{t('posting_unavailable')}</h1>
        <p className="mt-2 text-sm text-slate-500">
          {t('posting_unavailable_vehicle_note')}{' '}
          <span className="font-semibold">{tv(user.status)}</span>.
        </p>
        <Button
          onClick={() => router.push('/agent')}
          className="mt-6 rounded-full bg-orange-500 text-white hover:bg-orange-600"
        >
          {t('back_to_dashboard')}
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
