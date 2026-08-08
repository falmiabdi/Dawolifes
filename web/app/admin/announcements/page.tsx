"use client"

import { getApiUrl } from '@/lib/get-api-url'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/auth/auth-guard'
import {
  Megaphone, Plus, Pencil, Trash2, X, Check, Loader2, CalendarDays,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import toast from 'react-hot-toast'

interface Announcement {
  id: string
  title: string
  content: string
  authorId: string
  createdAt: string
  updatedAt: string
}

export default function AdminAnnouncementsPage() {
  const { getToken } = useAuth()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const token = await getToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [getToken])

  const fetchAnnouncements = useCallback(async () => {
    try {
      const authHeaders = await getAuthHeaders()
      const res = await fetch(`${getApiUrl()}/api/announcements`, { headers: { ...authHeaders } })
      const data = await res.json()
      setAnnouncements(data.announcements || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [getAuthHeaders])

  useEffect(() => {
    fetchAnnouncements()
  }, [fetchAnnouncements])

  const resetForm = () => {
    setCreating(false)
    setEditingId(null)
    setTitle('')
    setContent('')
  }

  const startEdit = (item: Announcement) => {
    setCreating(true)
    setEditingId(item.id)
    setTitle(item.title)
    setContent(item.content)
  }

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Title and content are required.')
      return
    }
    setSubmitting(true)
    try {
      const authHeaders = await getAuthHeaders()
      const isEdit = editingId != null
      const res = await fetch(
        isEdit ? `${getApiUrl()}/api/announcements/${editingId}` : `${getApiUrl()}/api/announcements`,
        {
          method: isEdit ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify({ title: title.trim(), content: content.trim() }),
        }
      )
      if (res.ok) {
        toast.success(isEdit ? 'Announcement updated' : 'Announcement published')
        resetForm()
        fetchAnnouncements()
      } else {
        const errData = await res.json()
        toast.error(errData.message || 'Failed to save announcement.')
      }
    } catch (err) {
      toast.error('An error occurred.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this announcement? This cannot be undone.')) return
    try {
      const authHeaders = await getAuthHeaders()
      const res = await fetch(`${getApiUrl()}/api/announcements/${id}`, {
        method: 'DELETE',
        headers: { ...authHeaders },
      })
      if (res.ok) {
        toast.success('Announcement deleted')
        fetchAnnouncements()
      } else {
        const errData = await res.json()
        toast.error(errData.message || 'Failed to delete announcement.')
      }
    } catch (err) {
      toast.error('An error occurred.')
    }
  }

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
      })
    } catch {
      return iso
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
          Announcements
        </h1>
        <p className="text-sm text-slate-500">
          Create, edit and delete announcements published on the public News page.
        </p>
      </div>

      {/* Create / edit form */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        {creating ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-900">
                {editingId ? 'Edit Announcement' : 'New Announcement'}
              </h2>
              <button
                onClick={resetForm}
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 transition"
                aria-label="Cancel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2">
              <Label className="font-semibold text-slate-700 text-xs">Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. New property listings feature is live"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-semibold text-slate-700 text-xs">Content</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write the announcement body…"
                rows={5}
                className="rounded-xl"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={submitting}
                className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl"
              >
                {submitting
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <><Check className="h-4 w-4 mr-1" /> {editingId ? 'Save Changes' : 'Publish'}</>}
              </Button>
              <Button variant="outline" onClick={resetForm} className="rounded-xl">
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setCreating(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 py-4 text-sm font-semibold text-slate-500 transition hover:border-orange-300 hover:text-orange-600"
          >
            <Plus className="h-4 w-4" /> Create New Announcement
          </button>
        )}
      </div>

      {/* List */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-900">Published Announcements</h2>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
            {announcements.length} total
          </span>
        </div>

        {loading ? (
          <div className="flex h-48 flex-col items-center justify-center text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500 mb-2" />
            <span>Fetching announcements…</span>
          </div>
        ) : announcements.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center text-slate-400">
            <Megaphone className="h-10 w-10 opacity-30 mb-2" />
            <span>No announcements yet. Create your first one above.</span>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {announcements.map((item) => (
              <div key={item.id} className="py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-slate-900 truncate">{item.title}</h3>
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400 shrink-0">
                        <CalendarDays className="h-3 w-3" /> {formatDate(item.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 whitespace-pre-line line-clamp-2">{item.content}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => startEdit(item)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-100 transition"
                      title="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
