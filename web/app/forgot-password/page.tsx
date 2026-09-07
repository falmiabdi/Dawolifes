"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, Mail } from 'lucide-react'

import { AuthShell } from '@/components/auth/auth-shell'
import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getApiUrlAsync } from '@/lib/get-api-url'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const value = email.trim()
    if (!value) {
      setError('Enter your email to continue.')
      return
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
      setError('Enter a valid email address.')
      return
    }
    setSending(true)
    try {
      const res = await fetch(`${await getApiUrlAsync()}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: value }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.message || 'Failed to send the reset code. Try again.')
        return
      }
      setSent(true)
      
      router.push(`/reset-password?email=${encodeURIComponent(value)}`)
    } catch {
      setError('Cannot reach the server. Check your connection.')
    } finally {
      setSending(false)
    }
  }

  return (
    <AuthShell
      title={t('forgot_password_title')}
      footer={
        <p className="text-center text-sm text-slate-500">
          <Link href="/login" className="font-semibold text-orange-600 hover:text-orange-700">
            {t('sign_in_link')}
          </Link>
        </p>
      }
    >
      {sent ? (
        <div className="mt-2 rounded-2xl border border-green-200 bg-green-50 p-4">
          <div className="flex items-start gap-3 text-sm text-green-800">
            <Mail className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              <span className="font-semibold">{t('reset_code_sent')}</span>
            </p>
          </div>
        </div>
      ) : null}

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="email">{t('email')}</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {error ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p> : null}

        <Button type="submit" className="w-full rounded-full" disabled={sending}>
          {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
          {t('send_reset_code')}
        </Button>
      </form>
    </AuthShell>
  )
}