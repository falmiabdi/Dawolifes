"use client"

import { getApiUrl } from '@/lib/get-api-url'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-guard'
import { useI18n } from '@/lib/i18n'


export function PropertyDeleteButton({ id }: { id: string }) {
  const router = useRouter()
  const { getToken } = useAuth()
  const { t } = useI18n()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm(t('confirm_delete_listing'))) return
    setLoading(true)
    try {
      const token = await getToken()
      const res = await fetch(`${getApiUrl()}/api/properties/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (res.ok) {
        router.refresh()
      } else {
        alert(t('delete_failed'))
      }
    } catch (err) {
      alert(t('delete_error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition"
      title={t('delete_listing')}
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
    </button>
  )
}

