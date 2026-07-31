"use client"

import { getApiUrl } from '@/lib/get-api-url'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-guard'

import toast from 'react-hot-toast'

export function UserDeleteButton({ id }: { id: string }) {
  const router = useRouter()
  const { getToken } = useAuth()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm('Are you sure you want to permanently delete this user account? This cannot be undone.')) return
    setLoading(true)
    try {
      const token = await getToken()
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch(`${getApiUrl()}/api/admin/users`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'delete', id }),
      })
      if (res.ok) {
        toast.success('User account deleted successfully')
        router.refresh()
      } else {
        toast.error('Failed to delete user account.')
      }
    } catch (err) {
      toast.error('An error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition"
      title="Delete User"
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
    </button>
  )
}

