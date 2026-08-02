"use client"

import { getApiUrl } from '@/lib/get-api-url'
import { useState, useEffect, useCallback } from "react"
import { User, Shield, Ban, RotateCcw } from "lucide-react"
import { useAuth } from "@/components/auth/auth-guard"
import { StatusBadge } from "@/components/ui/status-badge"
import { UserDeleteButton } from "./delete-button"
import toast from "react-hot-toast"


export default function AdminUsersPage() {
  const { user: authUser, getToken } = useAuth()
  const [users, setUsers] = useState<any[]>([])

  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const token = await getToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [getToken])

  async function fetchUsers() {
    const authHeaders = await getAuthHeaders()
    fetch(`${getApiUrl()}/api/admin/users`, { headers: { ...authHeaders } })
      .then((res) => res.json())
      .then((data) => setUsers(data.users || []))
      .catch(() => {})
  }

  useEffect(() => {
    if (!authUser) return
    fetchUsers()
  }, [authUser, getAuthHeaders])

  async function handleAction(action: string, id: string) {
    const authHeaders = await getAuthHeaders()
    const res = await fetch(`${getApiUrl()}/api/admin/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ action, id }),
    })
    if (res.ok) {
      toast.success(action === 'suspend' ? 'User suspended' : 'User activated')
      fetchUsers()
    } else {
      toast.error('Action failed')
    }
  }

  if (!authUser) return null

  const adminEmails = ["felmitesfaye@gmail.com"]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-slate-900 md:text-2xl">
          User Catalog Management
        </h1>
        <p className="text-sm text-slate-500">
          Monitor all administrators, agents, and client accounts registered on DawoLife.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm overflow-hidden md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-900">Database Users</h2>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
            {users.length} total
          </span>
        </div>

        <div className="divide-y divide-slate-100 md:hidden">
          {users.map((u: any) => (
            <div key={u.id.toString()} className="py-4 space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600 font-bold text-xs">
                    {u.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate text-sm">
                      {u.username}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{u.email}</p>
                  </div>
                </div>
                <span
                  className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    u.role === "admin"
                      ? "bg-slate-900 text-white"
                      : "bg-orange-50 text-orange-700"
                  }`}
                >
                  {u.role === "admin" ? (
                    <Shield className="h-3 w-3" />
                  ) : (
                    <User className="h-3 w-3" />
                  )}
                  {u.role}
                </span>
              </div>

              <div className="flex items-center justify-between pl-12">
                <div className="flex items-center gap-3">
                  <StatusBadge status={u.status || "Pending"} />
                  <span className="text-[10px] text-slate-400">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {!adminEmails.includes(u.email?.toLowerCase() || "") ? (
                  <div className="flex items-center gap-1">
                    {u.status !== 'Suspended' ? (
                      <button
                        onClick={() => handleAction('suspend', u.id.toString())}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-100 transition"
                        title="Suspend User"
                      >
                        <Ban className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAction('activate', u.id.toString())}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-green-50 text-green-600 hover:bg-green-100 transition"
                        title="Activate User"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <UserDeleteButton id={u.id.toString()} />
                  </div>
                ) : (
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">
                    Root Owner
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm divide-y divide-slate-100">
            <thead>
              <tr className="text-xs font-semibold text-slate-400 uppercase">
                <th className="pb-3">User</th>
                <th className="pb-3">Email</th>
                <th className="pb-3">Role</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Registered At</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {users.map((u: any) => (
                <tr key={u.id.toString()}>
                  <td className="py-3.5 flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-50 text-orange-600 font-bold text-xs">
                      {u.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-bold text-slate-900">{u.username}</span>
                  </td>
                  <td className="py-3.5 text-xs text-slate-500">{u.email}</td>
                  <td className="py-3.5 text-xs">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        u.role === "admin"
                          ? "bg-slate-900 text-white"
                          : "bg-orange-50 text-orange-700"
                      }`}
                    >
                      {u.role === "admin" ? (
                        <Shield className="h-3 w-3" />
                      ) : (
                        <User className="h-3 w-3" />
                      )}
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3.5 text-xs">
                    <StatusBadge status={u.status || "Pending"} />
                  </td>
                  <td className="py-3.5 text-xs text-slate-500">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 text-right">
                    {!adminEmails.includes(u.email?.toLowerCase() || "") ? (
                      <div className="flex items-center justify-end gap-1">
                        {u.status !== 'Suspended' ? (
                          <button
                            onClick={() => handleAction('suspend', u.id.toString())}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-100 transition"
                            title="Suspend User"
                          >
                            <Ban className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAction('activate', u.id.toString())}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-green-50 text-green-600 hover:bg-green-100 transition"
                            title="Activate User"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <UserDeleteButton id={u.id.toString()} />
                      </div>
                    ) : (
                      <span className="text-[10px] font-semibold text-slate-400 uppercase">
                        Root Owner
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

