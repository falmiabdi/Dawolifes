"use client"

import { getApiUrl } from '@/lib/get-api-url'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/auth/auth-guard'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Check, X, Loader2, ShieldCheck, Building2, Car, Pencil, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface PermissionRequest {
  id: string
  type: 'EDIT' | 'DELETE'
  entityType: 'PROPERTY' | 'VEHICLE'
  entityId: string
  status: 'Pending' | 'Approved' | 'Rejected'
  reason?: string
  used: boolean
  createdAt: string
  decidedAt?: string
  requester?: { id: string; username: string; email: string; profilePhoto?: string }
}

export default function AdminPermissionsPage() {
  const { getToken } = useAuth()
  const [requests, setRequests] = useState<PermissionRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const fetchRequests = useCallback(async () => {
    const token = await getToken()
    if (!token) return
    try {
      const res = await fetch(`${getApiUrl()}/api/permissions/admin`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setRequests(data.requests || [])
    } catch {
    } finally {
      setLoading(false)
    }
  }, [getToken])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const decide = async (id: string, approve: boolean) => {
    const token = await getToken()
    if (!token) {
      toast.error('Session expired — please sign in again.')
      return
    }
    setBusyId(id)
    try {
      const res = await fetch(`${getApiUrl()}/api/permissions/${id}/decide`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ approve }),
      })
      if (!res.ok) {
        let message = 'Could not update permission request'
        try {
          const data = await res.json()
          if (data?.message) message = data.message
        } catch {
          
        }
        throw new Error(message)
      }
      toast.success(approve ? 'Permission approved' : 'Permission rejected')
      await fetchRequests()
    } catch (err: any) {
      toast.error(err?.message || 'Could not update permission request')
    } finally {
      setBusyId(null)
    }
  }

  const visible = requests.filter(
    (r) =>
      !filter ||
      r.type.toLowerCase().includes(filter.toLowerCase()) ||
      r.status.toLowerCase().includes(filter.toLowerCase()) ||
      (r.requester?.username || '').toLowerCase().includes(filter.toLowerCase()) ||
      (r.requester?.email || '').toLowerCase().includes(filter.toLowerCase()),
  )

  const pending = requests.filter((r) => r.status === 'Pending').length

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Listing Permissions</h1>
          <p className="text-sm text-slate-500">
            Sellers need your approval before editing or deleting an approved listing.
          </p>
        </div>
        {pending > 0 && (
          <span className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">
            <span className="h-2 w-2 rounded-full bg-orange-500" /> {pending} pending
          </span>
        )}
      </div>

      <Input
        placeholder="Search by seller, type, or status…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="max-w-sm"
      />

      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-slate-200 bg-white py-16 text-slate-400 shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-700">No permission requests</h2>
          <p className="text-sm max-w-xs text-center">
            When a seller wants to edit or delete an approved listing, the request will appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {visible.map((r) => (
            <div
              key={r.id}
              className={`rounded-3xl border bg-white p-5 shadow-sm transition ${
                r.status === 'Pending' ? 'border-orange-300' : r.status === 'Approved' ? 'border-green-200' : 'border-slate-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start gap-4">
                  {r.entityType === 'PROPERTY' ? (
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                      <Building2 className="h-6 w-6" />
                    </div>
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                      <Car className="h-6 w-6" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {r.type === 'EDIT' ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
                          <Pencil className="h-3 w-3" /> Edit
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 text-xs font-bold text-red-600">
                          <Trash2 className="h-3 w-3" /> Delete
                        </span>
                      )}
                      <span className="text-sm font-semibold text-slate-700">
                        {r.entityType === 'PROPERTY' ? 'Property' : 'Vehicle'} · {r.entityId.slice(0, 8)}…
                      </span>
                      <StatusPill status={r.status} used={r.used} />
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {r.requester?.username || 'Unknown'} · {r.requester?.email || '—'}
                    </p>
                    {r.reason ? <p className="mt-1 text-xs text-slate-500">“{r.reason}”</p> : null}
                    <p className="mt-1 text-xs text-slate-400">
                      {new Date(r.createdAt).toLocaleString()}
                      {r.decidedAt ? ` · decided ${new Date(r.decidedAt).toLocaleString()}` : ''}
                    </p>
                  </div>
                </div>

                {r.status === 'Pending' ? (
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === r.id}
                      onClick={() => decide(r.id, false)}
                      className="gap-1.5"
                    >
                      {busyId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                      Reject
                    </Button>
                    <Button size="sm" disabled={busyId === r.id} onClick={() => decide(r.id, true)} className="gap-1.5">
                      {busyId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      Approve
                    </Button>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 shrink-0">
                    {r.status === 'Approved' ? (r.used ? 'Used' : 'Granted — not yet used') : 'Rejected'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StatusPill({ status, used }: { status: string; used: boolean }) {
  const cls =
    status === 'Pending'
      ? 'bg-amber-100 text-amber-700'
      : status === 'Approved'
        ? used
          ? 'bg-slate-100 text-slate-500'
          : 'bg-green-100 text-green-700'
        : 'bg-red-100 text-red-600'
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${cls}`}>
      {status}
      {status === 'Approved' && used ? ' · used' : ''}
    </span>
  )
}