"use client"

import { getApiUrl } from '@/lib/get-api-url'

import { useState } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/auth-guard'

import toast from 'react-hot-toast'

interface ProfilePhotoUploaderProps {
  currentPhoto: string
  initials: string
}

export function ProfilePhotoUploader({ currentPhoto, initials }: ProfilePhotoUploaderProps) {
  const [photoUrl, setPhotoUrl] = useState(currentPhoto)
  const [uploading, setUploading] = useState(false)
  const router = useRouter()
  const { getToken } = useAuth()

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed')
      return
    }

    try {
      setUploading(true)
      const token = await getToken()
      if (!token) {
        throw new Error('Your session has expired. Please sign in again.')
      }

      const formData = new FormData()
      formData.append('file', file)

      // 1. Upload to Cloudinary via server-side /api/agent/upload
      const uploadRes = await fetch(`${getApiUrl()}/api/agent/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      const uploadData = await uploadRes.json()
      if (!uploadRes.ok) {
        throw new Error(uploadData.message || 'Failed to upload image')
      }
      const newUrl = uploadData.url

      // 2. Save the returned URL to the authenticated user's profile.
      const saveRes = await fetch(`${getApiUrl()}/api/auth/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ profilePhoto: newUrl }),
      })

      if (!saveRes.ok) {
        throw new Error('Failed to save profile photo')
      }

      setPhotoUrl(newUrl)
      toast.success('Profile photo updated successfully')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Error uploading photo. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="relative group shrink-0">
      {photoUrl ? (
        <img
          src={photoUrl}
          alt="Profile Avatar"
          className="h-20 w-20 rounded-2xl object-cover border border-slate-200 shadow-sm"
        />
      ) : (
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-orange-100 text-2xl font-bold text-orange-600 border border-orange-200 shadow-sm">
          {initials}
        </div>
      )}
      
      <label className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg bg-orange-500 text-white shadow-md hover:bg-orange-600 transition duration-200">
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Camera className="h-4 w-4" />
        )}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={uploading}
        />
      </label>
    </div>
  )
}

