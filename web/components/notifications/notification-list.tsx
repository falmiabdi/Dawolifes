"use client"

import { getApiUrl, getWsUrlAsync } from '@/lib/get-api-url'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/components/auth/auth-guard'

import { Bell, Wifi, WifiOff, Info, CheckCircle2, AlertTriangle, AlertCircle, CheckCheck } from 'lucide-react'

export interface NotificationItem {
  id: string
  title: string
  body: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  data?: any
  createdAt: string
}

const iconConfig: Record<string, { icon: any; color: string }> = {
  info: { icon: Info, color: 'text-blue-500 bg-blue-50 border-blue-100' },
  success: { icon: CheckCircle2, color: 'text-green-500 bg-green-50 border-green-100' },
  warning: { icon: AlertTriangle, color: 'text-amber-500 bg-amber-50 border-amber-100' },
  error: { icon: AlertCircle, color: 'text-red-500 bg-red-50 border-red-100' },
}

export function NotificationList() {
  const { getToken } = useAuth()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  const [userId, setUserId] = useState<string | null>(null)

  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const token = await getToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [getToken])

  useEffect(() => {
    ;(async () => {
      const authHeaders = await getAuthHeaders()
      fetch(`${getApiUrl()}/api/auth/session`, { headers: { ...authHeaders } })
        .then((r) => r.json())
        .then((data) => {
          if (data?.session?.user?.id) {
            setUserId(data.session.user.id)
          }
        })
        .catch(() => {})
    })()
  }, [getAuthHeaders])

  useEffect(() => {
    if (!userId) return
    ;(async () => {
      const authHeaders = await getAuthHeaders()
      fetch(`${getApiUrl()}/api/notifications`, { headers: { ...authHeaders } })
        .then((r) => r.json())
        .then((data) => {
          if (data.notifications) {
            setNotifications(data.notifications)
            setUnreadCount(data.notifications.filter((n: NotificationItem) => !n.read).length)
          }
        })
        .catch(() => {})
    })()
  }, [userId, getAuthHeaders])

  useEffect(() => {
    if (!userId) return

    let ws: WebSocket | null = null
    let reconnectTimeout: NodeJS.Timeout | null = null
    let reconnectAttempts = 0
    const maxReconnectAttempts = 10

    function connect() {
      setWsStatus('connecting')
      getWsUrlAsync(`/ws?userId=${userId}`).then((wsUrl) => {
        if (ws) return
        ws = new WebSocket(wsUrl)

        ws.onopen = () => {
          setWsStatus('connected')
          reconnectAttempts = 0
        }

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            if (data.type === 'notification') {
              const notif = data.notification as NotificationItem
              setNotifications((prev) => {
                if (prev.some((n) => n.id === notif.id)) return prev
                return [notif, ...prev]
              })
              setUnreadCount((prev) => prev + 1)
            }
            if (data.type === 'unread_count') {
              setUnreadCount(data.count)
            }
          } catch {}
        }

        ws.onerror = () => setWsStatus('disconnected')
        ws.onclose = () => {
          setWsStatus('disconnected')
          if (reconnectAttempts < maxReconnectAttempts) {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000)
            reconnectTimeout = setTimeout(() => {
              reconnectAttempts++
              connect()
            }, delay)
          }
        }
      })
    }

    connect()
    return () => {
      if (ws) ws.close()
      if (reconnectTimeout) clearTimeout(reconnectTimeout)
    }
  }, [userId])

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
    const authHeaders = await getAuthHeaders()
    await fetch(`${getApiUrl()}/api/notifications/read-all`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
    })
  }, [getAuthHeaders])

  const markSingleRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    setUnreadCount((prev) => Math.max(0, prev - 1))
    const authHeaders = await getAuthHeaders()
    await fetch(`${getApiUrl()}/api/notifications/${id}/read`, {
      method: 'PATCH',
      headers: authHeaders,
    })
  }, [getAuthHeaders])

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    return d.toLocaleDateString()
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            Notifications
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-500">System updates, listing approvals, and announcements.</p>
        </div>

        <div className="flex items-center gap-3 self-start">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 border border-slate-200 hover:bg-slate-200 transition"
            >
              <CheckCheck className="h-3 w-3" /> Mark all read
            </button>
          )}

          <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm border border-slate-200">
            {wsStatus === 'connected' ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="flex items-center gap-1"><Wifi className="h-3 w-3 text-emerald-500" /> Live</span>
              </>
            ) : wsStatus === 'connecting' ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-400"></span>
                </span>
                <span className="flex items-center gap-1"><WifiOff className="h-3 w-3 text-slate-400" /> Offline</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {notifications.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Bell className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">No notifications yet</p>
          </div>
        )}

        {notifications.map((notif) => {
          const cfg = iconConfig[notif.type] || iconConfig.info
          const Icon = cfg.icon
          return (
            <div
              key={notif.id}
              onClick={() => !notif.read && markSingleRead(notif.id)}
              className={`flex gap-4 p-5 rounded-2xl border ${cfg.color} shadow-sm transition hover:shadow-md animate-in fade-in slide-in-from-top-2 duration-300 ${
                notif.read ? 'opacity-60' : 'cursor-pointer'
              }`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border shadow-sm">
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1 gap-2">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    {!notif.read && (
                      <span className="inline-block h-2 w-2 rounded-full bg-blue-500 shrink-0"></span>
                    )}
                    {notif.title}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-semibold shrink-0">{formatTime(notif.createdAt)}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{notif.body}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

