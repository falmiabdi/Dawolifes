"use client"

import { getApiUrl } from '@/lib/get-api-url'

import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'react-hot-toast'

export interface PermissionRequest {
  id: string
  type: 'EDIT' | 'DELETE'
  entityType: 'PROPERTY' | 'VEHICLE'
  entityId: string
  status: 'Pending' | 'Approved' | 'Rejected'
  used: boolean
  createdAt: string
}





export function useListingPermissions(getToken: () => Promise<string | null>) {
  const [requests, setRequests] = useState<PermissionRequest[]>([])
  const hydrated = useRef(false)

  const refresh = useCallback(async () => {
    const token = await getToken()
    if (!token) return
    try {
      const res = await fetch(`${getApiUrl()}/api/permissions/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setRequests(data.requests || [])
    } catch {}
  }, [getToken])

  useEffect(() => {
    if (hydrated.current) return
    hydrated.current = true
    refresh()
  }, [refresh])

  const granted = useCallback(
    (entityId: string, type: 'EDIT' | 'DELETE') =>
      requests.some(
        (r) => r.entityId === entityId && r.type === type && r.status === 'Approved' && !r.used,
      ),
    [requests],
  )

  const pending = useCallback(
    (entityId: string, type: 'EDIT' | 'DELETE') =>
      requests.some(
        (r) => r.entityId === entityId && r.type === type && r.status === 'Pending',
      ),
    [requests],
  )

  const requestPermission = useCallback(
    async (opts: { entityType: 'PROPERTY' | 'VEHICLE'; entityId: string; type: 'EDIT' | 'DELETE' }) => {
      const token = await getToken()
      if (!token) {
        toast.error('You must be signed in')
        return false
      }
      try {
        const res = await fetch(`${getApiUrl()}/api/permissions`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(opts),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => null)
          if (data?.code === 'PERMISSION_REQUIRED') {
            toast.error('Permission request was rejected')
          }
          toast.error(data?.message || 'Permission request failed')
          return false
        }
        await refresh()
        toast.success('Permission request sent to the admin')
        return true
      } catch {
        toast.error('Could not send permission request')
        return false
      }
    },
    [getToken, refresh],
  )

  return { requests, granted, pending, requestPermission, refresh }
}