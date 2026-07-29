"use client"

import { useEffect, useState, useCallback } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
import { Bell, Wifi, WifiOff, Info, CheckCircle2, AlertTriangle, AlertCircle, CheckCheck } from 'lucide-react'

interface Notification {
  id: string
  title: string
  description: string
  type: 'info' | 'success' | 'warning' | 'error'
  isRead: boolean
  time: string
}

const iconConfig = {
  info: { icon: Info, color: 'text-blue-500 bg-blue-50 border-blue-100' },
  success: { icon: CheckCircle2, color: 'text-green-500 bg-green-50 border-green-100' },
  warning: { icon: AlertTriangle, color: 'text-amber-500 bg-amber-50 border-amber-100' },
  error: { icon: AlertCircle, color: 'text-red-500 bg-red-50 border-red-100' },
}

export default function AgentNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  const [userId, setUserId] = useState<string | null>(null)

  // Fetch current user session
  useEffect(() => {
    fetch(`${API_URL}/api/auth/session`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.user?.id) {
          setUserId(data.user.id)
        }
      })
      .catch(() => {})
  }, [])

  // Fetch notifications from DB on load
  useEffect(() => {
    if (!userId) return
    fetch(`${API_URL}/api/notifications`)
      .then((r) => r.json())
      .then((data) => {
        if (data.notifications) {
          setNotifications(data.notifications)
          setUnreadCount(data.notifications.filter((n: Notification) => !n.isRead).length)
        }
      })
      .catch(() => {})
  }, [userId])

  // WebSocket connection
  useEffect(() => {
    if (!userId) return

    let ws: WebSocket | null = null
    let reconnectTimeout: NodeJS.Timeout | null = null
    let reconnectAttempts = 0
    const maxReconnectAttempts = 10

    function connect() {
      setWsStatus('connecting')
      const wsUrl = process.env.NODE_ENV === 'production'
        ? `wss://${process.env.NEXT_PUBLIC_WS_DOMAIN}/notifications?userId=${userId}`
        : `ws://localhost:4000/notifications?userId=${userId}`

      ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        setWsStatus('connected')
        reconnectAttempts = 0
        console.log('[WebSocket] Connected')
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          if (data.event === 'notification') {
            const notif = data.notification as Notification
            setNotifications((prev) => {
              if (prev.some((n) => n.id === notif.id)) return prev
              return [notif, ...prev]
            })
          }

          if (data.event === 'unread_count') {
            setUnreadCount(data.count)
          }
        } catch (err) {
          console.error('[WebSocket] Parse error:', err)
        }
      }

      ws.onerror = () => {
        setWsStatus('disconnected')
      }

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
    }

    connect()

    return () => {
      if (ws) ws.close()
      if (reconnectTimeout) clearTimeout(reconnectTimeout)
    }
  }, [userId])

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    setUnreadCount(0)
    await fetch(`${API_URL}/api/notifications`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAllRead: true }),
    })
  }, [])

  const markSingleRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
    await fetch(`${API_URL}/api/notifications`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationId: id }),
    })
  }, [])

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
              onClick={() => !notif.isRead && markSingleRead(notif.id)}
              className={`flex gap-4 p-5 rounded-2xl border ${cfg.color} shadow-sm transition hover:shadow-md animate-in fade-in slide-in-from-top-2 duration-300 ${
                notif.isRead ? 'opacity-60' : 'cursor-pointer'
              }`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border shadow-sm">
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1 gap-2">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    {!notif.isRead && (
                      <span className="inline-block h-2 w-2 rounded-full bg-blue-500 shrink-0"></span>
                    )}
                    {notif.title}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-semibold shrink-0">{notif.time}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{notif.description}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
