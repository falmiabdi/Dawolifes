"use client"

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, Eye, EyeOff, KeyRound, Loader2 } from 'lucide-react'

import { AuthShell } from '@/components/auth/auth-shell'
import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getApiUrlAsync } from '@/lib/get-api-url'

const RESEND_COOLDOWN = 60

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { t } = useI18n()

  const email = searchParams.get('email') || ''
  const prefillCode = (searchParams.get('code') || '').replace(/\D/g, '')
  const [code, setCode] = useState(prefillCode.slice(0, 6))
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [sending, setSending] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          clearInterval(timer)
          return 0
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  const showMessage = (text: string, error = false) => {
    setMessage(text)
    setIsError(error)
  }

  const handleSubmit = async () => {
    showMessage('')
    const trimmedCode = code.trim()
    if (!/^\d{6}$/.test(trimmedCode)) {
      showMessage('Enter the 6-digit code from your email.', true)
      return
    }
    if (newPassword.length < 8) {
      showMessage('Password must be at least 8 characters long.', true)
      return
    }
    if (newPassword !== confirmPassword) {
      showMessage(t('password_mismatch'), true)
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`${await getApiUrlAsync()}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: trimmedCode, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) {
        showMessage(data.message || 'Failed to reset the password. Try again.', true)
        return
      }
      router.push('/login?reset=1')
    } catch {
      showMessage('Cannot reach the server. Check your connection.', true)
    } finally {
      setSubmitting(false)
    }
  }

  const handleResend = async () => {
    showMessage('')
    setSending(true)
    try {
      const res = await fetch(`${await getApiUrlAsync()}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        showMessage(data.message || 'Failed to resend the code.', true)
        return
      }
      if (data.devOtp) setCode(data.devOtp.slice(0, 6))
      showMessage(t('reset_code_sent'))
      setCooldown(RESEND_COOLDOWN)
    } catch {
      showMessage('Cannot reach the server. Check your connection.', true)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
        <div className="flex items-start gap-3 text-sm text-orange-800">
          <KeyRound className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            {t('reset_password_subtitle')} <span className="font-semibold">{email || 'your email'}</span>. Enter it
            below to set a new password.
          </p>
        </div>

        <input
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="••••••"
          className="mt-4 w-full rounded-xl border border-orange-300 bg-white px-4 py-3 text-center text-2xl font-semibold tracking-[0.5em] text-orange-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
        />
      </div>

      <div className="grid gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="new-password">{t('new_password_label')}</Label>
          <div className="relative">
            <Input
              id="new-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
            <button
              type="button"
              className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-500"
              onClick={() => setShowPassword((value) => !value)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm-password">{t('confirm_new_password')}</Label>
          <Input
            id="confirm-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit()
            }}
            placeholder="Re-enter the new password"
          />
        </div>
      </div>

      {message ? (
        <p
          className={`rounded-lg border px-3 py-2 text-sm ${
            isError ? 'border-red-200 bg-red-50 text-red-600' : 'border-green-200 bg-green-50 text-green-700'
          }`}
        >
          {message}
        </p>
      ) : null}

      <Button type="button" onClick={handleSubmit} disabled={submitting} className="w-full rounded-full">
        {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
        {submitting ? 'Resetting…' : t('reset_password_button')}
      </Button>

      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-400">Didn&apos;t receive it?</span>
        <button
          type="button"
          onClick={handleResend}
          disabled={sending || cooldown > 0}
          className="font-semibold text-orange-600 hover:text-orange-700 disabled:text-slate-300"
        >
          {sending ? 'Sending…' : cooldown > 0 ? `Resend in ${cooldown}s` : t('resend_reset_code')}
        </button>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  const { t } = useI18n()

  return (
    <AuthShell
      title={t('reset_password_title')}
      footer={
        <p className="text-center text-sm text-slate-500">
          <Link href="/login" className="font-semibold text-orange-600 hover:text-orange-700">
            {t('sign_in_link')}
          </Link>
        </p>
      }
    >
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  )
}