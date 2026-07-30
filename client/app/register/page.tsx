"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import Link from 'next/link'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

import { AuthShell } from '@/components/auth/auth-shell'
import { useAuth } from '@/components/auth/auth-guard'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface RegisterFormValues {
  username: string
  email: string
  password: string
  confirmPassword: string
}

export default function RegisterPage() {
  const router = useRouter()
  const { user, login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    defaultValues: { username: '', email: '', password: '', confirmPassword: '' },
  })

  useEffect(() => {
    if (user) router.replace('/agent/onboarding')
  }, [user, router])

  const onSubmit = async (values: RegisterFormValues) => {
    setMessage('')
    if (values.password !== values.confirmPassword) {
      setMessage('Passwords do not match.')
      return
    }

    const response = await fetch(`${API_URL}/api/auth/register`, {
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
    } catch {
      setMessage('Account created! Please sign in to continue.')
      router.push('/login')
    }
  }

  return (
    <AuthShell
      title="Create your agent account"
      subtitle="Sign up with your email and password. You'll complete your full profile in the next step."
      backgroundUrl="https://res.cloudinary.com/y7q39zm5/image/upload/v1783685711/delaharme/backgrounds/sfyowxhy5uhx5q6m8rdg.jpg"
      footer={
        <p className="text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-orange-600 hover:text-orange-700">
            Sign in
          </Link>
        </p>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input id="username" placeholder="e.g. abel_koech" {...register('username', { required: 'Username is required' })} />
          {errors.username ? <p className="text-sm text-red-600">{errors.username.message}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" {...register('email', { required: 'Email is required' })} />
          {errors.email ? <p className="text-sm text-red-600">{errors.email.message}</p> : null}
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

        <Button type="submit" className="w-full rounded-full" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Create Account & Continue
        </Button>
      </form>
    </AuthShell>
  )
}
