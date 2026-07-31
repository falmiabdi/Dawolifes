"use client"

import { getApiUrl } from '@/lib/get-api-url'
import { useState, useCallback, useEffect } from 'react'
import { Camera, Lock, ShieldAlert, UserPlus, CheckCircle2, Loader2 } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-guard'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import toast from 'react-hot-toast'

export default function AdminSettingsPage() {
  const { user, getToken } = useAuth()
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

  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const token = await getToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [getToken])

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

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Settings</h1>
        <p className="text-sm text-slate-500">Manage your profile, credentials, and team.</p>
      </div>

      {/* Profile */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2 text-orange-600 font-bold">
          <Camera className="h-5 w-5" />
          <h2>Profile</h2>
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
            <Label>Phone Number</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+251 900 000 000" className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="rounded-xl" />
          </div>
        </div>
        <Button onClick={saveProfile} disabled={saving} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl">
          {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Saving...</> : 'Save Profile'}
        </Button>
      </div>

      {/* Change Password */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-orange-600 font-bold">
          <Lock className="h-5 w-5" />
          <h2>Change Password</h2>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Current Password</Label>
            <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" className="rounded-xl" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Confirm Password</Label>
              <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" className="rounded-xl" />
            </div>
          </div>
          <Button onClick={handleChangePassword} disabled={changingPassword} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl">
            {changingPassword ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Changing...</> : 'Update Password'}
          </Button>
        </div>
      </div>

      {/* Create Admin */}
      {isRootAdmin && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-orange-600 font-bold">
            <UserPlus className="h-5 w-5" />
            <h2>Create New Admin</h2>
          </div>
          <p className="text-xs text-slate-400">Only root administrators can create new admin accounts.</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Username</Label>
              <Input value={newAdmin.username} onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={newAdmin.email} onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })} type="email" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input value={newAdmin.password} onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })} type="password" className="rounded-xl" />
            </div>
          </div>
          <Button onClick={handleCreateAdmin} disabled={creatingAdmin} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl">
            {creatingAdmin ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Creating...</> : 'Create Admin'}
          </Button>
        </div>
      )}
    </div>
  )
}

