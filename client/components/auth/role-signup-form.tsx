"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { Camera, Eye, EyeOff, Loader2, ShoppingBag, Store, User as UserIcon, X, CheckCircle2 } from 'lucide-react'

import { useAuth } from '@/components/auth/auth-guard'
import { getApiUrlAsync } from '@/lib/get-api-url'
import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Role = 'buyer' | 'agent' | null

interface SignupFormValues {
  name: string
  username: string
  email: string
  phone: string
  password: string
  confirmPassword: string
}

export function RoleSignupForm({ redirectParam }: { redirectParam?: string }) {
  const router = useRouter()
  const { user, login, registerBuyer } = useAuth()
  const { t } = useI18n()
  const [role, setRole] = useState<Role>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [photo, setPhoto] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [registered, setRegistered] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const {
    register: reg,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    defaultValues: { name: '', username: '', email: '', phone: '', password: '', confirmPassword: '' },
  })

  const finalRedirect = redirectParam || '/saved'

  useEffect(() => {
    if (!user || !registered) return
    if (user.role === 'agent') {
      router.replace('/agent')
    } else {
      router.replace(finalRedirect)
    }
  }, [user, registered, router, finalRedirect])

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setMessage('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`${await getApiUrlAsync()}/api/upload`, { method: 'POST', body: formData })
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
    if (!role) {
      setMessage('Please choose an account type.')
      return
    }

    try {
      if (role === 'buyer') {
        await registerBuyer({
          name: values.name,
          email: values.email,
          phone: values.phone,
          password: values.password,
          profilePhoto: photo || undefined,
        })
        setRegistered(true)
      } else {
        const response = await fetch(`${await getApiUrlAsync()}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: values.username, email: values.email, password: values.password }),
        })
        const payload = await response.json()
        if (!response.ok) {
          setMessage(payload.message || 'Registration failed.')
          return
        }
        try {
          await login(values.email, values.password)
          setRegistered(true)
        } catch {
          setMessage('Account created! Please sign in to continue.')
          router.push('/login')
        }
      }
    } catch (err: any) {
      const msg = err?.message || ''
      if (msg.includes('already registered')) {
        setMessage('This email is already registered. Try signing in instead.')
      } else if (msg.includes('fetch') || msg.includes('network') || msg.includes('connection') || msg.includes('timeout')) {
        setMessage('Cannot connect to the server. Check your network connection.')
      } else {
        setMessage(msg || 'Registration failed.')
      }
    }
  }

  const roleCards: { value: 'buyer' | 'agent'; icon: any; title: string; desc: string }[] = [
    {
      value: 'buyer',
      icon: ShoppingBag,
      title: t('buyer_user'),
      desc: t('buyer_user_desc'),
    },
    {
      value: 'agent',
      icon: Store,
      title: t('seller_agent'),
      desc: t('seller_agent_desc'),
    },
  ]

  if (!role) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-500">{t('choose_account_type')}</p>
        <div className="grid grid-cols-2 gap-3">
          {roleCards.map((card) => {
            const Icon = card.icon
            return (
              <button
                key={card.value}
                type="button"
                onClick={() => setRole(card.value)}
                className="flex flex-col items-center gap-2 rounded-2xl border-2 border-slate-200 bg-white p-4 text-center transition hover:border-orange-500 hover:bg-orange-50 active:scale-[0.98]"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                  <Icon className="h-6 w-6" />
                </span>
                <span className="text-sm font-bold text-slate-800">{card.title}</span>
                <span className="text-xs text-slate-500">{card.desc}</span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  const isBuyer = role === 'buyer'

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
      <button
        type="button"
        onClick={() => setRole(null)}
        className="flex items-center gap-1.5 text-xs font-semibold text-orange-600 hover:text-orange-700"
      >
        ← {t('choose_account_type')}
      </button>

      <div className="flex items-center gap-2 rounded-xl bg-orange-50 px-3 py-2.5 text-xs font-medium text-orange-700">
        {isBuyer ? (
          <>
            <UserIcon className="h-4 w-4" /> {t('buyer_user')} — {t('buyer_user_desc')}
          </>
        ) : (
          <>
            <Store className="h-4 w-4" /> {t('seller_agent')} — {t('seller_agent_desc')}
          </>
        )}
        <CheckCircle2 className="ml-auto h-4 w-4 text-green-600" />
      </div>

      {isBuyer && (
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
      )}

      {isBuyer ? (
        <div className="space-y-2">
          <Label htmlFor="name">{t('full_name')}</Label>
          <Input id="name" placeholder="e.g. Sara Tadesse" {...reg('name', { required: 'Name is required', minLength: { value: 2, message: 'Name is too short' } })} />
          {errors.name ? <p className="text-sm text-red-600">{errors.name.message}</p> : null}
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="username">{t('username')}</Label>
          <Input id="username" placeholder="e.g. abel_koech" {...reg('username', { required: 'Username is required' })} />
          {errors.username ? <p className="text-sm text-red-600">{errors.username.message}</p> : null}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">{t('email')}</Label>
        <Input id="email" type="email" placeholder="you@example.com" {...reg('email', { required: 'Email is required' })} />
        {errors.email ? <p className="text-sm text-red-600">{errors.email.message}</p> : null}
      </div>

      {isBuyer && (
        <div className="space-y-2">
          <Label htmlFor="phone">{t('phone')}</Label>
          <Input id="phone" type="tel" placeholder="+251 91 234 5678" {...reg('phone', { required: 'Phone is required', minLength: { value: 6, message: 'Enter a valid phone number' } })} />
          {errors.phone ? <p className="text-sm text-red-600">{errors.phone.message}</p> : null}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="password">{t('password')}</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Create a strong password"
            {...reg('password', { required: 'Password is required', minLength: { value: 8, message: 'Min 8 characters' } })}
          />
          <button type="button" className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-500" onClick={() => setShowPassword((v) => !v)}>
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password ? <p className="text-sm text-red-600">{errors.password.message}</p> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">{t('confirm_password')}</Label>
        <Input
          id="confirmPassword"
          type={showPassword ? 'text' : 'password'}
          placeholder="Re-enter your password"
          {...reg('confirmPassword', { required: 'Please confirm your password' })}
        />
        {errors.confirmPassword ? <p className="text-sm text-red-600">{errors.confirmPassword.message}</p> : null}
      </div>

      {message ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{message}</p> : null}

      <Button type="submit" className="w-full rounded-full" disabled={isSubmitting || uploading}>
        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {t('create_account')}
      </Button>
      <p className="text-center text-xs text-slate-400">
        {isBuyer ? 'Your registration is immediately verified.' : 'Your application will be reviewed by our team.'}
      </p>
    </form>
  )
}
