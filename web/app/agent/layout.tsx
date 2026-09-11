"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Loader2 } from "lucide-react"

import { AuthGuard, useAuth } from "@/components/auth/auth-guard"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { PendingApprovalScreen } from "@/components/agent/pending-approval"
import { useI18n } from "@/lib/i18n"

function AgentLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()
  const { t } = useI18n()
  const [redirecting, setRedirecting] = useState(false)

  const onboardingDone = !!user?.onboardingComplete
  const approved = user?.status === 'Approved'

  // Normalize pathname — trailingSlash:true means usePathname() returns
  // "/agent/onboarding/" so strip the trailing slash for comparisons.
  const path = pathname.replace(/\/+$/, '') || '/'

  useEffect(() => {
    if (!user) return

    // Every agent must complete their profile first.
    if (!onboardingDone && path !== '/agent/onboarding') {
      setRedirecting(true)
      router.replace('/agent/onboarding')
    } else if (redirecting) {
      // Client-side navigation stays inside this layout (no remount), so once
      // we arrive at the destination we must clear the redirect flag or the
      // spinner would spin forever until a manual refresh.
      setRedirecting(false)
    }
  }, [user, onboardingDone, approved, path, router, redirecting])

  if (redirecting) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Onboarding screen has its own full-page layout.
  if (!onboardingDone) {
    return <>{children}</>
  }

  // Not yet approved: nothing may be used except resubmitting a rejected profile.
  if (!approved) {
    const canResubmit =
      user?.status === 'Rejected' && (path === '/agent/onboarding' || path === '/agent/profile')
    if (!canResubmit) {
      return <PendingApprovalScreen />
    }
    if (path === '/agent/onboarding') {
      return <>{children}</>
    }
  }

  return (
    <DashboardShell
      role={user?.role === 'owner' ? 'owner' : 'agent'}
      name={user?.name || user?.email || ''}
      email={user?.email || ''}
      status={user?.status || 'Pending'}
      title={user?.role === 'owner' ? t('owner_portal') : t('agent_portal')}
      profilePhoto={user?.profilePhoto}
    >
      {children}
    </DashboardShell>
  )
}

export default function AgentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard requiredRole="agent">
      <AgentLayoutInner>{children}</AgentLayoutInner>
    </AuthGuard>
  )
}
