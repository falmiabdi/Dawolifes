"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Star, Loader2, X, LogIn, MessageCircle } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { useAuth } from "@/components/auth/auth-guard"
import { getApiUrlAsync } from "@/lib/get-api-url"

interface AgentRatingProps {
  agentId: string
  agentName: string
}

interface Review {
  id: string
  rating: number
  comment?: string | null
  createdAt: string
  reviewer: { id: string; username: string; profilePhoto?: string | null }
}

export function AgentRating({ agentId, agentName }: AgentRatingProps) {
  const { user } = useAuth()
  const [average, setAverage] = useState(0)
  const [count, setCount] = useState(0)
  const [open, setOpen] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${await getApiUrlAsync()}/api/reviews/agent/${agentId}`, { credentials: 'include' })
      if (!res.ok) return
      const data = await res.json()
      setAverage(data.rating?.average || 0)
      setCount(data.rating?.count || 0)
    } catch {
      // Rating badge is decorative, fail silently.
    }
  }, [agentId])

  useEffect(() => {
    load()
  }, [load])

  const isOwn = !!user && user.id === agentId

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-medium text-foreground transition hover:bg-muted/60"
      >
        <span className="inline-flex">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              className={`h-3.5 w-3.5 ${i <= Math.round(average) ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"}`}
            />
          ))}
        </span>
        <span className="font-semibold text-foreground">{average ? average.toFixed(1) : "New"}</span>
        <span className="text-muted-foreground">({count})</span>
        <span className="text-primary">Reviews</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="text-sm font-bold text-foreground">Ratings for {agentName}</h3>
              <button onClick={() => setOpen(false)} className="p-1 text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-4">
              <div className="mb-3 flex items-center gap-3 rounded-xl bg-muted/40 px-4 py-3">
                <span className="inline-flex">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${i <= Math.round(average) ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"}`}
                    />
                  ))}
                </span>
                <div>
                  <p className="text-lg font-bold text-foreground">{average ? average.toFixed(1) : "No ratings yet"}</p>
                  <p className="text-xs text-muted-foreground">{count} review{count === 1 ? "" : "s"}</p>
                </div>
              </div>

              {!user ? (
                <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border p-5 text-center">
                  <LogIn className="h-7 w-7 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Sign in to rate {agentName}.</p>
                  <Link
                    href={`/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`}
                    className={buttonVariants({ className: "w-full rounded-xl font-semibold min-h-[44px]" })}
                  >
                    <LogIn className="h-4 w-4" /> Sign in
                  </Link>
                </div>
              ) : isOwn ? (
                <p className="rounded-xl bg-muted/40 p-4 text-center text-sm text-muted-foreground">
                  You cannot rate your own listings.
                </p>
              ) : (
                <ReviewForm agentId={agentId} onSubmitted={load} onClose={() => setOpen(false)} />
              )}

              <div className="mt-4">
                <ReviewList agentId={agentId} refresher={count} />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function ReviewForm({ agentId, onSubmitted, onClose }: { agentId: string; onSubmitted: () => void; onClose: () => void }) {
  const { getToken } = useAuth()
  const [rating, setRating] = useState(5)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState("")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [isError, setIsError] = useState(false)

  const submit = async () => {
    setSaving(true)
    setMessage("")
    setIsError(false)
    try {
      const token = await getToken()
      if (!token) throw new Error("Not signed in")
      const res = await fetch(`${await getApiUrlAsync()}/api/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        credentials: 'include',
        body: JSON.stringify({ agentId, rating, comment: comment.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Failed to save rating")
      setMessage(data.message || "Review saved")
      onSubmitted()
      setTimeout(onClose, 700)
    } catch (err: any) {
      setIsError(true)
      setMessage(err.message || "Failed to save rating")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl border border-border p-4">
      <p className="text-sm font-semibold text-foreground">Rate this agent</p>
      <p className="mt-0.5 text-xs text-muted-foreground">Ratings are only allowed after a conversation — a 5-star rating is reserved for service you were actually given.</p>
      <div className="my-3 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            aria-label={`${i} star${i === 1 ? "" : "s"}`}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(i)}
            className="p-0.5 transition hover:scale-110"
          >
            <Star
              className={`h-7 w-7 ${i <= (hover || rating) ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"}`}
            />
          </button>
        ))}
        <span className="ml-2 text-sm font-semibold text-foreground">{rating}.0</span>
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your experience (optional)"
        maxLength={1000}
        rows={3}
        className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      {message ? (
        <p className={`mt-2 text-xs ${isError ? "text-red-600" : "text-green-700"}`}>{message}</p>
      ) : null}
      <Button onClick={submit} disabled={saving} className="mt-3 w-full rounded-xl font-semibold min-h-[44px]">
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Star className="mr-2 h-4 w-4 fill-current" />}
        {saving ? "Saving…" : "Submit rating"}
      </Button>
    </div>
  )
}

function ReviewList({ agentId, refresher }: { agentId: string; refresher: number }) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`${getApiUrlAsync()}/api/reviews/agent/${agentId}`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return
        setReviews(data.reviews || [])
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [agentId, refresher])

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border p-5 text-center">
        <MessageCircle className="h-6 w-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No reviews yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reviews</p>
      {reviews.map((r) => (
        <div key={r.id} className="rounded-xl border border-border p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {(r.reviewer.username || "?").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{r.reviewer.username}</p>
              <span className="inline-flex">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className={`h-3 w-3 ${i <= r.rating ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"}`} />
                ))}
              </span>
            </div>
          </div>
          {r.comment ? <p className="mt-2 text-sm text-foreground/80">{r.comment}</p> : null}
        </div>
      ))}
    </div>
  )
}