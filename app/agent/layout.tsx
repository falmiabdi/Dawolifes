import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/auth-session"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"

export default async function AgentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession()
  if (!session?.user) {
    redirect("/login")
  }

  return (
    <DashboardShell
      role="agent"
      name={session.user.name || session.user.email}
      email={session.user.email}
      status={session.user.status}
      title="Agent Portal"
    >
      {children}
    </DashboardShell>
  )
}
