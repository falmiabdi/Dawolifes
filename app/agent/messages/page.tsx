"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { MessageSquare, Send, Phone, Mail, ChevronLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Conversation {
  id: string
  propertyId: string
  propertyName: string
  buyerName: string
  buyerEmail: string
  buyerPhone: string
  lastMessage: string
  lastTime: string
  unread: number
}

interface Message {
  _id: string
  sender: 'buyer' | 'agent'
  text: string
  createdAt: string
  read: boolean
}

const POLL_INTERVAL = 3000

export default function AgentMessagesPage() {
  const [agentId, setAgentId] = useState('')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConv, setActiveConv] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [typedMessage, setTypedMessage] = useState('')
  const [showChatMobile, setShowChatMobile] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const lastMessageCount = useRef(0)

  // Get agent ID from session
  useEffect(() => {
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(data => {
        const userId = data?.session?.user?.id || data?.user?.id
        if (userId) setAgentId(userId)
      })
  }, [])

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!agentId) return
    try {
      const res = await fetch(`/api/messages?agentId=${agentId}`)
      const data = await res.json()
      setConversations(data.conversations || [])
    } catch (err) {
      console.error('Failed to fetch conversations:', err)
    } finally {
      setLoading(false)
    }
  }, [agentId])

  // Poll conversations every 3s
  useEffect(() => {
    fetchConversations()
    const interval = setInterval(fetchConversations, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchConversations])

  // Fetch messages for active conversation
  const fetchMessages = useCallback(async () => {
    if (!activeConv) return
    try {
      const res = await fetch(`/api/messages?propertyId=${activeConv.propertyId}&buyerEmail=${activeConv.buyerEmail}`)
      const data = await res.json()
      setMessages(data.messages || [])
    } catch (err) {
      console.error('Failed to fetch messages:', err)
    }
  }, [activeConv])

  // Initial fetch + poll messages every 3s
  useEffect(() => {
    if (!activeConv) return
    fetchMessages()

    // Mark as read
    fetch('/api/messages', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        propertyId: activeConv.propertyId,
        buyerEmail: activeConv.buyerEmail,
        sender: 'buyer',
      }),
    }).then(() => {
      setConversations(prev =>
        prev.map(c => c.id === activeConv.id ? { ...c, unread: 0 } : c)
      )
    })

    const interval = setInterval(fetchMessages, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [activeConv, fetchMessages])

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (messages.length > lastMessageCount.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
    lastMessageCount.current = messages.length
  }, [messages])

  const handleSend = async () => {
    if (!typedMessage.trim() || !activeConv || !agentId) return
    setSending(true)
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: activeConv.propertyId,
          agentId,
          buyerName: activeConv.buyerName,
          buyerEmail: activeConv.buyerEmail,
          buyerPhone: activeConv.buyerPhone,
          sender: 'agent',
          text: typedMessage.trim(),
        }),
      })
      const data = await res.json()
      if (res.ok && data.message) {
        setMessages(prev => [...prev, data.message])
        setConversations(prev =>
          prev.map(c =>
            c.id === activeConv.id
              ? { ...c, lastMessage: typedMessage.trim(), lastTime: new Date().toISOString() }
              : c
          )
        )
      }
    } catch (err) {
      console.error('Failed to send message:', err)
    } finally {
      setSending(false)
      setTypedMessage('')
    }
  }

  function formatTime(dateStr: string) {
    const d = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
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
          <p className="text-xs text-slate-500">Inquiries from prospective buyers</p>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
              <MessageSquare className="h-8 w-8 opacity-30 mb-2" />
              <p className="text-xs">No conversations yet</p>
            </div>
          ) : (
            conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setActiveConv(c)
                  setShowChatMobile(true)
                }}
                className={`w-full text-left rounded-2xl p-3 transition flex gap-3 ${c.id === activeConv?.id ? 'bg-orange-50 text-orange-950 border-l-4 border-orange-500' : 'hover:bg-slate-50 text-slate-800'}`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600 font-bold">
                  {c.buyerName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <span className="font-semibold text-sm truncate">{c.buyerName}</span>
                    <span className="text-[10px] text-slate-400 font-medium shrink-0">{formatTime(c.lastTime)}</span>
                  </div>
                  <p className="text-xs font-medium text-slate-500 truncate mb-1">{c.propertyName}</p>
                  <p className={`text-xs truncate ${c.unread > 0 ? 'font-bold text-slate-900' : 'text-slate-400'}`}>
                    {c.lastMessage}
                  </p>
                </div>
                {c.unread > 0 && <span className="h-5 w-5 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0 self-center">{c.unread}</span>}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main chat window */}
      {activeConv ? (
        <div className={`flex-1 flex flex-col rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden ${showChatMobile ? 'flex' : 'hidden md:flex'}`}>
          <div className="flex justify-between items-center px-4 py-4 md:px-6 border-b border-slate-100">
            <div className="flex items-center">
              <button onClick={() => setShowChatMobile(false)} className="md:hidden mr-3 p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 transition">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div>
                <h2 className="font-bold text-slate-950 text-sm md:text-base">{activeConv.buyerName}</h2>
                <p className="text-[10px] md:text-xs text-slate-500 font-medium line-clamp-1">Inquiry about: {activeConv.propertyName}</p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-end md:items-center gap-1 md:gap-4 text-[10px] md:text-xs text-slate-500">
              {activeConv.buyerPhone && <span className="flex items-center gap-1 font-medium"><Phone className="h-3.5 w-3.5" /> {activeConv.buyerPhone}</span>}
              {activeConv.buyerEmail && <span className="hidden sm:flex items-center gap-1 font-medium"><Mail className="h-3.5 w-3.5" /> {activeConv.buyerEmail}</span>}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-50/50">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <MessageSquare className="h-8 w-8 opacity-30 mb-2" />
                <p className="text-xs">No messages yet</p>
              </div>
            ) : (
              messages.map((m) => {
                const isAgent = m.sender === 'agent'
                return (
                  <div key={m._id} className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] md:max-w-md rounded-2xl px-4 py-2.5 text-sm ${isAgent ? 'bg-orange-500 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'}`}>
                      <p>{m.text}</p>
                      <span className={`block mt-1 text-[10px] text-right ${isAgent ? 'text-orange-100' : 'text-slate-400'}`}>
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
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              className="rounded-xl"
            />
            <Button onClick={handleSend} disabled={sending || !typedMessage.trim()} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-white border border-slate-200 rounded-3xl shadow-sm">
          <MessageSquare className="h-12 w-12 opacity-30 mb-2" />
          <p className="text-sm">Select a conversation to start messaging</p>
        </div>
      )}
    </div>
  )
}
