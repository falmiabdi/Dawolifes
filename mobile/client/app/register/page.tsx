"use client"

import Link from 'next/link'

import { AuthShell } from '@/components/auth/auth-shell'
import { RoleSignupForm } from '@/components/auth/role-signup-form'
import { useI18n } from '@/lib/i18n'

export default function RegisterPage() {
  const { t } = useI18n()

  return (
    <AuthShell
      title={t('create_your_account')}
      footer={
        <p className="text-center text-sm text-slate-500">
          {t('already_have_account')}{' '}
          <Link href="/login" className="font-semibold text-orange-600 hover:text-orange-700">
            {t('sign_in_link')}
          </Link>
        </p>
      }
    >
      <RoleSignupForm />
    </AuthShell>
  )
}
