"use client"

import { getApiUrlAsync } from '@/lib/get-api-url'

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { MessageCircle, Send, Loader2, X, LogIn } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/components/auth/auth-guard"

interface MessageAgentProps {
  propertyId: string
  agentId: string
  agentName: string
  propertyTitle: string
}

interface Message {
  id: string
  senderId: string
  recipientId: string
  content: string
  read: boolean
  createdAt: string
}

export function MessageAgent({ propertyId, agentId, agentName, propertyTitle }: MessageAgentProps) {
  const { user, getToken } = useAuth()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const lastCount = useRef(0)

  const isOwnListing = !!user && user.id === agentId

  const fetchMessages = useCallback(async () => {
    const token = await getToken()
    if (!token || !open || !user) return
    try {
      const res = await fetch(`${await getApiUrlAsync()}/api/messages/${propertyId}`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Failed to load messages")
      const list: Message[] = data.messages || []

      const unreadForMe = list.filter((m) => m.recipientId === user.id && !m.read)
      for (const m of unreadForMe) {
        fetch(`${await getApiUrlAsync()}/api/messages/${m.id}/read`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
        }).catch(() => {})
      }

      setMessages(list)
    } catch (err: any) {
      setError(err.message || "Failed to load messages")
    }
  }, [propertyId, open, user, getToken])

  useEffect(() => {
    if (!open || !user || isOwnListing) return
    setLoading(true)
    fetchMessages().finally(() => setLoading(false))
    const interval = setInterval(fetchMessages, 3000)
    return () => clearInterval(interval)
  }, [open, user, isOwnListing, fetchMessages])

  // Auto-scroll
  useEffect(() => {
    if (messages.length > lastCount.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
    lastCount.current = messages.length
  }, [messages])

  const handleSend = async () => {
    if (!text.trim() || !user) return
    setSending(true)
    setError("")
    try {
      const token = await getToken()
      if (!token) throw new Error("Not signed in")
      const res = await fetch(`${await getApiUrlAsync()}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        credentials: 'include',
        body: JSON.stringify({
          propertyId,
          recipientId: agentId,
          content: text.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Failed to send")
      const sent = data.data
      setMessages(prev => [...prev, sent])
      setText("")
    } catch (err: any) {
      setError(err.message || "Failed to send")
    } finally {
      setSending(false)
    }
  }

  function formatTime(dateStr: string) {
    const d = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    if (diff < 60000) return "Just now"
    if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago'
    if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago'
    return d.toLocaleDateString()
  }

  const handleClose = () => {
    setOpen(false)
    setText("")
    setError("")
  }

  return (
    <>
      <Button
        variant="outline"
        className="w-full rounded-xl font-semibold min-h-[44px]"
        onClick={() => setOpen(true)}
      >
        <MessageCircle className="h-4 w-4" /> Message Agent
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 sm:p-4">
          <div className="w-full sm:max-w-md h-[85vh] sm:h-auto sm:max-h-[80vh] flex flex-col rounded-t-2xl sm:rounded-2xl border border-border bg-card shadow-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div>
                <h3 className="text-sm font-bold text-foreground">{agentName}</h3>
                <p className="text-[10px] text-muted-foreground line-clamp-1">Re: {propertyTitle}</p>
              </div>
              <button onClick={handleClose} className="text-muted-foreground hover:text-foreground p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            {!user ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center">
                <LogIn className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Sign in to message {agentName} about this listing.
                </p>
                <Link
                  href={`/login?redirect=${encodeURIComponent(window.location.pathname)}`}
                  className={buttonVariants({ className: "w-full rounded-xl font-semibold min-h-[44px]" })}
                >
                  <LogIn className="h-4 w-4" /> Sign in to message
                </Link>
              </div>
            ) : isOwnListing ? (
              <div className="flex-1 flex items-center justify-center p-6 text-center">
                <p className="text-sm text-muted-foreground">This is your own listing.</p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/30 min-h-0">
                  {loading && messages.length === 0 ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : messages.length === 0 ? (
                    <p className="text-center text-xs text-muted-foreground py-8">
                      No messages yet. Say hello!
                    </p>
                  ) : (
                    messages.map(m => {
                      const isMine = m.senderId === user.id
                      return (
                        <div key={m.id} className={'flex ' + (isMine ? 'justify-end' : 'justify-start')}>
                          <div className={'max-w-[80%] rounded-2xl px-3 py-2 text-sm ' + (isMine ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-card border border-border text-foreground rounded-bl-none')}>
                            <p>{m.content}</p>
                            <span className={'block mt-1 text-[10px] text-right ' + (isMine ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                              {formatTime(m.createdAt)}
                            </span>
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {error && <div className="px-4 py-2 text-xs text-red-600 bg-red-50">{error}</div>}

                <div className="p-3 border-t border-border flex gap-2 bg-card">
                  <Input
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder="Type your message..."
                    onKeyDown={e => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSend()
                      }
                    }}
                    className="rounded-xl"
                  />
                  <Button onClick={handleSend} disabled={sending || !text.trim()} className="rounded-xl shrink-0">
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
