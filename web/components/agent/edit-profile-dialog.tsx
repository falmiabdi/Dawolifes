"use client"

import { useEffect, useState } from "react"
import { Loader2, PencilLine, X } from "lucide-react"
import { useAuth } from "@/components/auth/auth-guard"
import { getApiUrl } from "@/lib/get-api-url"
import { useI18n } from "@/lib/i18n"
import toast from "react-hot-toast"

interface EditProfileDialogProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  name: string
  phone: string
  email: string
}

export function EditProfileDialog({ open, onClose, onSaved, name, phone, email }: EditProfileDialogProps) {
  const { t } = useI18n()
  const { getToken } = useAuth()
  const [fullName, setFullName] = useState(name)
  const [phoneNumber, setPhoneNumber] = useState(phone)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setFullName(name)
      setPhoneNumber(phone)
    }
  }, [open, name, phone])

  if (!open) return null

  const canSave = fullName.trim().length >= 2

  async function handleSave() {
    if (!canSave || saving) return
    setSaving(true)
    try {
      const token = await getToken()
      if (!token) {
        throw new Error("Your session has expired. Please sign in again.")
      }
      const res = await fetch(`${getApiUrl()}/api/auth/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: fullName.trim(),
          phone: phoneNumber.trim(),
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || "Failed to update profile")
      }
      toast.success(t("save_profile"))
      onSaved()
      onClose()
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="w-full rounded-t-2xl border border-border bg-card p-6 shadow-xl sm:max-w-md sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
            <PencilLine className="h-5 w-5 text-primary" />
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded-full p-1 text-muted-foreground transition hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <h3 className="mt-4 text-lg font-bold text-foreground">{t("edit_profile")}</h3>
        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground">{t("full_name")}</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder={t("your_name")}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">{t("email_readonly")}</label>
            <input
              type="email"
              value={email}
              readOnly
              className="mt-1.5 w-full cursor-not-allowed rounded-xl border border-border bg-muted px-3.5 py-2.5 text-sm text-muted-foreground outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">{t("phone_number_label")}</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="+251 911 000 000"
            />
          </div>
        </div>
        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground transition hover:bg-muted"
          >
            {t("close")}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave || saving}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {saving ? t("saving") : t("save_profile")}
          </button>
        </div>
      </div>
    </div>
  )
}
