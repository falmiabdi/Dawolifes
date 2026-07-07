import { Bell, Search } from 'lucide-react'
import { StatusBadge } from '@/components/ui/status-badge'

interface DashboardHeaderProps {
  name: string
  email: string
  status?: string
  title: string
}

export function DashboardHeader({ name, email, status, title }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/90 px-6 py-4 backdrop-blur-sm">
      <div>
        <h1 className="text-lg font-bold text-slate-900">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        <button className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-orange-500" />
        </button>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white">
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-slate-800">{name}</p>
            {status && <StatusBadge status={status} />}
          </div>
        </div>
      </div>
    </header>
  )
}
