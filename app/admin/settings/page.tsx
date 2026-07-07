"use client"

import { useState } from 'react'
import { Lock, Bell, ShieldAlert, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function AdminSettingsPage() {
  const [success, setSuccess] = useState(false)
  const [password, setPassword] = useState({ current: '', new: '', confirm: '' })

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Settings</h1>
        <p className="text-sm text-slate-500">Manage administrator security credentials and system notifications.</p>
      </div>

      {success && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Admin configuration updated successfully!</span>
        </div>
      )}

      {/* Security Credentials */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-orange-600 font-bold">
          <Lock className="h-5 w-5" />
          <h2>Change Master Password</h2>
        </div>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label>Current Master Password</Label>
            <Input
              type="password"
              value={password.current}
              onChange={(e) => setPassword(prev => ({ ...prev, current: e.target.value }))}
              placeholder="••••••••"
              className="rounded-xl"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>New Master Password</Label>
              <Input
                type="password"
                value={password.new}
                onChange={(e) => setPassword(prev => ({ ...prev, new: e.target.value }))}
                placeholder="••••••••"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Confirm Master Password</Label>
              <Input
                type="password"
                value={password.confirm}
                onChange={(e) => setPassword(prev => ({ ...prev, confirm: e.target.value }))}
                placeholder="••••••••"
                className="rounded-xl"
              />
            </div>
          </div>
          <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl">
            Update Security Credentials
          </Button>
        </form>
      </div>

      {/* System configuration */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-orange-600 font-bold">
          <ShieldAlert className="h-5 w-5" />
          <h2>Platform Rules & Audits</h2>
        </div>
        <div className="space-y-3 text-sm text-slate-700">
          {[
            { id: 'rule1', title: 'Auto-Reject Blank Applications', desc: 'System automatically flags and requests updates for onboarding forms with missing document attachments.' },
            { id: 'rule2', title: 'Listing Verifications Audit Trail', desc: 'Track administrator usernames and action logs for every approved/rejected listing.' },
          ].map((item) => (
            <label key={item.id} className="flex items-start gap-4 p-3 rounded-2xl border border-slate-50 hover:bg-slate-50/50 cursor-pointer">
              <input type="checkbox" defaultChecked className="mt-1 accent-orange-500" />
              <div>
                <p className="font-semibold text-slate-900">{item.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}
