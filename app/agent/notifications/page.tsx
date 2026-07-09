"use client"

import { useEffect, useState } from 'react'
import { Bell, Clock, Info, CheckCircle2, AlertTriangle, AlertCircle, Wifi, WifiOff } from 'lucide-react'

interface Notification {
  id: string
  title: string
  description: string
  type: 'info' | 'success' | 'warning' | 'error'
  time: string
}

const initialNotifications: Notification[] = [
  {
    id: 'n1',
    title: 'Registration Submitted Successfully',
    description: 'Your agent onboarding application is currently pending admin review. We will notify you as soon as your account is approved.',
    type: 'info',
    time: '2 hours ago',
  },
  {
    id: 'n2',
    title: 'Welcome to DelaHarme!',
    description: 'Thank you for registering on our platform. Explore your dashboard and read our onboarding guides to get started.',
    type: 'success',
    time: '1 day ago',
  }
]

export default function AgentNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')

  const iconConfig = {
    info: { icon: Info, color: 'text-blue-500 bg-blue-50 border-blue-100' },
    success: { icon: CheckCircle2, color: 'text-green-500 bg-green-50 border-green-100' },
    warning: { icon: AlertTriangle, color: 'text-amber-500 bg-amber-50 border-amber-100' },
    error: { icon: AlertCircle, color: 'text-red-500 bg-red-50 border-red-100' },
  }

  useEffect(() => {
    let ws: WebSocket | null = null
    let fallbackInterval: NodeJS.Timeout | null = null

    function connect() {
      setWsStatus('connecting')
      ws = new WebSocket('ws://localhost:8080')

      ws.onopen = () => {
        setWsStatus('connected')
        console.log('[WebSocket Client] Connected to notifications stream')
        if (fallbackInterval) {
          clearInterval(fallbackInterval)
          fallbackInterval = null
        }
      }

      ws.onmessage = (event) => {
        try {
          const newNotif = JSON.parse(event.data) as Notification
          setNotifications((prev) => {
            // Check if notification already exists by title/description to prevent duplicates
            if (prev.some(n => n.title === newNotif.title && n.description === newNotif.description)) {
              return prev
            }
            return [newNotif, ...prev]
          })
        } catch (err) {
          console.error('[WebSocket Client] Error parsing notification:', err)
        }
      }

      ws.onerror = () => {
        setWsStatus('disconnected')
        console.warn('[WebSocket Client] Connection error. Starting local simulator...')
        startFallbackSimulation()
      }

      ws.onclose = () => {
        setWsStatus('disconnected')
        console.warn('[WebSocket Client] Connection closed. Starting local simulator...')
        startFallbackSimulation()
      }
    }

    function startFallbackSimulation() {
      if (fallbackInterval) return
      
      const simulatedData = [
        {
          title: 'Simulated Notification: Client Inquiry',
          description: 'A buyer sent a message regarding the Bole Apartment.',
          type: 'info',
        },
        {
          title: 'Simulated Notification: Listing Approved',
          description: 'Your pending property listing has been successfully approved by the administrator.',
          type: 'success',
        }
      ]

      fallbackInterval = setInterval(() => {
        const randomItem = simulatedData[Math.floor(Math.random() * simulatedData.length)]
        const newNotif: Notification = {
          ...randomItem,
          id: 'sim-' + Math.random().toString(36).substr(2, 9),
          time: 'Just now',
          type: randomItem.type as any
        }
        setNotifications((prev) => {
          if (prev.some(n => n.title === newNotif.title)) return prev
          return [newNotif, ...prev]
        })
      }, 30000) // Every 30s
    }

    connect()

    return () => {
      if (ws) ws.close()
      if (fallbackInterval) clearInterval(fallbackInterval)
    }
  }, [])

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-sm text-slate-500">System updates, listing approvals, and announcements.</p>
        </div>
        
        {/* Connection status indicator */}
        <div className="flex items-center gap-2 self-start rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm border border-slate-200">
          {wsStatus === 'connected' ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="flex items-center gap-1"><Wifi className="h-3 w-3 text-emerald-500" /> Live Stream Connected</span>
            </>
          ) : wsStatus === 'connecting' ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span>Connecting Stream...</span>
            </>
          ) : (
            <>
              <span className="relative flex h-2 w-2">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-400"></span>
              </span>
              <span className="flex items-center gap-1"><WifiOff className="h-3 w-3 text-slate-400" /> Offline (Simulated Feed)</span>
            </>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {notifications.map((notif) => {
          const cfg = iconConfig[notif.type as keyof typeof iconConfig] || iconConfig.info
          const Icon = cfg.icon
          return (
            <div key={notif.id} className={`flex gap-4 p-5 rounded-3xl border ${cfg.color} bg-white shadow-sm transition hover:shadow-md animate-in fade-in slide-in-from-top-2 duration-300`}>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border shadow-sm">
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-bold text-slate-800 text-sm">{notif.title}</h3>
                  <span className="text-[10px] text-slate-400 font-semibold">{notif.time}</span>
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
