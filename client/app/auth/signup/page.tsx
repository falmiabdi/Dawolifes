"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import Link from 'next/link'
import { Camera, Eye, EyeOff, Loader2, X } from 'lucide-react'

import { AuthShell } from '@/components/auth/auth-shell'
import { useAuth } from '@/components/auth/auth-guard'
import { getApiUrlAsync } from '@/lib/get-api-url'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface SignupFormValues {
  name: string
  email: string
  phone: string
  password: string
  confirmPassword: string
}

function getRedirectParam(): string {
  if (typeof window === 'undefined') return '/saved'
  const params = new URLSearchParams(window.location.search)
  const redirect = params.get('redirect')
  return redirect && redirect.startsWith('/') ? redirect : '/saved'
}

export default function AuthSignupPage() {
  const router = useRouter()
  const { user, registerBuyer } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [photo, setPhoto] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    defaultValues: { name: '', email: '', phone: '', password: '', confirmPassword: '' },
  })

  useEffect(() => {
    if (!user) return
    const redirect = getRedirectParam()
    if (redirect && redirect !== '/auth/login' && redirect !== '/auth/signup') {
      router.replace(redirect)
    } else {
      router.replace('/saved')
    }
  }, [user, router])

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
    } catch {
      setMessage('Photo upload failed. You can add one later.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const onSubmit = async (values: SignupFormValues) => {
    setMessage('')
    if (values.password !== values.confirmPassword) {
      setMessage('Passwords do not match.')
      return
    }
    try {
      await registerBuyer({
        name: values.name,
        email: values.email,
        phone: values.phone,
        password: values.password,
        profilePhoto: photo || undefined,
      })
    } catch (err: any) {
      const msg = err?.message || 'Registration failed.'
      if (msg.includes('already registered')) {
        setMessage('This email is already registered. Try signing in instead.')
      } else if (msg.includes('fetch') || msg.includes('network') || msg.includes('connection') || msg.includes('timeout')) {
        setMessage('Cannot connect to the server. Check your network connection.')
      } else {
        setMessage(msg)
      }
    }
  }

  return (
    <AuthShell
      title="Create your free account"
      subtitle="Save homes and cars, message sellers, and track everything you're interested in."
      footer={
        <p className="text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-semibold text-orange-600 hover:text-orange-700">
            Sign in
          </Link>
        </p>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-col items-center">
          <div className="relative">
            {photo ? (
              <div className="relative h-24 w-24 overflow-hidden rounded-full ring-4 ring-orange-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo} alt="Profile preview" className="h-full w-full object-cover" />
                <button
                  type="button"
                  aria-label="Remove photo"
                  onClick={() => setPhoto(null)}
                  className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-slate-500 shadow ring-1 ring-black/10"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-orange-100 text-orange-500 ring-4 ring-orange-100">
                <Camera className="h-9 w-9" />
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute inset-x-0 -bottom-2 mx-auto w-max rounded-full bg-orange-500 px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-orange-600 disabled:opacity-60"
            >
              {uploading ? 'Uploading…' : 'Add photo'}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input id="name" placeholder="e.g. Sara Tadesse" {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Name is too short' } })} />
          {errors.name ? <p className="text-sm text-red-600">{errors.name.message}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" {...register('email', { required: 'Email is required' })} />
          {errors.email ? <p className="text-sm text-red-600">{errors.email.message}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" type="tel" placeholder="+251 91 234 5678" {...register('phone', { required: 'Phone is required', minLength: { value: 6, message: 'Enter a valid phone number' } })} />
          {errors.phone ? <p className="text-sm text-red-600">{errors.phone.message}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a strong password"
              {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Min 8 characters' } })}
            />
            <button type="button" className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-500" onClick={() => setShowPassword((v) => !v)}>
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password ? <p className="text-sm text-red-600">{errors.password.message}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            placeholder="Re-enter your password"
            {...register('confirmPassword', { required: 'Please confirm your password' })}
          />
          {errors.confirmPassword ? <p className="text-sm text-red-600">{errors.confirmPassword.message}</p> : null}
        </div>

        {message ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{message}</p> : null}

        <Button type="submit" className="w-full rounded-full" disabled={isSubmitting || uploading}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Create Account
        </Button>
        <p className="text-center text-xs text-slate-400">
          By creating an account your registration is immediately verified.
        </p>
      </form>
    </AuthShell>
  )
}
