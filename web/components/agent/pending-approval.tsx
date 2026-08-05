"use client"

import { useState } from 'react'
import { Hourglass, Loader2, LogOut, XCircle, RefreshCw } from 'lucide-react'

import { useAuth } from '@/components/auth/auth-guard'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { useI18n } from '@/lib/i18n'

export function PendingApprovalScreen() {
  const { user, logout, refreshUser } = useAuth()
  const { t } = useI18n()
  const [refreshing, setRefreshing] = useState(false)

  const status = user?.status || 'Pending'
  const isRejected = status === 'Rejected'
  const isSuspended = status === 'Suspended'

  const icon = isRejected ? XCircle : Hourglass
  const Icon = icon
  const title = isRejected ? t('account_rejected') : isSuspended ? t('account_suspended') : t('application_under_review')
  const message = isRejected
    ? user?.rejectionReason || t('account_rejected_msg')
    : isSuspended
      ? t('account_suspended_msg')
      : t('under_review_msg')

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await refreshUser()
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-orange-50 px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-lg">
        <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${isRejected ? 'bg-red-50' : 'bg-amber-50'}`}>
          <Icon className={`h-8 w-8 ${isRejected ? 'text-red-500' : 'text-amber-500'}`} />
        </div>

        <h1 className="mt-5 text-2xl font-bold text-slate-900">{title}</h1>

        <div className="mt-3 flex justify-center">
          <StatusBadge status={status} />
        </div>

        <p className="mt-4 text-sm leading-relaxed text-slate-500">{message}</p>

        {isRejected && (
          <p className="mt-3 text-sm font-semibold text-orange-600">
            {t('update_to_resubmit')}
          </p>
        )}

        <div className="mt-8 space-y-3">
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing} className="w-full rounded-full">
            {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            {t('check_approval_status')}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              logout()
              window.location.href = '/'
            }}
            className="w-full rounded-full text-red-600"
          >
            <LogOut className="mr-2 h-4 w-4" />
            {t('sign_out')}
          </Button>
        </div>
      </div>
    </div>
  )
}
