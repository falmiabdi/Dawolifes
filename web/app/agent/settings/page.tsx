"use client"

import { getApiUrl } from '@/lib/get-api-url'
import { useI18n } from '@/lib/i18n'

import { useState } from 'react'
import { Bell, Lock, CheckCircle2, FileText, Scale, ChevronRight } from 'lucide-react'
import Link from 'next/link'

import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import toast from 'react-hot-toast'
import { useAuth } from '@/components/auth/auth-guard'

export default function AgentSettingsPage() {
  const { t } = useI18n()
  const { getToken } = useAuth()
  const [success, setSuccess] = useState(false)

  const passwordSchema = z
    .object({
      current: z.string().min(1, t('current_password_required')),
      newPassword: z.string().min(8, t('password_min_8')),
      confirm: z.string().min(1, t('confirm_password_required')),
    })
    .refine((data) => data.newPassword === data.confirm, {
      message: t('passwords_dont_match'),
      path: ['confirm'],
    })

  type PasswordForm = z.infer<typeof passwordSchema>

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  })

  async function onSubmit(data: PasswordForm) {
    const token = await getToken()
    const res = await fetch(`${getApiUrl()}/api/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ currentPassword: data.current, newPassword: data.newPassword }),
    })
    if (res.ok) {
      toast.success(t('password_updated'))
      setSuccess(true)
      reset()
      setTimeout(() => setSuccess(false), 3000)
    } else {
      const err = await res.json().catch(() => ({}))
      toast.error(err.message || t('failed_to_update_password'))
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('settings')}</h1>
        <p className="text-sm text-slate-500">{t('settings_subtitle')}</p>
      </div>

      {success && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{t('security_updated')}</span>
        </div>
      )}

      {/* Security settings */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-orange-600 font-bold">
          <Lock className="h-5 w-5" />
          <h2>{t('change_password')}</h2>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>{t('current_password')}</Label>
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
              <Label>{t('new_password')}</Label>
              <Input
                type="password"
                {...register('newPassword')}
                placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                className="rounded-xl"
              />
              {errors.newPassword && <p className="text-xs text-red-500">{errors.newPassword.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>{t('confirm_password')}</Label>
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
            {t('change_password')}
          </Button>
        </form>
      </div>

      {/* Notification preferences */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-orange-600 font-bold">
          <Bell className="h-5 w-5" />
          <h2>{t('notification_preferences')}</h2>
        </div>
        <div className="space-y-3 text-sm text-slate-700">
          {[
            { id: 'notify1', title: t('notify1_title'), desc: t('notify1_desc') },
            { id: 'notify2', title: t('notify2_title'), desc: t('notify2_desc') },
            { id: 'notify3', title: t('notify3_title'), desc: t('notify3_desc') },
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

      {/* Legal */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-orange-600 font-bold">
          <FileText className="h-5 w-5" />
          <h2>{t('terms_conditions')} & {t('privacy_policy')}</h2>
        </div>
        <p className="text-sm text-slate-600">{t('of_platform')}</p>
        <div className="space-y-3">
          <Link
            href="/agent/terms-conditions"
            className="group flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm font-medium text-slate-700 hover:border-orange-200 hover:bg-orange-50"
          >
            <span className="flex items-center gap-2"><Scale className="h-4 w-4 text-slate-400 group-hover:text-orange-500" /> {t('view')} {t('terms_conditions')}</span>
            <ChevronRight className="h-4 w-4 text-slate-400 transition group-hover:text-orange-500" />
          </Link>
          <Link
            href="/agent/privacy-policy"
            className="group flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm font-medium text-slate-700 hover:border-orange-200 hover:bg-orange-50"
          >
            <span className="flex items-center gap-2"><FileText className="h-4 w-4 text-slate-400 group-hover:text-orange-500" /> {t('view')} {t('privacy_policy')}</span>
            <ChevronRight className="h-4 w-4 text-slate-400 transition group-hover:text-orange-500" />
          </Link>
        </div>
      </div>
    </div>
  )
}

