import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth-session'
import { Sidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/header'

export default async function AgentLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession()
  if (!session?.user) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar role="agent" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader
          name={session.user.name || session.user.email}
          email={session.user.email}
          status={session.user.status}
          title="Agent Portal"
        />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
