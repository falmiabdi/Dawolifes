"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Loader2, MessageSquare, Phone, Send } from 'lucide-react'

import { useAuth } from '@/components/auth/auth-guard'
import { SiteHeader } from '@/components/site-header'
import { getApiUrl } from '@/lib/get-api-url'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface InboxMessage {
  id: string
  propertyId: string
  propertyTitle: string
  senderId: string
  senderName: string
  senderRole: string
  recipientId: string
  recipientName: string
  content: string
  read: boolean
  createdAt: string
}

interface InboxUser {
  name: string
  phone?: string | null
  profilePhoto?: string | null
}

interface Conversation {
  id: string
  propertyId: string
  propertyTitle: string
  otherUserId: string
  otherName: string
  otherPhone?: string | null
  lastMessage: string
  lastTime: string
  unread: number
}

const POLL_INTERVAL = 5000

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return d.toLocaleDateString()
}

export default function MessagesPage() {
  const router = useRouter()
  const { user, loading, getToken } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConv, setActiveConv] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<InboxMessage[]>([])
  const [typedMessage, setTypedMessage] = useState('')
  const [loadingInbox, setLoadingInbox] = useState(true)
  const [sending, setSending] = useState(false)
  const [showChatMobile, setShowChatMobile] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace('/auth/login?redirect=/messages')
    }
  }, [loading, user, router])

  const fetchInbox = useCallback(async () => {
    if (!user) return
    try {
      const token = await getToken()
      const res = await fetch(`${getApiUrl()}/api/messages/inbox`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      })
      if (!res.ok) return
      const data = await res.json()
      const inbox = (data.messages || []) as InboxMessage[]
      const users = (data.users || {}) as Record<string, InboxUser>

      const map = new Map<string, Conversation>()
      for (const m of inbox) {
        const otherUserId = m.senderId === user.id ? m.recipientId : m.senderId
        const otherName = m.senderId === user.id ? m.recipientName : m.senderName
        const key = `${m.propertyId}::${otherUserId}`
        const existing = map.get(key)
        const entry: Conversation = {
          id: key,
          propertyId: m.propertyId,
          propertyTitle: m.propertyTitle || 'Listing',
          otherUserId,
          otherName,
          otherPhone: users[otherUserId]?.phone,
          lastMessage: m.content,
          lastTime: m.createdAt,
          unread: m.recipientId === user.id && !m.read ? 1 : 0,
        }
        if (!existing) {
          map.set(key, entry)
        } else {
          existing.lastMessage = m.content
          existing.lastTime = m.createdAt
          existing.unread += m.recipientId === user.id && !m.read ? 1 : 0
        }
      }
      setConversations([...map.values()])
    } catch {
      // silently ignore
    } finally {
      setLoadingInbox(false)
    }
  }, [user, getToken])

  useEffect(() => {
    fetchInbox()
    const interval = setInterval(fetchInbox, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchInbox])

  const fetchMessages = useCallback(async () => {
    if (!activeConv || !user) return
    try {
      const token = await getToken()
      const res = await fetch(`${getApiUrl()}/api/messages/${activeConv.propertyId}`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      })
      if (!res.ok) return
      const data = await res.json()
      const all = (data.messages || []) as InboxMessage[]
      const filtered = all.filter(
        (m) => m.senderId === activeConv.otherUserId || m.recipientId === activeConv.otherUserId
      )
      setMessages(filtered)

      const unreadIds = filtered.filter((m) => m.recipientId === user.id && !m.read).map((m) => m.id)
      if (unreadIds.length > 0) {
        for (const id of unreadIds) {
          await fetch(`${getApiUrl()}/api/messages/${id}/read`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}` },
            credentials: 'include',
          })
        }
        setConversations((prev) =>
          prev.map((c) => (c.id === activeConv.id ? { ...c, unread: 0 } : c))
        )
      }
    } catch {
      // silently ignore
    }
  }, [activeConv, user, getToken])

  useEffect(() => {
    if (!activeConv) return
    fetchMessages()
    const interval = setInterval(fetchMessages, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [activeConv, fetchMessages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const handleSend = async () => {
    if (!typedMessage.trim() || !activeConv || !user) return
    setSending(true)
    try {
      const token = await getToken()
      const res = await fetch(`${getApiUrl()}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        credentials: 'include',
        body: JSON.stringify({
          propertyId: activeConv.propertyId,
          recipientId: activeConv.otherUserId,
          recipientName: activeConv.otherName,
          content: typedMessage.trim(),
        }),
      })
      if (res.ok) {
        const optimistic: InboxMessage = {
          id: `local-${Date.now()}`,
          propertyId: activeConv.propertyId,
          propertyTitle: activeConv.propertyTitle,
          senderId: user.id,
          senderName: user.name || user.email,
          senderRole: user.role,
          recipientId: activeConv.otherUserId,
          recipientName: activeConv.otherName,
          content: typedMessage.trim(),
          read: true,
          createdAt: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, optimistic])
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConv.id
              ? { ...c, lastMessage: optimistic.content, lastTime: optimistic.createdAt }
              : c
          )
        )
        setTypedMessage('')
      }
    } catch {
      // silently ignore
    } finally {
      setSending(false)
    }
  }

  if (loading || !user) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 bg-muted/30 p-4 sm:p-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex h-[calc(100vh-140px)] gap-4 overflow-hidden">
            <div
              className={`w-full md:w-80 flex-col rounded-2xl border border-border bg-card shadow-sm overflow-hidden ${
                showChatMobile ? 'hidden md:flex' : 'flex'
              }`}
            >
              <div className="border-b border-border p-4">
                <h1 className="text-lg font-bold text-foreground">Messages</h1>
                <p className="text-xs text-muted-foreground">Buyer inquiries for your listings</p>
              </div>
              <div className="flex-1 space-y-1 overflow-y-auto p-2">
                {loadingInbox ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                    <MessageSquare className="mb-2 h-8 w-8 opacity-30" />
                    <p className="text-xs">No inquiries yet</p>
                  </div>
                ) : (
                  conversations.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setActiveConv(c)
                        setShowChatMobile(true)
                      }}
                      className={`w-full rounded-2xl p-3 text-left transition ${
                        c.id === activeConv?.id
                          ? 'border-l-4 border-primary bg-orange-50'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className="mb-1 flex items-baseline justify-between">
                        <span className="truncate text-sm font-semibold text-foreground">{c.otherName}</span>
                        <span className="shrink-0 text-[10px] font-medium text-muted-foreground">
                          {formatTime(c.lastTime)}
                        </span>
                      </div>
                      <p className="mb-1 truncate text-xs font-medium text-muted-foreground">{c.propertyTitle}</p>
                      <p className={`truncate text-xs ${c.unread > 0 ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
                        {c.lastMessage}
                      </p>
                      {c.unread > 0 && (
                        <span className="mt-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                          {c.unread}
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>

            {activeConv ? (
              <div
                className={`flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm ${
                  showChatMobile ? 'flex' : 'hidden md:flex'
                }`}
              >
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowChatMobile(false)}
                      className="mr-1 rounded-xl p-1.5 text-muted-foreground transition hover:bg-muted md:hidden"
                      aria-label="Back"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <div>
                      <h2 className="text-sm font-bold text-foreground">{activeConv.otherName}</h2>
                      <p className="line-clamp-1 text-xs text-muted-foreground">
                        Inquiry about: {activeConv.propertyTitle}
                      </p>
                    </div>
                  </div>
                  {activeConv.otherPhone && (
                    <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                      <Phone className="h-3.5 w-3.5" /> {activeConv.otherPhone}
                    </span>
                  )}
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto bg-muted/30 p-4">
                  {messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                      <MessageSquare className="mb-2 h-8 w-8 opacity-30" />
                      <p className="text-xs">No messages yet</p>
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isMine = m.senderId === user.id
                      return (
                        <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm md:max-w-md ${
                              isMine
                                ? 'rounded-tr-none bg-primary text-primary-foreground'
                                : 'rounded-tl-none border border-border bg-card text-foreground'
                            }`}
                          >
                            <p>{m.content}</p>
                            <span
                              className={`mt-1 block text-right text-[10px] ${
                                isMine ? 'text-primary-foreground/70' : 'text-muted-foreground'
                              }`}
                            >
                              {formatTime(m.createdAt)}
                            </span>
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="flex gap-2 border-t border-border bg-card p-3">
                  <Input
                    value={typedMessage}
                    onChange={(e) => setTypedMessage(e.target.value)}
                    placeholder="Type your message..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSend()
                      }
                    }}
                    className="rounded-xl"
                  />
                  <Button onClick={handleSend} disabled={sending || !typedMessage.trim()} className="shrink-0 rounded-xl">
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="hidden flex-1 flex-col items-center justify-center rounded-2xl border border-border bg-card text-muted-foreground shadow-sm md:flex">
                <MessageSquare className="mb-2 h-12 w-12 opacity-30" />
                <p className="text-sm">Select a conversation to start messaging</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
