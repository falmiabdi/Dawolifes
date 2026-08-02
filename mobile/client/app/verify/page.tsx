"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, CheckCircle2, Loader2, LogOut, ShieldCheck } from 'lucide-react'

import { useAuth } from '@/components/auth/auth-guard'
import { SiteHeader } from '@/components/site-header'
import { getApiUrl, getApiUrlAsync } from '@/lib/get-api-url'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function VerifyPage() {
  const router = useRouter()
  const { user, loading, getToken, refreshUser, logout } = useAuth()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [photo, setPhoto] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace('/auth/login?redirect=/verify')
      return
    }
    setName(user.name || '')
    setPhone(user.phone || '')
    setPhoto(user.profilePhoto || null)
  }, [loading, user, router])

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setMessage('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`${await getApiUrlAsync()}/api/upload`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok || !data.url) {
        setMessage(data.message || 'Photo upload failed.')
        return
      }
      setPhoto(data.url)
      await saveProfile({ profilePhoto: data.url })
    } catch {
      setMessage('Photo upload failed. Please try again.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const saveProfile = async (updates: { name?: string; phone?: string; profilePhoto?: string }) => {
    setSaving(true)
    setMessage('')
    try {
      const token = await getToken()
      const res = await fetch(`${getApiUrl()}/api/auth/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify(updates),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage(data.message || 'Failed to save changes.')
        return
      }
      await refreshUser()
      setMessage('Profile updated.')
    } catch {
      setMessage('Failed to save changes. Check your connection.')
    } finally {
      setSaving(false)
    }
  }

  const handleSave = () => {
    const updates: { name?: string; phone?: string } = {}
    if (name.trim().length >= 2) updates.name = name.trim()
    if (phone.trim()) updates.phone = phone.trim()
    saveProfile(updates)
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
      <main className="flex-1 bg-muted/30">
        <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold text-foreground sm:text-2xl">My Account</h1>
          </div>

          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
            <CheckCircle2 className="h-4 w-4" /> Account verified
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account was verified when you registered. You can browse, save and message sellers.
          </p>

          <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-col items-center">
              <div className="relative">
                {photo ? (
                  <div className="relative h-24 w-24 overflow-hidden rounded-full ring-4 ring-orange-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo} alt="Profile" className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-orange-100 text-3xl font-bold text-orange-600 ring-4 ring-orange-100">
                    {(user.name || user.email || '?').charAt(0).toUpperCase()}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-orange-500 text-white shadow-md ring-2 ring-white transition hover:bg-orange-600 disabled:opacity-60"
                  aria-label="Upload profile photo"
                >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={user.email} readOnly className="bg-muted/40" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+251 91 234 5678" />
              </div>

              {message ? (
                <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p>
              ) : null}

              <Button onClick={handleSave} disabled={saving} className="w-full rounded-xl">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Changes
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  logout()
                  router.replace('/')
                }}
                className="w-full rounded-xl"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
