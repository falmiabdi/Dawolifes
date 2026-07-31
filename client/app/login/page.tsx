"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import Link from 'next/link'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

import { AuthShell } from '@/components/auth/auth-shell'
import { useAuth } from '@/components/auth/auth-guard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface LoginFormValues {
  email: string
  password: string
}

export default function LoginPage() {
  const router = useRouter()
  const { user, login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: '',
      password: '',
    },
  })

  useEffect(() => {
    if (!user) return
    if (user.role === 'admin') router.replace('/admin')
    else router.replace('/agent')
  }, [user, router])

  const onSubmit = async (values: LoginFormValues) => {
    setMessage('')
    try {
      await login(values.email, values.password)
    } catch (err: any) {
      const msg = err?.message || ''
      if (msg.includes('fetch') || msg.includes('network') || msg.includes('connection') || msg.includes('timeout')) {
        setMessage('Cannot connect to the server. Check your network connection.')
      } else if (msg.includes('403') || msg.includes('rejected') || msg.includes('suspended')) {
        setMessage('Your account has been rejected or suspended.')
      } else {
        setMessage('Invalid email or password. Please try again.')
      }
    }
  }

  return (
    <AuthShell
      title="Welcome back to DawoLife"
      subtitle="Sign in to access your agent workspace or the administrator console."
      backgroundUrl="https://res.cloudinary.com/y7q39zm5/image/upload/v1783685710/delaharme/backgrounds/wevko9a3x8ulqwtnfcnx.jpg"
      footer={
        <p className="text-center text-sm text-slate-500">
          New to DawoLife?{' '}
          <Link href="/register" className="font-semibold text-orange-600 hover:text-orange-700">
            Create an agent account
          </Link>
        </p>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="name@company.com"
            {...register('email', { required: 'Email is required' })}
          />
          {errors.email ? <p className="text-sm text-red-600">{errors.email.message}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
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

        <Button type="submit" className="w-full rounded-full" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Sign in
        </Button>
      </form>

    </AuthShell>
  )
}
