"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Bookmark, X } from "lucide-react"
import { useAuth } from "@/components/auth/auth-guard"
import { getApiUrl } from "@/lib/get-api-url"
import { cn } from "@/lib/utils"

export function SaveButton({
  itemType,
  itemId,
  className,
  label,
  onChange,
}: {
  itemType: "property" | "vehicle"
  itemId: string
  className?: string
  label?: string
  onChange?: (saved: boolean) => void
}) {
  const router = useRouter()
  const { user, getToken } = useAuth()
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    if (!user) {
      setSaved(false)
      return
    }
    let cancelled = false
    const check = async () => {
      try {
        const token = await getToken()
        if (!token) return
        const res = await fetch(
          `${getApiUrl()}/api/favorites/status?itemType=${itemType}&itemId=${itemId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            credentials: "include",
          }
        )
        if (!cancelled && res.ok) {
          const data = await res.json()
          setSaved(data.saved)
        }
      } catch {
        // silently ignore
      }
    }
    check()
    return () => {
      cancelled = true
    }
  }, [user, getToken, itemType, itemId])

  const toggle = async () => {
    if (!user) {
      setShowPrompt(true)
      return
    }

    setBusy(true)
    try {
      const token = await getToken()
      const res = await fetch(`${getApiUrl()}/api/favorites`, {
        method: saved ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({ itemType, itemId }),
      })
      if (res.ok) {
        const next = !saved
        setSaved(next)
        onChange?.(next)
      }
    } catch {
      // silently ignore
    } finally {
      setBusy(false)
    }
  }

  const currentPath = () =>
    typeof window !== "undefined" ? window.location.pathname + window.location.search : "/"
  const signupHref = `/auth/signup?redirect=${encodeURIComponent(currentPath())}`
  const loginHref = `/auth/login?redirect=${encodeURIComponent(currentPath())}`

  const promptModal = showPrompt ? (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
      <div className="w-full rounded-t-2xl border border-border bg-card p-6 shadow-xl sm:max-w-sm sm:rounded-2xl">
        <div className="flex items-start justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
            <Bookmark className="h-5 w-5 text-primary" />
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={() => setShowPrompt(false)}
            className="rounded-full p-1 text-muted-foreground transition hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <h3 className="mt-4 text-lg font-bold text-foreground">Create an account to save this listing</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Save homes and cars to compare them later — it takes less than a minute and it&apos;s free.
        </p>
        <div className="mt-6 space-y-2">
          <button
            type="button"
            onClick={() => router.push(signupHref)}
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Create free account
          </button>
          <button
            type="button"
            onClick={() => router.push(loginHref)}
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground transition hover:bg-muted"
          >
            I already have an account
          </button>
        </div>
      </div>
    </div>
  ) : null

  if (label) {
    return (
      <>
        <button
          type="button"
          onClick={toggle}
          disabled={busy}
          className={cn(
            "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium transition active:scale-[0.98]",
            saved
              ? "border-primary/30 bg-primary/10 text-primary"
              : "border-border bg-card text-foreground hover:bg-accent/5",
            className
          )}
        >
          <Bookmark className={cn("h-4 w-4", saved && "fill-current")} />
          {saved ? "Saved" : label}
        </button>
        {promptModal}
      </>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        aria-label={saved ? "Remove from saved" : "Save"}
        title={saved ? "Remove from saved" : "Save"}
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-slate-500 shadow-sm ring-1 ring-black/5 transition hover:bg-white active:scale-95",
          saved && "text-primary",
          className
        )}
      >
        <Bookmark className={cn("h-5 w-5", saved && "fill-current")} />
      </button>
      {promptModal}
    </>
  )
}
