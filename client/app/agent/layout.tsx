"use client"

import { AuthGuard, useAuth } from "@/components/auth/auth-guard"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"

function AgentLayoutInner({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()

  return (
    <DashboardShell
      role="agent"
      name={user?.name || user?.email || ''}
      email={user?.email || ''}
      status={user?.status || 'Pending'}
      title="Agent Portal"
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
