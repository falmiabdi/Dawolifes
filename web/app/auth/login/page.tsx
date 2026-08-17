"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import Link from 'next/link'
import { AlertTriangle, Eye, EyeOff, Loader2, RotateCcw } from 'lucide-react'

import { AuthShell } from '@/components/auth/auth-shell'
import { useAuth } from '@/components/auth/auth-guard'
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button'
import { isFirebaseEmailVerified, resendFirebaseVerification, signInFirebaseUser } from '@/lib/firebase-auth'
import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface LoginFormValues {
  email: string
  password: string
}

function getRedirectParam(): string {
  if (typeof window === 'undefined') return '/'
  const params = new URLSearchParams(window.location.search)
  const redirect = params.get('redirect')
  return redirect && redirect.startsWith('/') ? redirect : '/'
}

export default function AuthLoginPage() {
  const router = useRouter()
  const { user, login, googleSignIn } = useAuth()
  const { t } = useI18n()
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [unverifiedWarning, setUnverifiedWarning] = useState('')
  const [resendingVerify, setResendingVerify] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    defaultValues: { email: '', password: '' },
  })

  useEffect(() => {
    if (!user) return
    const redirect = getRedirectParam()
    if (redirect && redirect !== '/auth/login' && redirect !== '/auth/signup') {
      router.replace(redirect)
      return
    }
    if (user.role === 'admin') router.replace('/admin')
    else if (user.role === 'agent') router.replace('/agent')
    else router.replace('/')
  }, [user, router])

  const onSubmit = async (values: LoginFormValues) => {
    setMessage('')
    setUnverifiedWarning('')
    try {
      await login(values.email, values.password)
      // Non-blocking: if a Firebase account exists for this email and it has
      // not been verified, surface a reminder without blocking the session.
      try {
        await signInFirebaseUser(values.email, values.password)
        const verified = await isFirebaseEmailVerified()
        if (!verified) {
          setUnverifiedWarning(
            'Your account email is not verified yet. Check your inbox for the verification link, or resend it below.'
          )
        }
      } catch {
        // No Firebase account for this email — ignore.
      }
    } catch (err: any) {
      const msg = err?.message || ''
      if (msg.includes('fetch') || msg.includes('network') || msg.includes('connection') || msg.includes('timeout')) {
        setMessage('Cannot connect to the server. Check your network connection.')
      } else if (msg.includes('403') || msg.includes('rejected') || msg.includes('suspended')) {
        setMessage('Your account has been rejected or suspended.')
      } else {
        setMessage(msg || 'Invalid email or password. Please try again.')
      }
    }
  }

  const handleResendVerification = async () => {
    setResendingVerify(true)
    try {
      await resendFirebaseVerification()
      setUnverifiedWarning('Verification email sent. Check your inbox (and spam).')
    } catch {
      setUnverifiedWarning('Could not resend the verification email. Try again later.')
    } finally {
      setResendingVerify(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setMessage('')
    setGoogleLoading(true)
    try {
      const result = await googleSignIn()
      if (result?.requiresEmailVerification) {
        setMessage('Please verify your email address to continue.')
      }
      // On success the `user` effect above routes to the right place.
    } catch (err: any) {
      setMessage(err?.message || 'Google sign in failed. Please try again.')
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <AuthShell
      title={t('welcome_back')}
      footer={
        <p className="text-center text-sm text-slate-500">
          {t('new_to_dawolife')}{' '}
          <Link href="/auth/signup" className="font-semibold text-orange-600 hover:text-orange-700">
            {t('create_account_link')}
          </Link>
        </p>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-2">
          <Label htmlFor="email">{t('email')}</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            {...register('email', { required: 'Email is required' })}
          />
          {errors.email ? <p className="text-sm text-red-600">{errors.email.message}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">{t('password')}</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder={t('enter_password')}
              {...register('password', { required: 'Password is required' })}
            />
            <button
              type="button"
              className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-500"
              onClick={() => setShowPassword((value) => !value)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password ? <p className="text-sm text-red-600">{errors.password.message}</p> : null}
        </div>

        {message ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{message}</p> : null}

        {unverifiedWarning ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
            <p className="flex items-start gap-2 text-sm text-amber-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {unverifiedWarning}
            </p>
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={resendingVerify}
              className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-800 disabled:text-amber-300"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {resendingVerify ? 'Sending…' : 'Resend verification link'}
            </button>
          </div>
        ) : null}

        <Button type="submit" className="w-full rounded-full" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {t('sign_in')}
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs font-medium text-slate-400">OR</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <GoogleSignInButton onPress={handleGoogleSignIn} loading={googleLoading} />
    </AuthShell>
  )
}
