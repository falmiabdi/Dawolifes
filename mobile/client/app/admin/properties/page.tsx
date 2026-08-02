"use client"

import { getApiUrl } from '@/lib/get-api-url'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/auth/auth-guard'

import {
  Building2, Check, X, Search, Loader2, Trash2, Phone, PhoneCall
} from 'lucide-react'
import { StatusBadge } from '@/components/ui/status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useDebounce } from '@/lib/hooks/use-debounce'
import { formatPrice } from '@/lib/data'
import toast from 'react-hot-toast'

interface Property {
  id: string
  title: string
  type: string
  listingType: string
  price: number
  priceType: string
  region: string
  city: string
  subCity: string
  woreda: string
  kebele: string
  parcel: string
  block: string
  homeNo: string
  area: number
  bedrooms: number
  bathrooms: number
  condition: string
  legalizedYear: number
  description: string
  features: string[]
  images: string[]
  posterType?: string
  ownerType?: string
  agentId: string
  agentName?: string
  displayPhone?: string
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

export default function AdminPropertiesPage() {
  const { getToken } = useAuth()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [submittingAction, setSubmittingAction] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  const debouncedSearch = useDebounce(search, 300)

  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const token = await getToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [getToken])

  async function fetchProperties() {
    setLoading(true)
    try {
      const authHeaders = await getAuthHeaders()
      const res = await fetch(`${getApiUrl()}/api/admin/properties?status=${statusFilter}&search=${debouncedSearch}`, { headers: authHeaders })
      const data = await res.json()
      setProperties(data.properties || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProperties()
  }, [debouncedSearch, statusFilter])

  async function handleStatusChange(propertyId: string, status: 'Approved' | 'Rejected', reason?: string) {
    setSubmittingAction(true)
    try {
      const authHeaders = await getAuthHeaders()
      const endpoint = status === 'Approved' ? 'approve' : 'reject'
      const res = await fetch(`${getApiUrl()}/api/admin/properties/${propertyId}/${endpoint}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ reason }),
      })
      if (res.ok) {
        toast.success(`Property ${status === 'Approved' ? 'approved' : 'rejected'} successfully`)
        if (selectedProperty && selectedProperty.id === propertyId) {
          setSelectedProperty(prev => prev ? { ...prev, status, rejectionReason: status === 'Rejected' ? reason : '' } : null)
        }
        setRejectionReason('')
        fetchProperties()
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error(data.message || 'Failed to update property status.')
      }
    } catch (err) {
      toast.error('An error occurred.')
    } finally {
      setSubmittingAction(false)
    }
  }

  async function handleDelete(propertyId: string) {
    if (!confirm('Are you sure you want to permanently delete this listing?')) return
    setSubmittingAction(true)
    try {
      const authHeaders = await getAuthHeaders()
      const res = await fetch(`${getApiUrl()}/api/properties/${propertyId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
      })
      if (res.ok) {
        toast.success('Property deleted successfully')
        setSelectedProperty(null)
        fetchProperties()
      } else {
        toast.error('Failed to delete listing.')
      }
    } catch (err) {
      toast.error('An error occurred.')
    } finally {
      setSubmittingAction(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Property Listings Review Queue</h1>
        <p className="text-sm text-slate-500">Monitor properties listed by agents. Approve for public publish, reject incorrect posts, or delete violations.</p>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white border border-slate-200 p-4 rounded-3xl shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search listings by title..."
            className="pl-10 rounded-xl"
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          {['all', 'Pending', 'Approved', 'Rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${statusFilter === status ? 'border-orange-500 bg-orange-50 text-orange-950 font-bold' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-orange-300'}`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Properties Display Layout */}
      <div className="grid gap-6 lg:grid-cols-[1fr_400px] items-start">
        {/* Listings Catalog */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm min-h-[400px]">
          <h2 className="font-bold text-slate-900 mb-4">Listings Queue</h2>
          {loading ? (
            <div className="flex h-64 flex-col items-center justify-center text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500 mb-2" />
              <span>Fetching properties...</span>
            </div>
          ) : properties.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-slate-400">
              <Building2 className="h-10 w-10 opacity-30 mb-2" />
              <span>No property listings found.</span>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {properties.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedProperty(p)}
                  className={`py-4 px-3 flex items-center justify-between gap-4 cursor-pointer transition rounded-2xl ${selectedProperty?.id === p.id ? 'bg-orange-50/50' : 'hover:bg-slate-50/70'}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={p.images?.[0] || '/placeholder.jpg'}
                      alt={p.title}
                      className="h-12 w-12 rounded-xl object-cover bg-slate-100 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">{p.title}</p>
                      <p className="text-xs text-orange-600 font-bold mt-0.5">{formatPrice(p.price)} ETB</p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">By: {p.agent?.username || 'Unknown'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge status={p.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detailed Property Review Panel */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm min-h-[400px] lg:sticky lg:top-24">
          <h2 className="font-bold text-slate-900 mb-4">Review Listing details</h2>
          {selectedProperty ? (
            <div className="space-y-5 text-xs text-slate-600">
              {/* Image preview */}
              <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
                <img
                  src={selectedProperty.images?.[0] || '/placeholder.jpg'}
                  alt={selectedProperty.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute left-3 top-3">
                  <StatusBadge status={selectedProperty.status} />
                </div>
              </div>

              {/* Title & Agent Info */}
              <div>
                <h3 className="text-sm font-bold text-slate-900">{selectedProperty.title}</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Listed by: <span className="font-semibold text-slate-600">{selectedProperty.agent?.username || selectedProperty.agentName || 'Unknown'}</span>
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Contact: <span className="font-semibold text-slate-600">{selectedProperty.displayPhone || selectedProperty.agent?.phone || 'No phone set'}</span>
                </p>
              </div>

              {/* Rejection Reason Display */}
              {selectedProperty.status === 'Rejected' && selectedProperty.rejectionReason && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-3">
                  <p className="text-[10px] font-bold text-red-700 uppercase tracking-wider mb-1">Rejection Reason</p>
                  <p className="text-xs text-red-600">{selectedProperty.rejectionReason}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3 border-t border-b border-slate-100 py-3">
                {(selectedProperty.status === 'Pending' || selectedProperty.status === 'Rejected' || selectedProperty.status === 'Approved') && (
                  <>
                    <div className="flex gap-2">
                      {selectedProperty.status !== 'Approved' && (
                        <Button
                          onClick={() => handleStatusChange(selectedProperty.id, 'Approved')}
                          disabled={submittingAction}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold py-1.5"
                        >
                          <Check className="h-3.5 w-3.5 mr-1" /> Approve
                        </Button>
                      )}
                      <Button
                        onClick={() => {
                          if (rejectionReason.trim()) {
                            handleStatusChange(selectedProperty.id, 'Rejected', rejectionReason.trim())
                          } else {
                            toast.error('Please provide a reason for rejection')
                          }
                        }}
                        disabled={submittingAction}
                        className={`${selectedProperty.status === 'Approved' ? 'flex-1' : 'flex-1'} bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold py-1.5`}
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
                <div className="flex gap-2">
                  <Button
                    onClick={async () => {
                      setSubmittingAction(true)
                      const authHeaders = await getAuthHeaders()
                      const res = await fetch(`${getApiUrl()}/api/admin/properties/${selectedProperty.id}/contact`, {
                        method: 'PATCH',
                        headers: { ...authHeaders },
                      })
                      if (res.ok) {
                        const data = await res.json()
                        toast.success(`Contact switched to ${data.displayPhone}`)
                        setSelectedProperty(prev => prev ? { ...prev, displayPhone: data.displayPhone } : null)
                        fetchProperties()
                      } else {
                        toast.error('Failed to toggle contact')
                      }
                      setSubmittingAction(false)
                    }}
                    disabled={submittingAction}
                    className="flex-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl font-bold py-1.5 text-xs"
                    title="Toggle contact phone"
                  >
                    <Phone className="h-3.5 w-3.5 mr-1" /> Switch Contact
                  </Button>
                  <Button
                    onClick={() => handleDelete(selectedProperty.id)}
                    disabled={submittingAction}
                    className="h-9 w-9 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl flex items-center justify-center shrink-0"
                    title="Delete Listing"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Specifications */}
              <div className="space-y-3">
                <div>
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] text-orange-500 mb-2">Specifications</h4>
                  <div className="grid grid-cols-2 gap-y-2 border-b border-slate-100 pb-3">
                    <p><span className="text-slate-400">Type:</span> <span className="font-semibold text-slate-700">{selectedProperty.type}</span></p>
                    <p><span className="text-slate-400">Listing:</span> <span className="font-semibold text-slate-700">{selectedProperty.listingType}</span></p>
                    <p><span className="text-slate-400">Listing By:</span> <span className="font-semibold text-slate-700">{selectedProperty.posterType || '-'}</span></p>
                    <p><span className="text-slate-400">Owner Type:</span> <span className="font-semibold text-slate-700">{selectedProperty.ownerType || '-'}</span></p>
                    <p><span className="text-slate-400">Price:</span> <span className="font-bold text-orange-600">{selectedProperty.price.toLocaleString()} ETB ({selectedProperty.priceType})</span></p>
                    <p><span className="text-slate-400">Area:</span> <span className="font-semibold text-slate-700">{selectedProperty.area} mÂ²</span></p>
                    <p><span className="text-slate-400">Beds/Baths:</span> <span className="font-semibold text-slate-700">{selectedProperty.bedrooms} / {selectedProperty.bathrooms}</span></p>
                    <p><span className="text-slate-400">Condition:</span> <span className="font-semibold text-slate-700">{selectedProperty.condition}</span></p>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] text-orange-500 mb-2">Location Details</h4>
                  <div className="grid grid-cols-2 gap-y-2 border-b border-slate-100 pb-3">
                    <p className="col-span-2"><span className="text-slate-400">City/Region:</span> <span className="font-semibold text-slate-700">{selectedProperty.city}, {selectedProperty.region}</span></p>
                    <p><span className="text-slate-400">Subcity:</span> <span className="font-semibold text-slate-700">{selectedProperty.subCity || '-'}</span></p>
                    <p><span className="text-slate-400">Woreda/Kebele:</span> <span className="font-semibold text-slate-700">{selectedProperty.woreda || '-'}/{selectedProperty.kebele || '-'}</span></p>
                    <p><span className="text-slate-400">Parcel/Block:</span> <span className="font-semibold text-slate-700">{selectedProperty.parcel || '-'}/{selectedProperty.block || '-'}</span></p>
                  </div>
                </div>

                {selectedProperty.description && (
                  <div>
                    <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] text-orange-500 mb-1">Description</h4>
                    <p className="text-slate-600 leading-relaxed border-b border-slate-100 pb-3">{selectedProperty.description}</p>
                  </div>
                )}

                {/* Amenities */}
                {selectedProperty.features.length > 0 && (
                  <div>
                    <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] text-orange-500 mb-2">Amenities</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedProperty.features.map(f => (
                        <span key={f} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600 font-semibold">{f}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex h-80 flex-col items-center justify-center text-slate-400 text-center px-4">
              <Building2 className="h-10 w-10 opacity-30 mb-2" />
              <p className="text-xs">Select a listing catalog card to view verification details and approve/reject it.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

