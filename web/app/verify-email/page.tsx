"use client"

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, Mail, ExternalLink, CheckCircle, KeyRound } from 'lucide-react'

import { AuthShell } from '@/components/auth/auth-shell'
import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { getApiUrlAsync } from '@/lib/get-api-url'

const RESEND_COOLDOWN = 60

function VerifyEmailForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { t } = useI18n()

  const email = searchParams.get('email') || ''
  const prefillCode = (searchParams.get('code') || '').replace(/\D/g, '')
  const [code, setCode] = useState(prefillCode.slice(0, 6))
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [verifying, setVerifying] = useState(false)
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

  const openEmail = () => {
    if (email) {
      window.location.href = `mailto:${email}`
    }
  }

  const handleVerify = async () => {
    showMessage('')
    const trimmed = code.trim()
    if (!/^\d{6}$/.test(trimmed)) {
      showMessage('Enter the 6-digit code from your email.', true)
      return
    }
    setVerifying(true)
    try {
      const res = await fetch(`${await getApiUrlAsync()}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, otp: trimmed }),
      })
      const data = await res.json()
      if (!res.ok) {
        showMessage(data.message || 'Verification failed. Try again.', true)
        return
      }
      const role = data.user?.role
      const target = role === 'admin' ? '/admin' : role === 'agent' ? '/agent' : '/saved'
      router.push(target)
    } catch {
      showMessage('Cannot reach the server. Check your connection.', true)
    } finally {
      setVerifying(false)
    }
  }

  const handleResend = async () => {
    showMessage('')
    setSending(true)
    try {
      const res = await fetch(`${await getApiUrlAsync()}/api/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        showMessage(data.message || 'Failed to resend the code.', true)
        return
      }
      showMessage('A new verification code has been sent to your email.')
      setCooldown(RESEND_COOLDOWN)
    } catch {
      showMessage('Cannot reach the server. Check your connection.', true)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Primary: enter the 6-digit code */}
      <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
        <div className="flex items-start gap-3 text-sm text-orange-800">
          <KeyRound className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            We emailed a <span className="font-semibold">6-digit code</span> to{' '}
            <span className="font-semibold">{email || 'your email'}</span>. Enter it below to verify your account.
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
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleVerify()
          }}
        />

        <div className="mt-4">
          <Button type="button" onClick={handleVerify} disabled={verifying} className="w-full rounded-full">
            {verifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
            {verifying ? 'Verifying…' : 'Verify'}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3 text-sm text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        OR
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      {/* Alternative: use the emailed link */}
      <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
        <div className="flex items-start gap-3 text-sm text-orange-800">
          <Mail className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            We also emailed a verification link to <span className="font-semibold">{email || 'your email'}</span>. Open
            your email and tap the <span className="font-semibold">&quot;Verify Email&quot;</span> button.
          </p>
        </div>

        <div className="mt-4 grid gap-3">
          <Button type="button" variant="outline" onClick={openEmail} className="w-full rounded-full">
            <ExternalLink className="mr-2 h-4 w-4" />
            Open Email App
          </Button>
          <Link href="/login?verified=1" className="block">
            <Button type="button" className="w-full rounded-full">
              <CheckCircle className="mr-2 h-4 w-4" />
              I verified — continue to sign in
            </Button>
          </Link>
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

      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-400">Didn&apos;t receive it?</span>
        <button
          type="button"
          onClick={handleResend}
          disabled={sending || cooldown > 0}
          className="font-semibold text-orange-600 hover:text-orange-700 disabled:text-slate-300"
        >
          {sending ? 'Sending…' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
        </button>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  const { t } = useI18n()

  return (
    <AuthShell
      title="Verify Your Email"
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
        <VerifyEmailForm />
      </Suspense>
    </AuthShell>
  )
}