import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth-session'
import { Sidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/header'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession()
  
  // Hardcoded Admin role validation
  if (!session?.user || session.user.email !== 'felmitesfaye@gmail.com') {
    redirect('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar role="admin" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader
          name={session.user.name || 'Admin'}
          email={session.user.email}
          title="Enterprise Admin Portal"
        />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
