"use client"

import { useState, useEffect } from "react"
import { CalendarDays, Megaphone, Loader2 } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { WebFooter } from "@/components/site/web-footer"
import { getApiUrl } from "@/lib/get-api-url"

interface Announcement {
  id: string
  title: string
  content: string
  authorId: string
  createdAt: string
  updatedAt: string
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  } catch {
    return iso
  }
}

export default function NewsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${getApiUrl()}/api/announcements`)
      .then((res) => res.json())
      .then((data) => setAnnouncements(data.announcements || []))
      .catch(() => setError("Unable to load announcements. Please try again later."))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Megaphone className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                  News & Announcements
                </h1>
                <p className="text-sm text-muted-foreground">
                  Latest updates and announcements from the DawoLife team.
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="mb-3 h-8 w-8 animate-spin text-primary" />
              <span className="text-sm">Loading announcements…</span>
            </div>
          ) : error ? (
            <div className="rounded-3xl border border-border bg-card p-10 text-center text-muted-foreground">
              <p className="text-sm">{error}</p>
            </div>
          ) : announcements.length === 0 ? (
            <div className="rounded-3xl border border-border bg-card p-10 text-center text-muted-foreground">
              <Megaphone className="mx-auto mb-3 h-10 w-10 opacity-40" />
              <p className="text-sm font-medium">No announcements yet</p>
            </div>
          ) : (
            <div className="space-y-5">
              {announcements.map((item) => (
                <article
                  key={item.id}
                  className="rounded-3xl border border-border bg-card p-6 shadow-sm transition hover:shadow-md"
                >
                  <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {formatDate(item.createdAt)}
                  </div>
                  <h2 className="mb-2 text-lg font-bold text-foreground">{item.title}</h2>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                    {item.content}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
      <WebFooter />
    </div>
  )
}
