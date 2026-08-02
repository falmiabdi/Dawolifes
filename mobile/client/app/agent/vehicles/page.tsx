"use client"

import { getApiUrl } from '@/lib/get-api-url'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Car, PlusCircle, ExternalLink, MapPin, AlertCircle, Pencil } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-guard'
import { formatPrice } from '@/lib/data'
import { StatusBadge } from '@/components/ui/status-badge'


export default function AgentVehiclesPage() {
  const { user } = useAuth()
  const [vehicles, setVehicles] = useState<any[]>([])

  useEffect(() => {
    if (!user?.id) return
    const fetchVehicles = async () => {
      try {
        const token = document.cookie.split('; ').find(c => c.startsWith('token='))?.split('=')[1]
        const res = await fetch(`${getApiUrl()}/api/agent/vehicles`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        const data = await res.json()
        setVehicles(data.vehicles || [])
      } catch {}
    }
    fetchVehicles()
  }, [user?.id])

  if (!user) return null

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">My Listed Vehicles</h1>
          <p className="text-sm text-slate-500">Manage, edit, or delete your existing vehicle listings.</p>
        </div>
        <Link
          href={user.status === 'Approved' ? '/agent/post/vehicle' : '#'}
          className={`inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 ${user.status !== 'Approved' ? 'cursor-not-allowed opacity-50' : ''}`}
        >
          <PlusCircle className="h-4 w-4" /> Post a Vehicle
        </Link>
      </div>

      {user.status !== 'Approved' && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-semibold">Account Pending Approval</p>
          <p className="mt-1">You cannot post new listings or publish changes until your agent application has been approved by the administrators.</p>
        </div>
      )}

      {vehicles.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-slate-200 bg-white py-16 text-slate-400 shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
            <Car className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-700">No vehicles listed yet</h2>
          <p className="text-sm max-w-xs text-center">Get started by listing your first vehicle on DawoLife portal.</p>
          {user.status === 'Approved' && (
            <Link href="/agent/post/vehicle" className="mt-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition">
              Create Listing
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((v: any) => {
            const firstImage = v.images?.[0] || '/placeholder.jpg'
            return (
              <div key={v.id.toString()} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                  <img
                    src={firstImage}
                    alt={v.title}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  <div className="absolute left-3 top-3">
                    <StatusBadge status={v.status} />
                  </div>
                  <div className="absolute right-3 top-3 rounded-full bg-slate-900/70 px-2.5 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
                    {v.listingType}
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                    <MapPin className="h-3 w-3" />
                    <span>{v.city}, {v.region}</span>
                  </div>
                  <h3 className="mt-2 font-bold text-slate-800 line-clamp-1">{v.title}</h3>
                  <p className="mt-1 text-lg font-extrabold text-orange-600">
                    {formatPrice(v.price)} ETB <span className="text-xs font-medium text-slate-400">{v.priceType}</span>
                  </p>

                  {v.status === 'Rejected' && v.rejectionReason && (
                    <div className="mt-3 rounded-xl bg-red-50 border border-red-200 p-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[10px] font-bold text-red-700 uppercase tracking-wider">Rejection Reason</p>
                          <p className="text-xs text-red-600 mt-0.5">{v.rejectionReason}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                    <div className="flex flex-wrap gap-1">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">{v.make} {v.vehicleModel || v.model}</span>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">{v.manufacturingYear}</span>
                      {v.mileage !== undefined && (
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">{v.mileage.toLocaleString()} km</span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Link
                      href={`/listings/vehicle?id=${v.id.toString()}`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> View
                    </Link>
                    {v.status === 'Rejected' && (
                      <Link
                        href={`/agent/vehicles/edit?id=${v.id.toString()}`}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-orange-200 bg-orange-50 py-2 px-3 text-xs font-bold text-orange-700 transition hover:bg-orange-100"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Link>
                    )}
                    <button
                      onClick={async () => {
                        if (!confirm('Delete this vehicle listing?')) return
                        try {
                          const token = document.cookie.split('; ').find(c => c.startsWith('token='))?.split('=')[1]
                          await fetch(`${getApiUrl()}/api/vehicles/${v.id.toString()}`, {
                            method: 'DELETE',
                            headers: { Authorization: `Bearer ${token}` },
                          })
                          setVehicles((prev) => prev.filter((veh) => veh.id.toString() !== v.id.toString()))
                        } catch (err) {
                          console.error('Delete failed', err)
                        }
                      }}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 py-2 px-3 text-xs font-bold text-red-700 transition hover:bg-red-100"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

