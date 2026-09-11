"use client"

import { getApiUrl } from '@/lib/get-api-url'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Car, PlusCircle, ExternalLink, MapPin, AlertCircle, Pencil, Loader2, Clock } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-guard'
import { formatPrice } from '@/lib/data'
import { StatusBadge } from '@/components/ui/status-badge'
import { useListingPermissions } from '@/components/agent/use-listing-permissions'
import { useI18n } from '@/lib/i18n'


export default function AgentVehiclesPage() {
  const { user, getToken } = useAuth()
  const { t, tv } = useI18n()
  const [vehicles, setVehicles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const permissions = useListingPermissions(getToken)
  const [requesting, setRequesting] = useState<string | null>(null)

  const fetchVehicles = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const token = await getToken()
      const res = await fetch(`${getApiUrl()}/api/agent/vehicles`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setVehicles(data.vehicles || [])
    } catch {
      setError(t('failed_to_load') || 'Failed to load vehicles.')
    } finally {
      setLoading(false)
    }
  }, [getToken, t])

  useEffect(() => {
    if (!user?.id) return
    fetchVehicles()
  }, [user?.id, fetchVehicles])

  const sendRequest = async (type: 'EDIT' | 'DELETE', id: string) => {
    setRequesting(`${type}:${id}`)
    await permissions.requestPermission({ entityType: 'VEHICLE', entityId: id, type })
    setRequesting(null)
  }

  const deleteVehicle = async (id: string) => {
    if (!confirm(t('confirm_delete_vehicle'))) return
    try {
      const token = await getToken()
      await fetch(`${getApiUrl()}/api/vehicles/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      setVehicles((prev) => prev.filter((v) => v.id.toString() !== id))
    } catch (err) {
      console.error('Delete failed', err)
    }
  }

  if (!user) return null

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{t('my_listed_vehicles')}</h1>
          <p className="text-sm text-slate-500">{t('manage_vehicles_note')}</p>
        </div>
        <Link
          href={user.status === 'Approved' ? '/agent/post/vehicle' : '#'}
          className={`inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 ${user.status !== 'Approved' ? 'cursor-not-allowed opacity-50' : ''}`}
        >
          <PlusCircle className="h-4 w-4" /> {t('post_vehicle')}
        </Link>
      </div>

      {user.status !== 'Approved' && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-semibold">{t('account_pending_approval')}</p>
          <p className="mt-1">{t('pending_approval_note')}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-3 rounded-3xl border border-slate-200 bg-white py-16 text-slate-400 shadow-sm">
          <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
          <span className="text-sm">{t('loading')}</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-red-200 bg-red-50 py-12 text-red-700 shadow-sm">
          <AlertCircle className="h-8 w-8" />
          <p className="text-sm font-semibold px-4 text-center">{t('failed_to_load')}</p>
          <button onClick={fetchVehicles} className="mt-1 rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100">
            {t('retry')}
          </button>
        </div>
      ) : vehicles.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-slate-200 bg-white py-16 text-slate-400 shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
            <Car className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-700">{t('no_vehicles_yet')}</h2>
          <p className="text-sm max-w-xs text-center">{t('no_vehicles_note')}</p>
          {user.status === 'Approved' && (
            <Link href="/agent/post/vehicle" className="mt-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition">
              {t('create_listing')}
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((v: any) => {
            const firstImage = v.images?.[0] || '/placeholder.svg'
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
                    {tv(v.listingType)}
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                    <MapPin className="h-3 w-3" />
                    <span>{v.city}, {v.region}</span>
                  </div>
                  <h3 className="mt-2 font-bold text-slate-800 line-clamp-1">{v.title}</h3>
                  <p className="mt-1 text-lg font-extrabold text-orange-600">
                    {formatPrice(v.price)} ETB <span className="text-xs font-medium text-slate-400">{tv(v.priceType)}</span>
                  </p>

                  {v.status === 'Pending' && (
                    <div className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200 px-2 py-1.5 text-[11px] font-semibold text-amber-700">
                      <Clock className="h-3 w-3" /> {t('vehicle_pending_review')}
                    </div>
                  )}

                  {v.status === 'Rejected' && v.rejectionReason && (
                    <div className="mt-3 rounded-xl bg-red-50 border border-red-200 p-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[10px] font-bold text-red-700 uppercase tracking-wider">{t('rejection_reason')}</p>
                          <p className="text-xs text-red-600 mt-0.5">{v.rejectionReason}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                    <div className="flex flex-wrap gap-1">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">{v.make} {v.vehicleModel || v.model}</span>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">{v.manufacturingYear}</span>
                      {v.mileage != null && v.mileage > 0 && (
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">{v.mileage.toLocaleString()} km</span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                     <Link
                       href={`/listings/vehicle?id=${v.id.toString()}`}
                       className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                     >
                       <ExternalLink className="h-3.5 w-3.5" /> {t('view')}
                     </Link>
                     {v.status === 'Approved' && !permissions.granted(v.id.toString(), 'EDIT') ? (
                       permissions.pending(v.id.toString(), 'EDIT') ? (
                         <span className="inline-flex items-center justify-center rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-600">
                           {t('permission_requested')}
                         </span>
                       ) : (
                         <button
                           onClick={() => sendRequest('EDIT', v.id.toString())}
                           disabled={requesting === `EDIT:${v.id.toString()}`}
                           className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-orange-200 bg-orange-50 py-2 px-3 text-xs font-bold text-orange-700 transition hover:bg-orange-100 disabled:opacity-60"
                         >
                           {requesting === `EDIT:${v.id.toString()}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Pencil className="h-3.5 w-3.5" />} {t('request_edit')}
                         </button>
                       )
                     ) : (
                       <Link
                         href={`/agent/vehicles/edit?id=${v.id.toString()}`}
                         className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-orange-200 bg-orange-50 py-2 px-3 text-xs font-bold text-orange-700 transition hover:bg-orange-100"
                       >
                         <Pencil className="h-3.5 w-3.5" /> {t('edit')}
                       </Link>
                     )}
                    {v.status === 'Approved' && !permissions.granted(v.id.toString(), 'DELETE') ? (
                      permissions.pending(v.id.toString(), 'DELETE') ? (
                        <span className="inline-flex items-center justify-center rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-600">
                          {t('permission_requested')}
                        </span>
                      ) : (
                        <button
                          onClick={() => sendRequest('DELETE', v.id.toString())}
                          disabled={requesting === `DELETE:${v.id.toString()}`}
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 py-2 px-3 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                        >
                          {requesting === `DELETE:${v.id.toString()}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <AlertCircle className="h-3.5 w-3.5" />} {t('request_delete')}
                        </button>
                      )
                    ) : (
                      <button
                        onClick={() => deleteVehicle(v.id.toString())}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 py-2 px-3 text-xs font-bold text-red-700 transition hover:bg-red-100"
                      >
                        {t('delete')}
                      </button>
                    )}
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

