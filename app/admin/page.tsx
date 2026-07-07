import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Users, Building2, CreditCard, ShieldAlert, Clock, CheckCircle2,
  TrendingUp, ArrowRight, UserCheck, HelpCircle
} from 'lucide-react'
import { getServerSession } from '@/lib/auth-session'
import { connectToDatabase } from '@/lib/db'
import { UserModel } from '@/lib/models/user'
import { PropertyModel } from '@/lib/models/property'
import { StatsCard } from '@/components/admin/stats-card'
import { OverviewChart } from '@/components/admin/overview-chart'
import { StatusBadge } from '@/components/ui/status-badge'

export default async function AdminDashboardPage() {
  const session = await getServerSession()
  if (!session?.user) {
    redirect('/login')
  }

  await connectToDatabase()

  // Query actual counts from MongoDB
  const totalAgents = await UserModel.countDocuments({ role: 'agent' })
  const pendingAgents = await UserModel.countDocuments({ role: 'agent', status: 'Pending' })
  
  const totalProperties = await PropertyModel.countDocuments()
  const pendingProperties = await PropertyModel.countDocuments({ status: 'Pending' })

  // Fetch recent registrations
  const recentAgents = await UserModel.find({ role: 'agent' })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean()

  // Fetch recent listings
  const recentListings = await PropertyModel.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('agentId', 'username email fullName')
    .lean()

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-8 text-white">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-orange-400">Enterprise Admin Portal</p>
          <h1 className="mt-2 text-3xl font-bold">Platform Overview & Diagnostics</h1>
          <p className="mt-2 max-w-xl text-slate-300 text-sm">
            Monitor real-time stats, review agent verification requests, check property listing queues, and manage billing activity.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          label="Total Agents"
          value={totalAgents}
          description={`${pendingAgents} pending verification`}
          icon={Users}
          colorClass="text-blue-500"
          bgClass="bg-blue-50"
        />
        <StatsCard
          label="Verification Queue"
          value={pendingAgents}
          description="Requires identity approval"
          icon={UserCheck}
          colorClass="text-amber-500"
          bgClass="bg-amber-50"
        />
        <StatsCard
          label="Total Listings"
          value={totalProperties}
          description={`${pendingProperties} awaiting review`}
          icon={Building2}
          colorClass="text-green-500"
          bgClass="bg-green-50"
        />
        <StatsCard
          label="Pending Listings Queue"
          value={pendingProperties}
          description="Needs verification"
          icon={Clock}
          colorClass="text-orange-500"
          bgClass="bg-orange-50"
        />
      </div>

      {/* Analytics Chart & Activity Panel */}
      <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
        {/* Chart */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-bold text-slate-900">Growth & Revenue Analytics</h2>
              <p className="text-xs text-slate-400">Monthly trend of listings posted vs platform billing revenue</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-orange-500" /> Listings</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-slate-900" /> Revenue (ETB)</span>
            </div>
          </div>
          <OverviewChart />
        </div>

        {/* Action Panel / Review queues */}
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
          </div>
        </div>
      </div>

      {/* Recents Lists */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Agents */}
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
                <div key={agent._id.toString()} className="py-3 flex items-center justify-between gap-3 text-xs">
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

        {/* Recent Listings */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900">Recent Listings Submitted</h3>
            <Link href="/admin/properties" className="text-xs font-bold text-orange-500 hover:underline">View All</Link>
          </div>
          {recentListings.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No properties submitted yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentListings.map((p: any) => (
                <div key={p._id.toString()} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 truncate">{p.title}</p>
                    <p className="text-slate-400 truncate mt-0.5">By: {p.agentId?.fullName || p.agentId?.username || 'Unknown'}</p>
                  </div>
                  <div className="shrink-0 text-right font-medium">
                    <span className="font-bold text-slate-900">{p.price.toLocaleString()} ETB</span>
                    <p className="text-[10px] text-slate-400 mt-1">
                      <StatusBadge status={p.status} />
                    </p>
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
