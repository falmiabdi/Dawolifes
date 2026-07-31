"use client"

import { getApiUrl } from '@/lib/get-api-url'

import { useState } from 'react'
import { Bell, Lock, CheckCircle2 } from 'lucide-react'

import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import toast from 'react-hot-toast'

const passwordSchema = z
  .object({
    current: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirm: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirm, {
    message: "Passwords don't match",
    path: ['confirm'],
  })

type PasswordForm = z.infer<typeof passwordSchema>

export default function AgentSettingsPage() {
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  })

  async function onSubmit(data: PasswordForm) {
    const res = await fetch(`${getApiUrl()}/api/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: data.current, newPassword: data.newPassword }),
    })
    if (res.ok) {
      toast.success('Password updated successfully')
      setSuccess(true)
      reset()
      setTimeout(() => setSuccess(false), 3000)
    } else {
      const err = await res.json().catch(() => ({}))
      toast.error(err.message || 'Failed to update password')
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500">Configure account preferences, notifications and security parameters.</p>
      </div>

      {success && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Security preferences updated successfully!</span>
        </div>
      )}

      {/* Security settings */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-orange-600 font-bold">
          <Lock className="h-5 w-5" />
          <h2>Change Password</h2>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Current Password</Label>
            <Input
              type="password"
              {...register('current')}
              placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
              className="rounded-xl"
            />
            {errors.current && <p className="text-xs text-red-500">{errors.current.message}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input
                type="password"
                {...register('newPassword')}
                placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                className="rounded-xl"
              />
              {errors.newPassword && <p className="text-xs text-red-500">{errors.newPassword.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <Input
                type="password"
                {...register('confirm')}
                placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                className="rounded-xl"
              />
              {errors.confirm && <p className="text-xs text-red-500">{errors.confirm.message}</p>}
            </div>
          </div>
          <Button type="submit" disabled={isSubmitting} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl">
            Update Password
          </Button>
        </form>
      </div>

      {/* Notification preferences */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-orange-600 font-bold">
          <Bell className="h-5 w-5" />
          <h2>Notification Preferences</h2>
        </div>
        <div className="space-y-3 text-sm text-slate-700">
          {[
            { id: 'notify1', title: 'New Leads Inquiries', desc: 'Receive instant notifications when a customer sends an inquiry about your property listings.' },
            { id: 'notify2', title: 'Listing Approval Status', desc: 'Get notified when your posted properties are approved or rejected by the admin team.' },
            { id: 'notify3', title: 'Monthly Billing & Invoices', desc: 'Email alerts when subscriptions or premium features are processed.' },
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

