"use client"

import { useState } from 'react'
import { MessageSquare, Send, User, Search, Phone, Mail, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Thread {
  id: string
  name: string
  property: string
  lastMessage: string
  time: string
  unread: boolean
  phone: string
  email: string
  messages: Array<{ sender: 'client' | 'agent'; text: string; time: string }>
}

const mockThreads: Thread[] = [
  {
    id: 't1',
    name: 'Almaz Kassa',
    property: 'Modern Bole Apartment',
    lastMessage: 'Is the price negotiable?',
    time: '2 hours ago',
    unread: true,
    phone: '+251 911 223 344',
    email: 'almaz.kassa@gmail.com',
    messages: [
      { sender: 'client', text: 'Hello, I am interested in the Bole apartment listing.', time: '10:00 AM' },
      { sender: 'agent', text: 'Hi Almaz, thank you for reaching out. It is currently available. Would you like to schedule a visit?', time: '10:15 AM' },
      { sender: 'client', text: 'Yes, that would be great. Also, is the price negotiable?', time: '10:30 AM' },
    ]
  },
  {
    id: 't2',
    name: 'Bekele Shiferaw',
    property: 'Luxury Villa with Pool',
    lastMessage: 'Can we visit the property this Sunday?',
    time: '1 day ago',
    unread: false,
    phone: '+251 920 445 566',
    email: 'bekele.shif@gmail.com',
    messages: [
      { sender: 'client', text: 'Hi, is the pool clean and heated?', time: 'Yesterday' },
      { sender: 'agent', text: 'Hello Bekele. Yes, the pool has a modern filtration and heating system installed.', time: 'Yesterday' },
      { sender: 'client', text: 'Excellent. Can we visit the property this Sunday?', time: 'Yesterday' },
    ]
  }
]

export default function AgentMessagesPage() {
  const [threads, setThreads] = useState<Thread[]>(mockThreads)
  const [activeThreadId, setActiveThreadId] = useState('t1')
  const [typedMessage, setTypedMessage] = useState('')
  const [showChatMobile, setShowChatMobile] = useState(false)

  const activeThread = threads.find(t => t.id === activeThreadId) || threads[0]

  function handleSend() {
    if (!typedMessage.trim() || !activeThread) return
    
    // Add message
    const updatedThreads = threads.map(t => {
      if (t.id === activeThread.id) {
        return {
          ...t,
          lastMessage: typedMessage,
          time: 'Just now',
          unread: false,
          messages: [...t.messages, { sender: 'agent' as const, text: typedMessage, time: 'Just now' }]
        }
      }
      return t
    })
    setThreads(updatedThreads)
    setTypedMessage('')

    // Auto reply simulation after 1.5 seconds
    setTimeout(() => {
      setThreads(prev => prev.map(t => {
        if (t.id === activeThread.id) {
          return {
            ...t,
            lastMessage: 'Got it, thanks!',
            time: 'Just now',
            messages: [...t.messages, { sender: 'client' as const, text: 'Got it, thanks!', time: 'Just now' }]
          }
        }
        return t
      }))
    }, 1500)
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
          {threads.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setActiveThreadId(t.id)
                t.unread = false
                setShowChatMobile(true)
              }}
              className={`w-full text-left rounded-2xl p-3 transition flex gap-3 ${t.id === activeThreadId ? 'bg-orange-50 text-orange-950 border-l-4 border-orange-500' : 'hover:bg-slate-50 text-slate-800'}`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600 font-bold">
                {t.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                  <span className="font-semibold text-sm truncate">{t.name}</span>
                  <span className="text-[10px] text-slate-400 font-medium shrink-0">{t.time}</span>
                </div>
                <p className="text-xs font-medium text-slate-500 truncate mb-1">{t.property}</p>
                <p className={`text-xs truncate ${t.unread ? 'font-bold text-slate-900' : 'text-slate-400'}`}>
                  {t.lastMessage}
                </p>
              </div>
              {t.unread && <span className="h-2 w-2 rounded-full bg-orange-500 shrink-0 self-center" />}
            </button>
          ))}
        </div>
      </div>

      {/* Main chat window */}
      {activeThread ? (
        <div className={`flex-1 flex flex-col rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden ${showChatMobile ? 'flex' : 'hidden md:flex'}`}>
          {/* Header */}
          <div className="flex justify-between items-center px-4 py-4 md:px-6 border-b border-slate-100">
            <div className="flex items-center">
              <button
                onClick={() => setShowChatMobile(false)}
                className="md:hidden mr-3 p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 transition"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div>
                <h2 className="font-bold text-slate-950 text-sm md:text-base">{activeThread.name}</h2>
                <p className="text-[10px] md:text-xs text-slate-500 font-medium line-clamp-1">Inquiry about: {activeThread.property}</p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-end md:items-center gap-1 md:gap-4 text-[10px] md:text-xs text-slate-500">
              <span className="flex items-center gap-1 font-medium"><Phone className="h-3.5 w-3.5" /> {activeThread.phone}</span>
              <span className="hidden sm:flex items-center gap-1 font-medium"><Mail className="h-3.5 w-3.5" /> {activeThread.email}</span>
            </div>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-50/50">
            {activeThread.messages.map((m, idx) => {
              const isAgent = m.sender === 'agent'
              return (
                <div key={idx} className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] md:max-w-md rounded-2xl px-4 py-2.5 text-sm ${isAgent ? 'bg-orange-500 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'}`}>
                    <p>{m.text}</p>
                    <span className={`block mt-1 text-[10px] text-right ${isAgent ? 'text-orange-100' : 'text-slate-400'}`}>
                      {m.time}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer input */}
          <div className="p-4 border-t border-slate-100 bg-white flex gap-2">
            <Input
              value={typedMessage}
              onChange={(e) => setTypedMessage(e.target.value)}
              placeholder="Type your message..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleSend()
                }
              }}
              className="rounded-xl"
            />
            <Button onClick={handleSend} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl">
              <Send className="h-4 w-4" /> Send
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
