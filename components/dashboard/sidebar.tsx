"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, User, Building2, PlusCircle, MessageSquare, Bell,
  CreditCard, Settings, LogOut, Home,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const agentNav = [
  { href: '/agent', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/agent/profile', label: 'Profile', icon: User },
  { href: '/agent/properties', label: 'My Properties', icon: Building2 },
  { href: '/agent/post', label: 'Post Property', icon: PlusCircle },
  { href: '/agent/messages', label: 'Messages', icon: MessageSquare },
  { href: '/agent/notifications', label: 'Notifications', icon: Bell },
  { href: '/agent/payments', label: 'Payments', icon: CreditCard },
  { href: '/agent/settings', label: 'Settings', icon: Settings },
]

const adminNav = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/agents', label: 'Agent Management', icon: User },
  { href: '/admin/properties', label: 'Properties', icon: Building2 },
  { href: '/admin/users', label: 'Users', icon: User },
  { href: '/admin/payments', label: 'Payments', icon: CreditCard },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

export function Sidebar({ role }: { role: 'agent' | 'admin' }) {
  const pathname = usePathname()
  const nav = role === 'admin' ? adminNav : agentNav

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-slate-800 bg-slate-900 text-white">
      {/* Logo */}
      <div className="flex items-center gap-2 border-b border-slate-800 px-6 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500">
          <Home className="h-4 w-4 text-white" />
        </div>
        <span className="text-lg font-extrabold tracking-tight">
          Dela<span className="text-orange-400">Harme</span>
        </span>
      </div>

      {/* Role tag */}
      <div className="px-6 py-3">
        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
          {role} portal
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {nav.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href || (item.href !== '/agent' && item.href !== '/admin' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'mb-1 flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all',
                active
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-800 p-4">
        <Link href="/api/auth/signout" className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-red-900/30 hover:text-red-400">
          <LogOut className="h-4 w-4" />
          Sign out
        </Link>
      </div>
    </aside>
  )
}
