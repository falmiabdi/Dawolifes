"use client"

import { getApiUrl } from '@/lib/get-api-url'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Building2, PlusCircle, Clock, CheckCircle2, XCircle, PauseCircle, ArrowRight, BarChart3, Car, CreditCard, Megaphone } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-guard'
import { StatusBadge } from '@/components/ui/status-badge'
import { useI18n } from '@/lib/i18n'


export default function AgentDashboardPage() {
  const { user } = useAuth()
  const { t } = useI18n()
  const [properties, setProperties] = useState<any[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [announcements, setAnnouncements] = useState<any[]>([])

  useEffect(() => {
    if (!user?.id) return
    const token = document.cookie.split('; ').find(r => r.startsWith('token='))?.split('=')[1]
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}
    
    fetch(`${getApiUrl()}/api/agent/properties`, { credentials: 'include', headers })
      .then((res) => res.json())
      .then((data) => setProperties(data.properties || []))
      .catch(() => {})
    fetch(`${getApiUrl()}/api/agent/vehicles`, { credentials: 'include', headers })
      .then((res) => res.json())
      .then((data) => setVehicles(data.vehicles || []))
      .catch(() => {})
    
    fetch(`${getApiUrl()}/api/announcements`)
      .then((res) => res.json())
      .then((data) => setAnnouncements((data.announcements || []).slice(0, 3)))
      .catch(() => {})
  }, [user?.id])

  if (!user) return null

  const status = user.status || 'Pending'
  const totalProperties = properties.length
  const pendingProperties = properties.filter((p: any) => p.status === 'Pending').length
  const totalVehicles = vehicles.length
  const pendingVehicles = vehicles.filter((v: any) => v.status === 'Pending').length

  const statusConfig = {
    Pending: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50 border-amber-200', msg: t('status_pending_msg') },
    Approved: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50 border-green-200', msg: t('status_approved_msg') },
    Rejected: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50 border-red-200', msg: user.rejectionReason || t('status_rejected_msg') },
    Suspended: { icon: PauseCircle, color: 'text-slate-500', bg: 'bg-slate-100 border-slate-300', msg: t('status_suspended_msg') },
  }

  const cfg = statusConfig[status as keyof typeof statusConfig] || statusConfig.Pending
  const StatusIcon = cfg.icon

  
  const recentActivity = [
    ...properties.map((p: any) => ({
      key: `p:${p.id}`, kind: t('property'), title: p.title || '', status: p.status, createdAt: new Date(p.createdAt).getTime(),
    })),
    ...vehicles.map((v: any) => ({
      key: `v:${v.id}`, kind: t('vehicle'), title: [v.make, v.vehicleModel, v.manufacturingYear].filter(Boolean).join(' '),
      status: v.status, createdAt: new Date(v.createdAt).getTime(),
    })),
  ].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5)

  return (
    <div className="space-y-5 md:space-y-6">
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 to-slate-800 p-5 text-white md:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-orange-400 md:text-sm">{user?.role === 'owner' ? t('owner_workspace') : t('agent_workspace')}</p>
            <h1 className="mt-2 text-2xl font-bold md:text-3xl">{t('welcome_name').replace('{name}', user.name || '')}</h1>
            <p className="mt-2 max-w-lg text-slate-300 text-xs md:text-sm">{t('agent_hub_note')}</p>
          </div>
          <StatusBadge status={status} />
        </div>
      </div>

      {status !== 'Approved' && (
        <div className={`flex items-start gap-4 rounded-2xl border p-5 ${cfg.bg}`}>
          <StatusIcon className={`mt-0.5 h-5 w-5 shrink-0 ${cfg.color}`} />
          <div>
            <p className="font-semibold text-slate-800">{t('account_status').replace('{status}', status)}</p>
            <p className="mt-1 text-sm text-slate-600">{cfg.msg}</p>
            {status === 'Rejected' && (
              <Link href="/agent/profile" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-orange-600 hover:underline">
                {t('update_resubmit')} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: t('total_properties'), value: String(totalProperties), icon: Building2, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: t('pending_properties'), value: String(pendingProperties), icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: t('total_vehicles'), value: String(totalVehicles), icon: Car, color: 'text-purple-500', bg: 'bg-purple-50' },
          { label: t('pending_vehicles'), value: String(pendingVehicles), icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
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
          { href: '/agent/post', label: t('post_property'), desc: t('post_property_desc'), icon: PlusCircle, disabled: status !== 'Approved' },
          { href: '/agent/post/vehicle', label: t('post_vehicle'), desc: t('post_vehicle_desc'), icon: Car, disabled: status !== 'Approved' },
          { href: '/agent/properties', label: t('my_properties'), desc: t('my_properties_desc'), icon: Building2, disabled: false },
          { href: '/agent/vehicles', label: t('my_vehicles'), desc: t('my_vehicles_desc'), icon: Car, disabled: false },
          { href: '/agent/payments', label: t('commission_history'), desc: t('commission_history_desc'), icon: CreditCard, disabled: false },
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
              {action.disabled && <span className="absolute right-4 top-4 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">{t('requires_approval')}</span>}
            </Link>
          )
        })}
      </div>

      {announcements.length > 0 && (
        <div className="rounded-3xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="flex items-center gap-2 font-semibold text-slate-800">
              <Megaphone className="h-5 w-5 text-orange-500" /> {t('announcements')}
            </h2>
            <Link href="/agent/news" className="text-xs font-bold text-orange-600 hover:underline">
              {t('view_all')}
            </Link>
          </div>
          <div className="space-y-3">
            {announcements.map((a: any) => (
              <Link
                key={a.id}
                href="/agent/news"
                className="flex items-start gap-3 rounded-2xl border border-orange-100 bg-white/80 p-4 transition hover:bg-white"
              >
                <Megaphone className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900">{a.title}</p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{a.content}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-semibold text-slate-800">{t('recent_activity')}</h2>
        {recentActivity.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-slate-400">
            <BarChart3 className="h-10 w-10 opacity-30" />
            <p className="text-sm">{t('no_activity')}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentActivity.map((item) => (
              <div key={item.key} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div className="flex min-w-0 items-center gap-3">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${item.kind === t('property') ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                    {item.kind === t('property') ? <Building2 className="h-4 w-4" /> : <Car className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-800">{item.title}</p>
                    <p className="text-xs text-slate-400">{item.kind}</p>
                  </div>
                </div>
                <div className="shrink-0">
                  <StatusBadge status={item.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

