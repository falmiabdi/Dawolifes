"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/auth-guard"
import { PostVehicleWizard } from "@/components/post/post-vehicle-wizard"
import { useI18n } from '@/lib/i18n'

export default function AdminPostVehiclePage() {
  const router = useRouter()
  const { user } = useAuth()
  const { t, tv } = useI18n()

  return (
    <div className="mx-auto max-w-4xl">
      <PostVehicleWizard />
    </div>
  )
}