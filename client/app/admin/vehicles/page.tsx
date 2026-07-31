"use client"

import { getApiUrl } from '@/lib/get-api-url'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/auth/auth-guard'

import {
  Car, Check, X, Search, Loader2, Trash2, Phone
} from 'lucide-react'
import { StatusBadge } from '@/components/ui/status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useDebounce } from '@/lib/hooks/use-debounce'
import toast from 'react-hot-toast'

interface Vehicle {
  id: string
  title: string
  vehicleId: string
  listingType: string
  vehicleCategory: string
  make: string
  vehicleModel: string
  manufacturingYear: number
  color: string
  countryOfOrigin: string
  condition: string
  fuelType?: string
  transmission?: string
  mileage?: number
  price: number
  priceType: string
  region: string
  city: string
  images: string[]
  description?: string
  agentId: string
  agentName?: string
  agent?: {
    id: string
    username: string
    email: string
    phone?: string
    profilePhoto?: string
  }
  status: string
  rejectionReason?: string
  createdAt: string
}

export default function AdminVehiclesPage() {
  const { getToken } = useAuth()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [submittingAction, setSubmittingAction] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  const debouncedSearch = useDebounce(search, 400)

  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const token = await getToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [getToken])

  const fetchVehicles = useCallback(async () => {
    try {
      setLoading(true)
      const authHeaders = await getAuthHeaders()
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (debouncedSearch) params.set('search', debouncedSearch)
      const res = await fetch(`${getApiUrl()}/api/admin/vehicles?${params}`, { headers: authHeaders })
      const data = await res.json()
      setVehicles(data.vehicles || [])
    } catch {
      toast.error('Failed to fetch vehicles')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, debouncedSearch, getAuthHeaders])

  useEffect(() => { fetchVehicles() }, [fetchVehicles])

  const handleStatusChange = async (id: string, status: string, reason?: string) => {
    setSubmittingAction(true)
    try {
      const authHeaders = await getAuthHeaders()
      const res = await fetch(`${getApiUrl()}/api/admin/vehicles/${id}/${status === 'Approved' ? 'approve' : 'reject'}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: status === 'Rejected' ? JSON.stringify({ rejectionReason: reason || '' }) : undefined,
      })
      if (res.ok) {
        toast.success(`Vehicle ${status === 'Approved' ? 'approved' : 'rejected'}`)
        setSelectedVehicle(null)
        setRejectionReason('')
        fetchVehicles()
      } else {
        const data = await res.json()
        toast.error(data.message || 'Action failed')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSubmittingAction(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) return
    setSubmittingAction(true)
    try {
      const authHeaders = await getAuthHeaders()
      const res = await fetch(`${getApiUrl()}/api/vehicles/${id}`, {
        method: 'DELETE',
        headers: authHeaders,
      })
      if (res.ok) {
        toast.success('Vehicle deleted')
        setSelectedVehicle(null)
        fetchVehicles()
      } else {
        toast.error('Failed to delete vehicle')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSubmittingAction(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vehicle Management</h1>
          <p className="text-sm text-slate-500">Review, approve, or reject vehicle listings</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vehicles..."
            className="pl-9 rounded-xl border-slate-200 text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400"
        >
          <option value="all">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : vehicles.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <Car className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-4 text-sm font-bold text-slate-700">No vehicles found</p>
          <p className="mt-1 text-xs text-slate-400">Try adjusting your search or filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_380px]">
          <div className="space-y-3">
            {vehicles.map((v) => (
              <div
                key={v.id}
                onClick={() => setSelectedVehicle(v)}
                className={`cursor-pointer rounded-2xl border bg-white p-4 transition hover:shadow-sm ${
                  selectedVehicle?.id === v.id ? 'border-orange-400 ring-2 ring-orange-100' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  {v.images?.[0] ? (
                    <img src={v.images[0]} alt={v.title} className="h-16 w-16 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-slate-100 shrink-0">
                      <Car className="h-6 w-6 text-slate-400" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-slate-900 truncate">{v.title}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {v.make} {v.vehicleModel} Â· {v.manufacturingYear} Â· {v.color}
                        </p>
                      </div>
                      <StatusBadge status={v.status} />
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-400">
                      <span>{v.listingType}</span>
                      <span className="font-bold text-orange-600">{v.price.toLocaleString()} ETB</span>
                      <span className="truncate">{v.region}, {v.city}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {selectedVehicle && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 h-fit">
              <div className="flex items-start gap-3">
                {selectedVehicle.images?.[0] ? (
                  <img src={selectedVehicle.images[0]} alt={selectedVehicle.title} className="h-14 w-14 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 shrink-0">
                    <Car className="h-6 w-6 text-slate-400" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900">{selectedVehicle.title}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{selectedVehicle.vehicleCategory}</p>
                  <StatusBadge status={selectedVehicle.status} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                <p className="text-slate-400">Make:</p><p className="font-semibold text-slate-700">{selectedVehicle.make}</p>
                <p className="text-slate-400">Model:</p><p className="font-semibold text-slate-700">{selectedVehicle.vehicleModel}</p>
                <p className="text-slate-400">Year:</p><p className="font-semibold text-slate-700">{selectedVehicle.manufacturingYear}</p>
                <p className="text-slate-400">Color:</p><p className="font-semibold text-slate-700">{selectedVehicle.color}</p>
                <p className="text-slate-400">Origin:</p><p className="font-semibold text-slate-700">{selectedVehicle.countryOfOrigin}</p>
                <p className="text-slate-400">Condition:</p><p className="font-semibold text-slate-700">{selectedVehicle.condition}</p>
                <p className="text-slate-400">Fuel:</p><p className="font-semibold text-slate-700">{selectedVehicle.fuelType || 'N/A'}</p>
                <p className="text-slate-400">Transmission:</p><p className="font-semibold text-slate-700">{selectedVehicle.transmission || 'N/A'}</p>
                <p className="text-slate-400">Mileage:</p><p className="font-semibold text-slate-700">{selectedVehicle.mileage ? `${selectedVehicle.mileage.toLocaleString()} km` : 'N/A'}</p>
                <p className="text-slate-400">Price:</p><p className="font-bold text-orange-600">{selectedVehicle.price.toLocaleString()} ETB</p>
              </div>

              <div className="text-xs text-slate-500">
                <p className="text-slate-400">Region:</p>
                <p className="font-semibold text-slate-700">{selectedVehicle.region}, {selectedVehicle.city}</p>
              </div>

              <div className="text-xs text-slate-500 border-t border-slate-100 pt-3">
                <p className="text-slate-400">Listed by:</p>
                <p className="font-semibold text-slate-700">{selectedVehicle.agent?.username || selectedVehicle.agentName || 'Unknown'}</p>
                <p className="text-slate-400 mt-1">Contact:</p>
                <p className="font-semibold text-slate-700">{selectedVehicle.agent?.phone || 'No phone set'}</p>
              </div>

              {selectedVehicle.status === 'Rejected' && selectedVehicle.rejectionReason && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-3">
                  <p className="text-[10px] font-bold text-red-700 uppercase tracking-wider mb-1">Rejection Reason</p>
                  <p className="text-xs text-red-600">{selectedVehicle.rejectionReason}</p>
                </div>
              )}

              <div className="space-y-3 border-t border-b border-slate-100 py-3">
                {(selectedVehicle.status === 'Pending' || selectedVehicle.status === 'Rejected' || selectedVehicle.status === 'Approved') && (
                  <>
                    <div className="flex gap-2">
                      {selectedVehicle.status !== 'Approved' && (
                        <Button
                          onClick={() => handleStatusChange(selectedVehicle.id, 'Approved')}
                          disabled={submittingAction}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold py-1.5 text-xs"
                        >
                          <Check className="h-3.5 w-3.5 mr-1" /> Approve
                        </Button>
                      )}
                      <Button
                        onClick={() => {
                          if (rejectionReason.trim()) {
                            handleStatusChange(selectedVehicle.id, 'Rejected', rejectionReason.trim())
                          } else {
                            toast.error('Please provide a reason for rejection')
                          }
                        }}
                        disabled={submittingAction}
                        className={`${selectedVehicle.status === 'Approved' ? 'flex-1' : 'flex-1'} bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold py-1.5 text-xs`}
                      >
                        <X className="h-3.5 w-3.5 mr-1" /> Reject
                      </Button>
                    </div>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Reason for rejection (required if rejecting)..."
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 resize-none"
                      rows={2}
                    />
                  </>
                )}
                <Button
                  onClick={() => handleDelete(selectedVehicle.id)}
                  disabled={submittingAction}
                  className="w-full bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-bold py-1.5 text-xs"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete Listing
                </Button>
              </div>

              {selectedVehicle.description && (
                <div className="text-xs text-slate-500">
                  <p className="text-slate-400 font-semibold mb-1">Description</p>
                  <p>{selectedVehicle.description}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

