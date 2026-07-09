import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/auth-session"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession()

  // Hardcoded Admin role validation
  if (!session?.user || session.user.email !== "felmitesfaye@gmail.com") {
    redirect("/login")
  }

  return (
    <DashboardShell
      role="admin"
      name={session.user.name || "Admin"}
      email={session.user.email}
      title="Enterprise Admin Portal"
    >
      {children}
    </DashboardShell>
  )
}
