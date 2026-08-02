"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'

import { AuthShell } from '@/components/auth/auth-shell'
import { RoleSignupForm } from '@/components/auth/role-signup-form'
import { useI18n } from '@/lib/i18n'

function getRedirectParam(): string {
  if (typeof window === 'undefined') return '/saved'
  const params = new URLSearchParams(window.location.search)
  const redirect = params.get('redirect')
  return redirect && redirect.startsWith('/') ? redirect : '/saved'
}

export default function AuthSignupPage() {
  const { t } = useI18n()
  const [redirect, setRedirect] = useState('/saved')

  useEffect(() => {
    setRedirect(getRedirectParam())
  }, [])

  return (
    <AuthShell
      title={t('create_free_account')}
      footer={
        <p className="text-center text-sm text-slate-500">
          {t('already_have_account')}{' '}
          <Link href="/auth/login" className="font-semibold text-orange-600 hover:text-orange-700">
            {t('sign_in_link')}
          </Link>
        </p>
      }
    >
      <RoleSignupForm redirectParam={redirect} />
    </AuthShell>
  )
}
