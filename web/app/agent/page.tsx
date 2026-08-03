"use client"

import { getApiUrl } from '@/lib/get-api-url'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Building2, PlusCircle, TrendingUp, Clock, CheckCircle2, XCircle, PauseCircle, ArrowRight, BarChart3, CreditCard, Car } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-guard'
import { StatusBadge } from '@/components/ui/status-badge'


export default function AgentDashboardPage() {
  const { user } = useAuth()
  const [properties, setProperties] = useState<any[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])

  useEffect(() => {
    if (!user?.id) return
    const token = document.cookie.split('; ').find(r => r.startsWith('token='))?.split('=')[1]
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}
    // Use /api/agent/properties and /api/agent/vehicles — these return ALL statuses for the agent
    fetch(`${getApiUrl()}/api/agent/properties`, { credentials: 'include', headers })
      .then((res) => res.json())
      .then((data) => setProperties(data.properties || []))
      .catch(() => {})
    fetch(`${getApiUrl()}/api/agent/vehicles`, { credentials: 'include', headers })
      .then((res) => res.json())
      .then((data) => setVehicles(data.vehicles || []))
      .catch(() => {})
  }, [user?.id])

  if (!user) return null

  const status = user.status || 'Pending'
  const totalProperties = properties.length
  const pendingProperties = properties.filter((p: any) => p.status === 'Pending').length
  const totalVehicles = vehicles.length
  const pendingVehicles = vehicles.filter((v: any) => v.status === 'Pending').length
  const totalViews = 0
  const commissionEarned = 0

  const statusConfig = {
    Pending: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50 border-amber-200', msg: 'Your application is under review. You will be notified once approved.' },
    Approved: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50 border-green-200', msg: 'Your account is active. Start listing properties!' },
    Rejected: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50 border-red-200', msg: user.rejectionReason || 'Your application was rejected. Please update your documents and resubmit.' },
    Suspended: { icon: PauseCircle, color: 'text-slate-500', bg: 'bg-slate-100 border-slate-300', msg: 'Your account has been suspended. Contact support for assistance.' },
  }

  const cfg = statusConfig[status as keyof typeof statusConfig] || statusConfig.Pending
  const StatusIcon = cfg.icon

  return (
    <div className="space-y-5 md:space-y-6">
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 to-slate-800 p-5 text-white md:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-orange-400 md:text-sm">Agent Workspace</p>
            <h1 className="mt-2 text-2xl font-bold md:text-3xl">Welcome, {user.name}!</h1>
            <p className="mt-2 max-w-lg text-slate-300 text-xs md:text-sm">Your central hub for managing properties, tracking performance, and growing your real estate business.</p>
          </div>
          <StatusBadge status={status} />
        </div>
      </div>

      {status !== 'Approved' && (
        <div className={`flex items-start gap-4 rounded-2xl border p-5 ${cfg.bg}`}>
          <StatusIcon className={`mt-0.5 h-5 w-5 shrink-0 ${cfg.color}`} />
          <div>
            <p className="font-semibold text-slate-800">Account {status}</p>
            <p className="mt-1 text-sm text-slate-600">{cfg.msg}</p>
            {status === 'Rejected' && (
              <Link href="/agent/profile" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-orange-600 hover:underline">
                Update & Resubmit <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Properties', value: String(totalProperties), icon: Building2, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Pending Properties', value: String(pendingProperties), icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: 'Total Vehicles', value: String(totalVehicles), icon: Car, color: 'text-purple-500', bg: 'bg-purple-50' },
          { label: 'Pending Vehicles', value: String(pendingVehicles), icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: 'Total Views', value: String(totalViews), icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-50' },
          { label: 'Commission Earned', value: `ETB ${commissionEarned}`, icon: CreditCard, color: 'text-orange-500', bg: 'bg-orange-50' },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg}`}>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
            </div>
          )
        })}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { href: '/agent/post', label: 'Post a Property', desc: 'List a new property for sale or rent', icon: PlusCircle, disabled: status !== 'Approved' },
          { href: '/agent/post/vehicle', label: 'Post a Vehicle', desc: 'List a car, truck or motorcycle', icon: Car, disabled: status !== 'Approved' },
          { href: '/agent/properties', label: 'My Properties', desc: 'View and manage your listings', icon: Building2, disabled: false },
          { href: '/agent/vehicles', label: 'My Vehicles', desc: 'View and manage your vehicle listings', icon: Car, disabled: false },
          { href: '/agent/payments', label: 'Commission History', desc: 'Track your earnings and payments', icon: CreditCard, disabled: false },
        ].map((action) => {
          const Icon = action.icon
          return (
            <Link
              key={action.href}
              href={action.disabled ? '#' : action.href}
              className={`group relative flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all ${action.disabled ? 'cursor-not-allowed opacity-50' : 'hover:border-orange-300 hover:shadow-md'}`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">{action.label}</p>
                <p className="mt-1 text-sm text-slate-500">{action.desc}</p>
              </div>
              {!action.disabled && <ArrowRight className="absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300 transition group-hover:text-orange-500" />}
              {action.disabled && <span className="absolute right-4 top-4 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">Requires Approval</span>}
            </Link>
          )
        })}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-semibold text-slate-800">Recent Activity</h2>
        <div className="flex flex-col items-center justify-center gap-3 py-10 text-slate-400">
          <BarChart3 className="h-10 w-10 opacity-30" />
          <p className="text-sm">No activity yet. Start by posting a property!</p>
        </div>
      </div>
    </div>
  )
}

