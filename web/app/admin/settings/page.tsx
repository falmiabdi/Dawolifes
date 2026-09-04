"use client"

import { getApiUrl } from '@/lib/get-api-url'
import { useState, useCallback, useEffect } from 'react'
import { Camera, Lock, ShieldAlert, UserPlus, CheckCircle2, Loader2, Phone, Mail, Share2 } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-guard'
import { useI18n } from '@/lib/i18n'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import toast from 'react-hot-toast'

export default function AdminSettingsPage() {
  const { user, getToken } = useAuth()
  const { t } = useI18n()
  const [saving, setSaving] = useState(false)

  // Profile
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [profilePhoto, setProfilePhoto] = useState('')
  const [uploading, setUploading] = useState(false)

  // Password
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  // Create admin
  const [newAdmin, setNewAdmin] = useState({ username: '', email: '', password: '' })
  const [creatingAdmin, setCreatingAdmin] = useState(false)
  const [isRootAdmin, setIsRootAdmin] = useState(false)

  // Contact / Social (app-wide settings)
  const [contactPhone1, setContactPhone1] = useState('')
  const [contactPhone2, setContactPhone2] = useState('')
  const [contactPhone3, setContactPhone3] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [socialFacebook, setSocialFacebook] = useState('')
  const [socialTelegram, setSocialTelegram] = useState('')
  const [socialWhatsapp, setSocialWhatsapp] = useState('')
  const [socialTiktok, setSocialTiktok] = useState('')
  const [savingSettings, setSavingSettings] = useState(false)

  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const token = await getToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [getToken])

  useEffect(() => {
    fetch(`${getApiUrl()}/api/settings`)
      .then((r) => r.json())
      .then((data) => {
        if (!data) return
        setContactPhone1(data.contactPhone1 || '')
        setContactPhone2(data.contactPhone2 || '')
        setContactPhone3(data.contactPhone3 || '')
        setContactEmail(data.contactEmail || '')
        setSocialFacebook(data.socialFacebook || '')
        setSocialTelegram(data.socialTelegram || '')
        setSocialWhatsapp(data.socialWhatsapp || '')
        setSocialTiktok(data.socialTiktok || '')
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (user) {
      setPhone((user as any).phone || '')
      setEmail((user as any).email || '')
      setProfilePhoto((user as any).profilePhoto || '')
      setIsRootAdmin((user as any).isRootAdmin || false)
    }
  }, [user])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`${getApiUrl()}/api/upload`, {
        method: 'POST',
        body: fd,
      })
      const data = await res.json()
      if (data.url) {
        setProfilePhoto(data.url)
        toast.success('Photo uploaded')
      }
    } catch {
      toast.error('Failed to upload photo')
    } finally {
      setUploading(false)
    }
  }

  const saveProfile = async () => {
    setSaving(true)
    try {
      const authHeaders = await getAuthHeaders()
      const res = await fetch(`${getApiUrl()}/api/admin/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ phone, email, profilePhoto }),
      })
      if (res.ok) {
        toast.success('Profile updated')
      } else {
        const data = await res.json()
        toast.error(data.message || 'Failed to update profile')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match")
      return
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setChangingPassword(true)
    try {
      const authHeaders = await getAuthHeaders()
      const res = await fetch(`${getApiUrl()}/api/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      if (res.ok) {
        toast.success('Password changed')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        const data = await res.json()
        toast.error(data.message || 'Failed to change password')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setChangingPassword(false)
    }
  }

  const handleCreateAdmin = async () => {
    if (!newAdmin.username || !newAdmin.email || !newAdmin.password) {
      toast.error('All fields are required')
      return
    }
    if (newAdmin.password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setCreatingAdmin(true)
    try {
      const authHeaders = await getAuthHeaders()
      const res = await fetch(`${getApiUrl()}/api/admin/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify(newAdmin),
      })
      if (res.ok) {
        toast.success('Admin created successfully')
        setNewAdmin({ username: '', email: '', password: '' })
      } else {
        const data = await res.json()
        toast.error(data.message || 'Failed to create admin')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setCreatingAdmin(false)
    }
  }

  const saveContactSettings = async () => {
    setSavingSettings(true)
    try {
      const authHeaders = await getAuthHeaders()
      const res = await fetch(`${getApiUrl()}/api/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          contactPhone1, contactPhone2, contactPhone3, contactEmail,
          socialFacebook, socialTelegram, socialWhatsapp, socialTiktok,
        }),
      })
      if (res.ok) {
        toast.success('Contact & social settings updated')
      } else {
        const data = await res.json()
        toast.error(data.message || 'Failed to update settings')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSavingSettings(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('admin_settings')}</h1>
        <p className="text-sm text-slate-500">{t('manage_profile')}</p>
      </div>

      {/* Profile */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2 text-orange-600 font-bold">
          <Camera className="h-5 w-5" />
          <h2>{t('profile')}</h2>
        </div>

        <div className="flex items-center gap-5">
          <div className="relative">
            {profilePhoto ? (
              <img src={profilePhoto} alt="Profile" className="h-20 w-20 rounded-full object-cover border-2 border-slate-200" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 border-2 border-slate-200">
                <Camera className="h-6 w-6 text-slate-400" />
              </div>
            )}
            <label className="absolute bottom-0 right-0 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-orange-500 text-white hover:bg-orange-600">
              <Camera className="h-3.5 w-3.5" />
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
            {uploading && <Loader2 className="absolute inset-0 m-auto h-6 w-6 animate-spin text-orange-500" />}
          </div>
          <div className="text-sm">
            <p className="font-bold text-slate-900">{(user as any)?.name || 'Admin'}</p>
            <p className="text-slate-400">{email}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{t('phone_number')}</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+251 900 000 000" className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>{t('email')}</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="rounded-xl" />
          </div>
        </div>
        <Button onClick={saveProfile} disabled={saving} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl">
          {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> {t('saving')}</> : t('save_profile')}
        </Button>
      </div>

      {/* Change Password */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-orange-600 font-bold">
          <Lock className="h-5 w-5" />
          <h2>{t('change_password')}</h2>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('current_password')}</Label>
            <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" className="rounded-xl" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t('new_password')}</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>{t('confirm_password')}</Label>
              <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" className="rounded-xl" />
            </div>
          </div>
          <Button onClick={handleChangePassword} disabled={changingPassword} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl">
            {changingPassword ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> {t('changing')}</> : t('change_password')}
          </Button>
        </div>
      </div>

      {/* Create Admin */}
      {isRootAdmin && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-orange-600 font-bold">
            <UserPlus className="h-5 w-5" />
            <h2>{t('create_new_admin')}</h2>
          </div>
          <p className="text-xs text-slate-400">{t('only_root_admin')}</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>{t('username')}</Label>
              <Input value={newAdmin.username} onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>{t('email')}</Label>
              <Input value={newAdmin.email} onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })} type="email" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>{t('password')}</Label>
              <Input value={newAdmin.password} onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })} type="password" className="rounded-xl" />
            </div>
          </div>
          <Button onClick={handleCreateAdmin} disabled={creatingAdmin} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl">
            {creatingAdmin ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> {t('creating')}</> : t('create_admin')}
          </Button>
        </div>
      )}

      {/* Contact & Social (app-wide, shown in footer + mobile About) */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2 text-orange-600 font-bold">
          <Phone className="h-5 w-5" />
          <h2>Contact & Social</h2>
        </div>
        <p className="text-xs text-slate-400">
          These phone numbers, email, and social links are shown to the public on the website footer and the mobile app.
          Tap-to-call works on phones; email opens the user's mail app.
        </p>

        <div className="space-y-2">
          <Label>Phone 1</Label>
          <Input value={contactPhone1} onChange={(e) => setContactPhone1(e.target.value)} placeholder="+251 900 000 000" className="rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label>Phone 2</Label>
          <Input value={contactPhone2} onChange={(e) => setContactPhone2(e.target.value)} placeholder="+251 900 000 000" className="rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label>Phone 3</Label>
          <Input value={contactPhone3} onChange={(e) => setContactPhone3(e.target.value)} placeholder="+251 900 000 000" className="rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} type="email" placeholder="info@dawolife.com" className="rounded-xl" />
        </div>

        <div className="border-t border-slate-100 pt-4 space-y-2">
          <div className="flex items-center gap-2 text-orange-600 font-bold">
            <Share2 className="h-4 w-4" />
            <h3 className="text-sm">Social Media Links</h3>
          </div>
          <div className="space-y-2">
            <Label>Facebook</Label>
            <Input value={socialFacebook} onChange={(e) => setSocialFacebook(e.target.value)} placeholder="https://facebook.com/yourpage" className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>Telegram</Label>
            <Input value={socialTelegram} onChange={(e) => setSocialTelegram(e.target.value)} placeholder="https://t.me/yourchannel" className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>WhatsApp</Label>
            <Input value={socialWhatsapp} onChange={(e) => setSocialWhatsapp(e.target.value)} placeholder="https://wa.me/251900000000" className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>TikTok</Label>
            <Input value={socialTiktok} onChange={(e) => setSocialTiktok(e.target.value)} placeholder="https://tiktok.com/@yourpage" className="rounded-xl" />
          </div>
        </div>

        <Button onClick={saveContactSettings} disabled={savingSettings} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl">
          {savingSettings ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Saving…</> : 'Save Contact & Social'}
        </Button>
      </div>
    </div>
  )
}

