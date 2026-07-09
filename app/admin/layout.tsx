import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/auth-session"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"

const adminEmails = (process.env.ADMIN_EMAILS || "felmitesfaye@gmail.com").split(",").map((e) => e.trim().toLowerCase())

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession()

  const userEmail = session?.user?.email?.toLowerCase() || ""
  const isAdmin =
    session?.user?.role === "admin" ||
    session?.user?.roles?.includes("admin") ||
    adminEmails.includes(userEmail)

  if (!session?.user || !isAdmin) {
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
