"use client"

import { getApiUrl } from '@/lib/get-api-url'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Users, Building2, CreditCard, ShieldAlert, Clock, CheckCircle2,
  TrendingUp, ArrowRight, UserCheck, HelpCircle, Banknote, AlertCircle
} from 'lucide-react'
import { useAuth } from '@/components/auth/auth-guard'
import { StatsCard } from '@/components/admin/stats-card'
import { OverviewChart } from '@/components/admin/overview-chart'
import { StatusBadge } from '@/components/ui/status-badge'


export default function AdminDashboardPage() {
  const { user, getToken } = useAuth()
  const [agents, setAgents] = useState<any[]>([])
  const [properties, setProperties] = useState<any[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [stats, setStats] = useState<any>({})

  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const token = await getToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [getToken])

  useEffect(() => {
    if (!user) return
    ;(async () => {
      const authHeaders = await getAuthHeaders()
      const headers = { ...authHeaders }
      Promise.all([
        fetch(`${getApiUrl()}/api/admin/agents?status=all`, { headers }).then(r => r.json()),
        fetch(`${getApiUrl()}/api/admin/properties`, { headers }).then(r => r.json()),
        fetch(`${getApiUrl()}/api/admin/vehicles`, { headers }).then(r => r.json()),
        fetch(`${getApiUrl()}/api/admin/stats`, { headers }).then(r => r.json()),
        fetch(`${getApiUrl()}/api/payments`, { headers }).then(r => r.json()),
      ]).then(([agentsData, propertiesData, vehiclesData, statsData, paymentsData]) => {
        setAgents(agentsData.agents || [])
        setProperties(propertiesData.properties || [])
        setVehicles(vehiclesData.vehicles || [])
        setPayments(paymentsData.payments || [])
        // statsData from /api/admin/stats has { paymentStats: { totalRevenue, completedCount, ... } }
        setStats(statsData.paymentStats || paymentsData.stats || {})
      }).catch(() => {})
    })()
  }, [user, getAuthHeaders])

  if (!user) return null

  const totalAgents = agents.length
  const pendingAgents = agents.filter((a: any) => a.status === 'Pending').length
  const totalProperties = properties.length
  const pendingProperties = properties.filter((p: any) => p.status === 'Pending').length
  const totalVehicles = vehicles.length
  const pendingVehicles = vehicles.filter((v: any) => v.status === 'Pending').length

  const ps = stats
  const recentAgents = agents.slice(0, 5)
  const recentPayments = payments.slice(0, 5)

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-5 text-white md:p-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-orange-400 md:text-sm">Enterprise Admin Portal</p>
          <h1 className="mt-2 text-xl font-bold md:text-3xl">Platform Overview &amp; Diagnostics</h1>
          <p className="mt-2 max-w-xl text-slate-300 text-xs md:text-sm">
            Monitor real-time stats, review agent verification requests, check property listing queues, and manage billing activity.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard label="Total Agents" value={totalAgents} description={`${pendingAgents} pending verification`} icon={Users} colorClass="text-blue-500" bgClass="bg-blue-50" />
        <StatsCard label="Verification Queue" value={pendingAgents} description="Requires identity approval" icon={UserCheck} colorClass="text-amber-500" bgClass="bg-amber-50" />
        <StatsCard label="Total Properties" value={totalProperties} description={`${pendingProperties} awaiting review`} icon={Building2} colorClass="text-green-500" bgClass="bg-green-50" />
        <StatsCard label="Total Vehicles" value={totalVehicles} description={`${pendingVehicles} awaiting review`} icon={TrendingUp} colorClass="text-blue-500" bgClass="bg-blue-50" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard label="Total Revenue" value={`ETB ${(ps.totalRevenue || 0).toLocaleString()}`} description="From completed payments" icon={TrendingUp} colorClass="text-green-500" bgClass="bg-green-50" />
        <StatsCard label="Completed Payments" value={ps.completedCount || 0} description="Successfully processed" icon={CheckCircle2} colorClass="text-green-500" bgClass="bg-green-50" />
        <StatsCard label="Pending Payments" value={ps.pendingCount || 0} description="Awaiting confirmation" icon={Clock} colorClass="text-yellow-500" bgClass="bg-yellow-50" />
        <StatsCard label="Failed Payments" value={ps.failedCount || 0} description="Requires attention" icon={AlertCircle} colorClass="text-red-500" bgClass="bg-red-50" />
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-[1fr_350px]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-bold text-slate-900">Growth & Revenue Analytics</h2>
              <p className="text-xs text-slate-400">Monthly trend of listings posted vs platform billing revenue</p>
            </div>
          </div>
          <OverviewChart />
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
          <h2 className="font-bold text-slate-900">Task Center</h2>
          <div className="space-y-3">
            <Link href="/admin/agents" className="group flex items-center justify-between p-4 rounded-2xl border border-slate-50 hover:bg-slate-50 transition">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Review Agent Application</p>
                  <p className="text-[10px] text-slate-400">{pendingAgents} request(s) pending</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:text-orange-500" />
            </Link>
            <Link href="/admin/properties" className="group flex items-center justify-between p-4 rounded-2xl border border-slate-50 hover:bg-slate-50 transition">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Verify Property Postings</p>
                  <p className="text-[10px] text-slate-400">{pendingProperties} post(s) pending</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:text-orange-500" />
            </Link>
            <Link href="/admin/vehicles" className="group flex items-center justify-between p-4 rounded-2xl border border-slate-50 hover:bg-slate-50 transition">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Verify Vehicle Postings</p>
                  <p className="text-[10px] text-slate-400">{pendingVehicles} post(s) pending</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:text-orange-500" />
            </Link>
            <Link href="/admin/payments" className="group flex items-center justify-between p-4 rounded-2xl border border-slate-50 hover:bg-slate-50 transition">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-50 text-green-600">
                  <Banknote className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Payment Dashboard</p>
                  <p className="text-[10px] text-slate-400">ETB {(ps.totalRevenue || 0).toLocaleString()} collected</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:text-orange-500" />
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900">Recent Registrations</h3>
            <Link href="/admin/agents" className="text-xs font-bold text-orange-500 hover:underline">View All</Link>
          </div>
          {recentAgents.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No agents registered yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentAgents.map((agent: any) => (
                <div key={agent.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 truncate">{agent.fullName || agent.username}</p>
                    <p className="text-slate-400 truncate mt-0.5">{agent.email}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <StatusBadge status={agent.status || 'Pending'} />
                    <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                      {new Date(agent.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900">Recent Payments</h3>
            <Link href="/admin/payments" className="text-xs font-bold text-orange-500 hover:underline">View All</Link>
          </div>
          {recentPayments.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No payments recorded yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentPayments.map((p: any) => (
                <div key={p.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 truncate">{p.title}</p>
                    <p className="text-slate-400 truncate mt-0.5">
                      {p.method} Â· {p.paymentType.replace('_', ' ')}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                        p.status === 'Completed'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : p.status === 'Pending'
                          ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}
                    >
                      {p.status}
                    </span>
                    <p className="font-bold text-green-600 mt-1">+ETB {p.amount.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

