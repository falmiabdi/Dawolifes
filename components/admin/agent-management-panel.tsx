"use client"

import { useEffect, useMemo, useState } from 'react'
import { Search, ShieldCheck, UserX, UserPlus, UserRoundX, RefreshCw } from 'lucide-react'

interface AgentRecord {
  id: string
  username: string
  email: string
  role: string
  status: 'Pending' | 'Approved' | 'Rejected' | 'Suspended'
  rejectionReason?: string
}

export function AgentManagementPanel() {
  const [agents, setAgents] = useState<AgentRecord[]>([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [message, setMessage] = useState('')

  const loadAgents = async () => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (status !== 'all') params.set('status', status)

    const response = await fetch(`/api/admin/agents?${params.toString()}`)
    const payload = await response.json()
    setAgents(payload.agents || [])
  }

  useEffect(() => {
    void loadAgents()
  }, [search, status])

  const stats = useMemo(() => ({
    total: agents.length,
    pending: agents.filter((agent) => agent.status === 'Pending').length,
    approved: agents.filter((agent) => agent.status === 'Approved').length,
    rejected: agents.filter((agent) => agent.status === 'Rejected').length,
    suspended: agents.filter((agent) => agent.status === 'Suspended').length,
  }), [agents])

  const handleAction = async (id: string, action: string, rejectionReason?: string) => {
    const response = await fetch('/api/admin/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action, rejectionReason }),
    })

    const payload = await response.json()
    setMessage(payload.message || 'Action completed.')
    await loadAgents()
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-600">Administrator console</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Manage agents and approvals</h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-600">Review new registrations, filter verification states, and manage account permissions from one place.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {[
            { label: 'Total agents', value: stats.total },
            { label: 'Pending', value: stats.pending },
            { label: 'Approved', value: stats.approved },
            { label: 'Rejected', value: stats.rejected },
            { label: 'Suspended', value: stats.suspended },
          ].map((stat) => (
            <div key={stat.label} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">{stat.label}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Agent accounts</h2>
              <p className="text-sm text-slate-600">Search, filter, and manage all agent signups.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                <Search className="h-4 w-4" />
                <input value={search} onChange={(event) => setSearch(event.target.value)} className="bg-transparent outline-none" placeholder="Search agents" />
              </label>
              <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none">
                <option value="all">All statuses</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          </div>

          {message ? <p className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-700">{message}</p> : null}

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead>
                <tr className="text-slate-500">
                  <th className="px-3 py-3 font-medium">Name</th>
                  <th className="px-3 py-3 font-medium">Email</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {agents.map((agent) => (
                  <tr key={agent.id} className="text-slate-700">
                    <td className="px-3 py-3 font-medium">{agent.username}</td>
                    <td className="px-3 py-3">{agent.email}</td>
                    <td className="px-3 py-3">{agent.status}</td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => void handleAction(agent.id, 'approve')} className="rounded-full bg-green-600 px-3 py-1.5 text-xs font-semibold text-white">Approve</button>
                        <button onClick={() => void handleAction(agent.id, 'reject')} className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white">Reject</button>
                        <button onClick={() => void handleAction(agent.id, 'suspend')} className="rounded-full bg-slate-700 px-3 py-1.5 text-xs font-semibold text-white">Suspend</button>
                        <button onClick={() => void handleAction(agent.id, 'reactivate')} className="rounded-full bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white">Reactivate</button>
                        <button onClick={() => void handleAction(agent.id, 'delete')} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
