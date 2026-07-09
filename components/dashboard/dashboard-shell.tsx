"use client"

import { useState } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { ErrorBoundary } from "@/components/ui/error-boundary"

interface DashboardShellProps {
  role: "agent" | "admin"
  name: string
  email: string
  status?: string
  title: string
  children: React.ReactNode
}

export function DashboardShell({
  role,
  name,
  email,
  status,
  title,
  children,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    // Mobile: stacked layout; Desktop (lg+): side-by-side with fixed sidebar
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar
        role={role}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content column */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <DashboardHeader
          name={name}
          email={email}
          status={status}
          title={title}
          onToggleSidebar={() => setSidebarOpen((o) => !o)}
        />
        <main className="flex-1 overflow-y-auto p-3 md:p-6">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </div>
    </div>
  )
}
