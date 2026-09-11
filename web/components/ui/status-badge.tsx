"use client"

import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'

const variants: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-700 border-amber-200',
  Approved: 'bg-green-100 text-green-700 border-green-200',
  Rejected: 'bg-red-100 text-red-700 border-red-200',
  Suspended: 'bg-slate-200 text-slate-600 border-slate-300',
  Sold: 'bg-blue-100 text-blue-700 border-blue-200',
  Rented: 'bg-purple-100 text-purple-700 border-purple-200',
}

export function StatusBadge({ status }: { status: string }) {
  const { tv } = useI18n()
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold', variants[status] || 'bg-slate-100 text-slate-600')}>
      {tv(status)}
    </span>
  )
}
