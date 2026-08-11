"use client"

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2, Loader2, Mail, RotateCcw } from 'lucide-react'

import { AuthShell } from '@/components/auth/auth-shell'
import { useAuth } from '@/components/auth/auth-guard'
import { isFirebaseEmailVerified, resendFirebaseVerification, signInFirebaseUser } from '@/lib/firebase-auth'
import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getApiUrlAsync } from '@/lib/get-api-url'

const OTP_LENGTH = 6
const RESEND_COOLDOWN = 60

function VerifyEmailForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { verifyOtp } = useAuth()
  const { t } = useI18n()

  const initialEmail = searchParams.get('email') || ''
  const initialCode = searchParams.get('code') || ''
  const [email, setEmail] = useState(initialEmail)
  const [otp, setOtp] = useState(initialCode)
  const [message, setMessage] = useState(initialCode ? `Dev code auto-filled: ${initialCode}` : '')
  const [isError, setIsError] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [sending, setSending] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [firebaseChecking, setFirebaseChecking] = useState(false)
  const [firebaseResending, setFirebaseResending] = useState(false)
  const [firebaseNote, setFirebaseNote] = useState('')

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

  const handleVerify = async () => {
    setMessage('')
    if (!email.trim()) {
      showMessage('Please enter your email address.', true)
      return
    }
    if (otp.trim().length !== OTP_LENGTH) {
      showMessage(`Enter the ${OTP_LENGTH}-digit code we emailed you.`, true)
      return
    }
    setVerifying(true)
    try {
      await verifyOtp(email.trim(), otp.trim())
      // Verification only activates the account. The user should sign in with
      // the password they chose during registration.
      router.replace('/login?verified=1')
    } catch (err: any) {
      showMessage(err?.message || 'Verification failed. Please try again.', true)
    } finally {
      setVerifying(false)
    }
  }

  const handleResend = async () => {
    setMessage('')
    if (!email.trim()) {
      showMessage('Please enter your email address first.', true)
      return
    }
    setSending(true)
    try {
      const res = await fetch(`${await getApiUrlAsync()}/api/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        showMessage(data.message || 'Failed to resend the code.', true)
        return
      }
      showMessage('A new code has been sent to your email.')
      setCooldown(RESEND_COOLDOWN)
    } catch {
      showMessage('Cannot reach the server. Check your connection.', true)
    } finally {
      setSending(false)
    }
  }

  const handleFirebaseCheck = async () => {
    setFirebaseNote('')
    setFirebaseChecking(true)
    try {
      const verified = await isFirebaseEmailVerified()
      if (verified) {
        // Email confirmed via the Firebase link. Activate the backend account
        // with the dev OTP when available, otherwise route to sign-in.
        if (otp.trim().length === OTP_LENGTH) {
          await handleVerify()
        } else {
          setFirebaseNote('Your email is verified! Enter the code from our email below, or sign in once the account is active.')
          setIsError(false)
          setMessage('')
        }
      } else {
        setFirebaseNote('Your email is not verified yet. Click the link in the verification email we sent, then try again.')
        setIsError(true)
      }
    } catch {
      setFirebaseNote('Could not check verification. Sign up again or use the code instead.')
      setIsError(true)
    } finally {
      setFirebaseChecking(false)
    }
  }

  const handleFirebaseResend = async () => {
    setFirebaseNote('')
    setFirebaseResending(true)
    try {
      await resendFirebaseVerification()
      setFirebaseNote('Verification email sent. Check your inbox (and spam).')
      setIsError(false)
    } catch {
      setFirebaseNote('Could not resend the verification email.')
      setIsError(true)
    } finally {
      setFirebaseResending(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-2xl bg-orange-50 px-4 py-3 text-sm text-orange-800">
        <Mail className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Enter the 6-digit verification code for <span className="font-semibold">{email || 'your email'}</span> to
          verify your account.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="otp">Verification Code</Label>
        <Input
          id="otp"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={OTP_LENGTH}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleVerify()
          }}
          placeholder="000000"
          className="text-center text-2xl font-bold tracking-[0.5em]"
        />
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

      <Button
        type="button"
        onClick={handleVerify}
        disabled={verifying || otp.length !== OTP_LENGTH}
        className="w-full rounded-full"
      >
        {verifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Verify Email
      </Button>

      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-400">Didn't receive it?</span>
        <button
          type="button"
          onClick={handleResend}
          disabled={sending || cooldown > 0}
          className="font-semibold text-orange-600 hover:text-orange-700 disabled:text-slate-300"
        >
          {sending ? 'Sending…' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
        </button>
      </div>

      <div className="flex items-center gap-3 py-1">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs font-semibold tracking-wide text-slate-400">OR</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3">
        <p className="text-sm font-semibold text-green-800">Verify with an email link (Firebase)</p>
        <p className="mt-0.5 text-xs text-green-700">
          We also emailed you a verification link. Click it, then confirm below.
        </p>
        <div className="mt-3 flex flex-col gap-2">
          <Button
            type="button"
            onClick={handleFirebaseCheck}
            disabled={firebaseChecking}
            className="w-full rounded-full bg-green-600 hover:bg-green-700"
          >
            {firebaseChecking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            I clicked the link — continue
          </Button>
          <button
            type="button"
            onClick={handleFirebaseResend}
            disabled={firebaseResending}
            className="flex items-center justify-center gap-1.5 text-xs font-semibold text-green-700 hover:text-green-800 disabled:text-green-300"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {firebaseResending ? 'Sending…' : 'Resend verification link'}
          </button>
        </div>
        {firebaseNote ? (
          <p
            className={`mt-2 rounded-lg border px-3 py-2 text-sm ${
              isError ? 'border-red-200 bg-red-50 text-red-600' : 'border-green-200 bg-green-50 text-green-700'
            }`}
          >
            {firebaseNote}
          </p>
        ) : null}
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
