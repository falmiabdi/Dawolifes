"use client"

import { getApiUrl } from '@/lib/get-api-url'
import { useState, useEffect } from 'react'
import { Megaphone, CalendarDays } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

export default function AgentNewsPage() {
  const { t } = useI18n()
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${getApiUrl()}/api/announcements`)
      .then((res) => res.json())
      .then((data) => setAnnouncements(data.announcements || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    } catch {
      return ''
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-slate-900">
          <Megaphone className="h-6 w-6 text-orange-500" /> {t('announcements')}
        </h1>
        <p className="mt-1 text-sm text-slate-500">News &amp; Announcements</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-slate-200 bg-white py-16 text-slate-400 shadow-sm">
          <Megaphone className="h-10 w-10 opacity-30" />
          <p className="text-sm">{t('no_announcements')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((a: any) => (
            <article key={a.id} className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-lg font-bold text-slate-900">{a.title}</h2>
                <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                  <CalendarDays className="h-3.5 w-3.5" /> {formatDate(a.createdAt)}
                </span>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600">{a.content}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}