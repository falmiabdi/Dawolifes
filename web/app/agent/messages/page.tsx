"use client"

import { getApiUrl } from '@/lib/get-api-url'
import { useState, useEffect, useCallback, useRef } from 'react'
import { MessageSquare, Send, Phone, Mail, ChevronLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/components/auth/auth-guard'

interface Thread {
  propertyId: string
  propertyTitle: string
  otherUserId: string
  otherUserName: string
  otherUserPhone: string | null
  otherUserPhoto: string | null
  lastMessage: string
  lastTime: string
  unread: number
}

interface Message {
  id: string
  propertyId: string
  senderId: string
  senderName: string
  senderRole: string
  recipientId: string
  recipientName: string
  content: string
  read: boolean
  createdAt: string
}

const POLL_INTERVAL = 4000

export default function AgentMessagesPage() {
  const { user, getToken } = useAuth()
  const [threads, setThreads] = useState<Thread[]>([])
  const [activeThread, setActiveThread] = useState<Thread | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [typedMessage, setTypedMessage] = useState('')
  const [showChatMobile, setShowChatMobile] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const lastMsgCount = useRef(0)

  const authHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const token = await getToken()
    return token
      ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      : { 'Content-Type': 'application/json' }
  }, [getToken])

  // Fetch inbox and group into per-property threads
  const fetchInbox = useCallback(async () => {
    try {
      const headers = await authHeaders()
      const res = await fetch(`${getApiUrl()}/api/messages/inbox`, { headers })
      if (!res.ok) return
      const data = await res.json()
      const msgs: Message[] = data.messages || []
      const usersMap: Record<string, any> = data.users || {}
      const userId = user?.id

      // Group messages by propertyId + other party
      const threadMap = new Map<string, Thread>()
      for (const m of msgs) {
        const otherId = m.senderId === userId ? m.recipientId : m.senderId
        const key = `${m.propertyId}__${otherId}`
        const otherInfo = usersMap[otherId] || {}
        const existing = threadMap.get(key)
        const isUnread = !m.read && m.recipientId === userId

        if (!existing) {
          threadMap.set(key, {
            propertyId: m.propertyId,
            propertyTitle: m.propertyTitle || 'Listing',
            otherUserId: otherId,
            otherUserName: otherId === m.senderId ? m.senderName : m.recipientName,
            otherUserPhone: otherInfo.phone || null,
            otherUserPhoto: otherInfo.profilePhoto || null,
            lastMessage: m.content,
            lastTime: m.createdAt,
            unread: isUnread ? 1 : 0,
          })
        } else {
          if (isUnread) existing.unread++
        }
      }

      setThreads(Array.from(threadMap.values()))
    } catch (err) {
      console.error('Inbox fetch failed:', err)
    } finally {
      setLoading(false)
    }
  }, [authHeaders, user?.id])

  useEffect(() => {
    fetchInbox()
    const interval = setInterval(fetchInbox, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchInbox])

  // Fetch messages for active thread
  const fetchMessages = useCallback(async () => {
    if (!activeThread) return
    try {
      const headers = await authHeaders()
      const res = await fetch(`${getApiUrl()}/api/messages/${activeThread.propertyId}`, { headers })
      if (!res.ok) return
      const data = await res.json()
      // Only show messages between this user and the other party
      const filtered = (data.messages || []).filter((m: Message) =>
        (m.senderId === user?.id && m.recipientId === activeThread.otherUserId) ||
        (m.senderId === activeThread.otherUserId && m.recipientId === user?.id)
      )
      setMessages(filtered)
    } catch (err) {
      console.error('Messages fetch failed:', err)
    }
  }, [activeThread, authHeaders, user?.id])

  useEffect(() => {
    if (!activeThread) return
    fetchMessages()
    // Mark messages as read
    ;(async () => {
      const headers = await authHeaders()
      const res = await fetch(`${getApiUrl()}/api/messages/${activeThread.propertyId}`, { headers })
      if (res.ok) {
        const data = await res.json()
        const unread = (data.messages || []).filter(
          (m: Message) => !m.read && m.recipientId === user?.id && m.senderId === activeThread.otherUserId
        )
        for (const m of unread) {
          fetch(`${getApiUrl()}/api/messages/${m.id}/read`, { method: 'PATCH', headers }).catch(() => {})
        }
      }
    })()
    const interval = setInterval(fetchMessages, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [activeThread, fetchMessages, authHeaders, user?.id])

  // Auto-scroll
  useEffect(() => {
    if (messages.length > lastMsgCount.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
    lastMsgCount.current = messages.length
  }, [messages])

  const handleSend = async () => {
    if (!typedMessage.trim() || !activeThread || !user) return
    setSending(true)
    try {
      const headers = await authHeaders()
      const res = await fetch(`${getApiUrl()}/api/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          propertyId: activeThread.propertyId,
          recipientId: activeThread.otherUserId,
          recipientName: activeThread.otherUserName,
          content: typedMessage.trim(),
        }),
      })
      if (res.ok) {
        setTypedMessage('')
        fetchMessages()
        fetchInbox()
      }
    } catch (err) {
      console.error('Send failed:', err)
    } finally {
      setSending(false)
    }
  }

  function formatTime(dateStr: string) {
    const d = new Date(dateStr)
    const diff = Date.now() - d.getTime()
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return d.toLocaleDateString()
  }

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6 overflow-hidden">
      {/* Threads list */}
      <div className={`w-full md:w-80 flex-col rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden ${showChatMobile ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-slate-100">
          <h1 className="text-lg font-bold text-slate-900">Conversations</h1>
          <p className="text-xs text-slate-500">Inquiries from buyers</p>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : threads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
              <MessageSquare className="h-8 w-8 opacity-30 mb-2" />
              <p className="text-xs">No conversations yet</p>
            </div>
          ) : (
            threads.map((t) => (
              <button
                key={`${t.propertyId}__${t.otherUserId}`}
                onClick={() => { setActiveThread(t); setShowChatMobile(true) }}
                className={`w-full text-left rounded-2xl p-3 transition flex gap-3 ${
                  activeThread?.propertyId === t.propertyId && activeThread?.otherUserId === t.otherUserId
                    ? 'bg-orange-50 text-orange-950 border-l-4 border-orange-500'
                    : 'hover:bg-slate-50 text-slate-800'
                }`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600 font-bold text-sm">
                  {t.otherUserName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <span className="font-semibold text-sm truncate">{t.otherUserName}</span>
                    <span className="text-[10px] text-slate-400 font-medium shrink-0">{formatTime(t.lastTime)}</span>
                  </div>
                  <p className="text-xs font-medium text-slate-500 truncate mb-1">{t.propertyTitle}</p>
                  <p className={`text-xs truncate ${t.unread > 0 ? 'font-bold text-slate-900' : 'text-slate-400'}`}>
                    {t.lastMessage}
                  </p>
                </div>
                {t.unread > 0 && (
                  <span className="h-5 w-5 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0 self-center">
                    {t.unread}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat window */}
      {activeThread ? (
        <div className={`flex-1 flex flex-col rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden ${showChatMobile ? 'flex' : 'hidden md:flex'}`}>
          <div className="flex justify-between items-center px-4 py-4 md:px-6 border-b border-slate-100">
            <div className="flex items-center">
              <button onClick={() => setShowChatMobile(false)} className="md:hidden mr-3 p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 transition">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div>
                <h2 className="font-bold text-slate-950 text-sm md:text-base">{activeThread.otherUserName}</h2>
                <p className="text-[10px] md:text-xs text-slate-500 font-medium">Inquiry about: {activeThread.propertyTitle}</p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-end md:items-center gap-1 md:gap-4 text-[10px] md:text-xs text-slate-500">
              {activeThread.otherUserPhone && (
                <span className="flex items-center gap-1 font-medium">
                  <Phone className="h-3.5 w-3.5" /> {activeThread.otherUserPhone}
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-50/50">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <MessageSquare className="h-8 w-8 opacity-30 mb-2" />
                <p className="text-xs">No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((m) => {
                const isMe = m.senderId === user?.id
                return (
                  <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] md:max-w-md rounded-2xl px-4 py-2.5 text-sm ${
                      isMe
                        ? 'bg-orange-500 text-white rounded-tr-none'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                    }`}>
                      <p>{m.content}</p>
                      <span className={`block mt-1 text-[10px] text-right ${isMe ? 'text-orange-100' : 'text-slate-400'}`}>
                        {formatTime(m.createdAt)}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-slate-100 bg-white flex gap-2">
            <Input
              value={typedMessage}
              onChange={(e) => setTypedMessage(e.target.value)}
              placeholder="Type your message..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
              }}
              className="rounded-xl"
            />
            <Button
              onClick={handleSend}
              disabled={sending || !typedMessage.trim()}
              className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex-1 hidden md:flex flex-col items-center justify-center text-slate-400 bg-white border border-slate-200 rounded-3xl shadow-sm">
          <MessageSquare className="h-12 w-12 opacity-30 mb-2" />
          <p className="text-sm">Select a conversation to start messaging</p>
        </div>
      )}
    </div>
  )
}
