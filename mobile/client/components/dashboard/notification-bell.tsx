"use client"

import { getApiUrlAsync, getWsUrlAsync } from '@/lib/get-api-url'

import { useEffect, useState, useCallback } from 'react'
import { Bell } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-guard'
import Link from 'next/link'


export function NotificationBell() {
  const { getToken } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)
  const [role, setRole] = useState<string>('agent')

  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const token = await getToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [getToken])

  // Fetch userId from session
  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const authHeaders = await getAuthHeaders()
        const apiBase = await getApiUrlAsync()
        const response = await fetch(`${apiBase}/api/auth/session`, { headers: { ...authHeaders } })
        const data = await response.json()
        if (!cancelled && data?.session?.user?.id) {
          setUserId(data.session.user.id)
          setRole(data.session.user.role || 'agent')
        }
      } catch (error) {
        console.error('[API] Failed to load session for notification bell:', error)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [getAuthHeaders])

  // Poll unread count
  useEffect(() => {
    if (!userId) return
    let cancelled = false

    const loadUnreadCount = async () => {
      try {
        const authHeaders = await getAuthHeaders()
        const apiBase = await getApiUrlAsync()
        const response = await fetch(`${apiBase}/api/notifications/count`, { headers: { ...authHeaders } })
        const data = await response.json()
        if (!cancelled && typeof data.count === 'number') {
          setUnreadCount(data.count)
        }
      } catch (error) {
        console.error('[API] Failed to load unread notifications count:', error)
      }
    }

    ;(async () => {
      await loadUnreadCount()
    })()

    const interval = setInterval(async () => {
      await loadUnreadCount()
    }, 30000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [userId, getAuthHeaders])

  // WebSocket live updates
  useEffect(() => {
    if (!userId) return

    let ws: WebSocket | null = null
    let reconnectTimeout: NodeJS.Timeout | null = null
    let reconnectAttempts = 0

    let cancelled = false

    async function connect() {
      try {
        const wsUrl = await getWsUrlAsync(`/ws?userId=${userId}`)
        if (cancelled || ws) return
        ws = new WebSocket(wsUrl)

        ws.onopen = () => {
          reconnectAttempts = 0
        }

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            if (data.type === 'notification') {
              setUnreadCount((prev) => prev + 1)
            }
            if (data.type === 'unread_count') {
              setUnreadCount(data.count)
            }
          } catch {}
        }

        ws.onclose = () => {
          ws = null
          if (reconnectAttempts < 5) {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 15000)
            reconnectTimeout = setTimeout(() => {
              reconnectAttempts++
              void connect()
            }, delay)
          }
        }
      } catch (error) {
        console.error('[WS] Failed to connect notification bell socket:', error)
      }
    }

    void connect()
    return () => {
      cancelled = true
      if (ws) ws.close()
      if (reconnectTimeout) clearTimeout(reconnectTimeout)
    }
  }, [userId])

  return (
    <Link
      href={userId ? `/${role}/notifications` : '#'}
      className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100 transition"
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 inline-flex items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white min-w-[18px] leading-none">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      ) : (
        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-orange-500" />
      )}
    </Link>
  )
}
