"use client"

import { getApiUrl } from '@/lib/get-api-url'

import { useState, useEffect, useRef, useCallback } from "react"

import { MessageCircle, Send, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface MessageAgentProps {
  propertyId: string
  agentId: string
  agentName: string
  propertyTitle: string
}

interface Message {
  _id: string
  sender: "buyer" | "agent"
  text: string
  createdAt: string
  read: boolean
}

interface BuyerInfo {
  name: string
  email: string
  phone: string
}

function getStorageKey(propertyId: string, email: string) {
  return `chat_${propertyId}_${email}`
}

function loadBuyerInfo(propertyId: string): BuyerInfo | null {
  try {
    const raw = localStorage.getItem(`buyer_${propertyId}`)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveBuyerInfo(propertyId: string, info: BuyerInfo) {
  localStorage.setItem(`buyer_${propertyId}`, JSON.stringify(info))
}

export function MessageAgent({ propertyId, agentId, agentName, propertyTitle }: MessageAgentProps) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<"form" | "chat">("form")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const lastCount = useRef(0)

  // Check localStorage on mount
  useEffect(() => {
    const saved = loadBuyerInfo(propertyId)
    if (saved) {
      setName(saved.name)
      setEmail(saved.email)
      setPhone(saved.phone)
    }
  }, [propertyId])

  // Fetch messages when in chat mode
  const fetchMessages = useCallback(async () => {
    if (mode !== "chat" || !email) return
    try {
      const res = await fetch(`${getApiUrl()}/api/messages?propertyId=${propertyId}&buyerEmail=${encodeURIComponent(email)}`)
      const data = await res.json()
      setMessages(data.messages || [])
    } catch {}
  }, [mode, email, propertyId])

  useEffect(() => {
    if (mode !== "chat") return
    fetchMessages()
    const interval = setInterval(fetchMessages, 3000)
    return () => clearInterval(interval)
  }, [mode, fetchMessages])

  // Auto-scroll
  useEffect(() => {
    if (messages.length > lastCount.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
    lastCount.current = messages.length
  }, [messages])

  const handleStartChat = () => {
    if (!name.trim()) {
      setError("Please enter your name.")
      return
    }
    saveBuyerInfo(propertyId, { name: name.trim(), email: email.trim(), phone: phone.trim() })
    setMode("chat")
  }

  const handleSend = async () => {
    if (!text.trim() || !name.trim()) return
    setSending(true)
    setError("")
    try {
      const res = await fetch(`${getApiUrl()}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          agentId,
          buyerName: name.trim(),
          buyerEmail: email.trim(),
          buyerPhone: phone.trim(),
          sender: "buyer",
          text: text.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Failed to send")
      setMessages(prev => [...prev, data.message])
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

            {mode === "form" ? (
              /* â”€â”€ Initial form â”€â”€ */
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {error && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
                )}
                <p className="text-xs text-muted-foreground">
                  Send a message to {agentName}. They will respond directly here.
                </p>
                <div>
                  <Label className="text-sm">Your Name *</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" className="mt-1" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm">Email</Label>
                    <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-sm">Phone</Label>
                    <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+251 9..." className="mt-1" />
                  </div>
                </div>
                <div>
                  <Label className="text-sm">First Message *</Label>
                  <Textarea
                    value={text}
                    onChange={e => setText(e.target.value)}
                    rows={3}
                    placeholder={'Hi, I\'m interested in "' + propertyTitle + '". Is it still available?'}
                    className="mt-1"
                  />
                </div>
                <Button
                  onClick={handleStartChat}
                  disabled={!name.trim() || !text.trim()}
                  className="w-full rounded-xl font-semibold min-h-[44px]"
                >
                  <Send className="h-4 w-4 mr-2" /> Start Conversation
                </Button>
              </div>
            ) : (
              /* â”€â”€ Chat thread â”€â”€ */
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/30 min-h-0">
                  {messages.map(m => {
                    const isBuyer = m.sender === "buyer"
                    return (
                      <div key={m.id} className={'flex ' + (isBuyer ? 'justify-end' : 'justify-start')}>
                        <div className={'max-w-[80%] rounded-2xl px-3 py-2 text-sm ' + (isBuyer ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-card border border-border text-foreground rounded-bl-none')}>
                          <p>{m.text}</p>
                          <span className={'block mt-1 text-[10px] text-right ' + (isBuyer ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                            {formatTime(m.createdAt)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
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

