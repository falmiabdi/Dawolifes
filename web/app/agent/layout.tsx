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
  const [adminRedirecting, setAdminRedirecting] = useState(false)

  const isAdmin =
    user?.role === 'admin' || (Array.isArray(user?.roles) && user!.roles!.includes('admin'))
  const onboardingDone = !!user?.onboardingComplete
  const approved = user?.status === 'Approved'

  
  
  const path = pathname.replace(/\/+$/, '') || '/'

  
  
  const adminAllowedEditPath =
    path === '/agent/properties/edit' || path === '/agent/vehicles/edit'

  useEffect(() => {
    if (!user) return

    if (isAdmin) {
      
      
      if (!adminAllowedEditPath) {
        setAdminRedirecting(true)
        router.replace('/admin')
      }
      return
    }

    
    if (!onboardingDone && path !== '/agent/onboarding') {
      setRedirecting(true)
      router.replace('/agent/onboarding')
    } else if (redirecting) {
      
      
      
      setRedirecting(false)
    }
  }, [user, isAdmin, onboardingDone, approved, path, adminAllowedEditPath, router, redirecting])

  if (redirecting || adminRedirecting) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  
  
  
  if (isAdmin) {
    return <>{children}</>
  }

  
  if (!onboardingDone) {
    return <>{children}</>
  }

  
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
