"use client"

import { getApiUrl } from '@/lib/get-api-url'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Calendar, Mail, MapPin, Phone, Shield, GraduationCap, Briefcase, FileCheck, CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-guard'
import { StatusBadge } from '@/components/ui/status-badge'
import { ProfilePhotoUploader } from '@/components/dashboard/profile-photo-uploader'


export default function AgentProfilePage() {
  const { user: authUser, getToken } = useAuth()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    if (!authUser) return
    const fetchProfile = async () => {
      try {
        const token = await getToken()
        const res = await fetch(`${getApiUrl()}/api/agent/profile`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        setUser(data.user)
      } catch {
        // Fall back to auth user data if profile endpoint fails
        setUser(authUser)
      }
    }
    fetchProfile()
  }, [authUser, getToken])

  const displayUser = user || authUser

  if (!displayUser) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <ProfilePhotoUploader
            currentPhoto={displayUser.profilePhoto || ''}
            initials={(() => {
              const name = displayUser.fullName || displayUser.username || displayUser.name || ''
              return name ? name.charAt(0).toUpperCase() : '?'
            })()}
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">{displayUser.fullName || displayUser.username}</h1>
              <StatusBadge status={displayUser.status || 'Pending'} />
            </div>
            <p className="text-sm text-slate-500">{displayUser.email}</p>
          </div>
        </div>
        <div>
          {displayUser.status === 'Pending' && (
            <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-2 text-xs font-medium text-amber-800 border border-amber-100">
              <Clock className="h-4 w-4" /> Under Review
            </div>
          )}
          {displayUser.status === 'Approved' && (
            <div className="flex items-center gap-2 rounded-xl bg-green-50 px-4 py-2 text-xs font-medium text-green-800 border border-green-100">
              <CheckCircle2 className="h-4 w-4" /> Verified Agent
            </div>
          )}
          {displayUser.status === 'Rejected' && (
            <div className="rounded-xl bg-red-50 px-4 py-2 text-xs font-medium text-red-800 border border-red-100 space-y-1">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4" /> Application Rejected
              </div>
              {displayUser.rejectionReason && <p className="text-slate-600">Reason: {displayUser.rejectionReason}</p>}
              <Link
                href="/agent/onboarding"
                className="flex items-center gap-1.5 text-xs font-semibold text-orange-600 hover:underline mt-2"
              >
                Edit Profile & Resubmit â†’
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-orange-600">
            <Shield className="h-5 w-5" />
            <h2 className="font-bold text-slate-800">Personal & Identity</h2>
          </div>
          <div className="divide-y divide-slate-100 text-sm">
            <div className="py-3 flex justify-between">
              <span className="text-slate-500">Gender</span>
              <span className="font-semibold text-slate-800">{displayUser.gender || 'Not Specified'}</span>
            </div>
            <div className="py-3 flex justify-between">
              <span className="text-slate-500">Date of Birth</span>
              <span className="font-semibold text-slate-800">{displayUser.dateOfBirth || 'Not Specified'}</span>
            </div>
            <div className="py-3 flex justify-between">
              <span className="text-slate-500">Nationality</span>
              <span className="font-semibold text-slate-800">{displayUser.nationality || 'Ethiopian'}</span>
            </div>
            <div className="py-3 flex justify-between">
              <span className="text-slate-500">Preferred Language</span>
              <span className="font-semibold text-slate-800">{displayUser.preferredLanguage || 'Not Specified'}</span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-orange-600">
            <Phone className="h-5 w-5" />
            <h2 className="font-bold text-slate-800">Contact Information</h2>
          </div>
          <div className="divide-y divide-slate-100 text-sm">
            <div className="py-3 flex justify-between">
              <span className="text-slate-500">Ethio Telecom Phone</span>
              <span className="font-semibold text-slate-800">{displayUser.ethPhone || 'Not Specified'}</span>
            </div>
            <div className="py-3 flex justify-between">
              <span className="text-slate-500">Safaricom Phone</span>
              <span className="font-semibold text-slate-800">{displayUser.safaricomPhone || 'Not Specified'}</span>
            </div>
            <div className="py-3 flex justify-between">
              <span className="text-slate-500">Region & City</span>
              <span className="font-semibold text-slate-800">
                {displayUser.region ? `${displayUser.region}, ${displayUser.city || ''}` : 'Not Specified'}
              </span>
            </div>
            <div className="py-3 flex justify-between">
              <span className="text-slate-500">Woreda / Kebele</span>
              <span className="font-semibold text-slate-800">
                {displayUser.woreda ? `Woreda ${displayUser.woreda}, Kebele ${displayUser.kebele || ''}` : 'Not Specified'}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-orange-600">
            <GraduationCap className="h-5 w-5" />
            <h2 className="font-bold text-slate-800">Education & Background</h2>
          </div>
          <div className="divide-y divide-slate-100 text-sm">
            <div className="py-3 flex justify-between">
              <span className="text-slate-500">Highest Education</span>
              <span className="font-semibold text-slate-800">{displayUser.highestEducation || 'Not Specified'}</span>
            </div>
            <div className="py-3 flex justify-between">
              <span className="text-slate-500">Agent Experience</span>
              <span className="font-semibold text-slate-800">{displayUser.agentExperience || 'Not Specified'}</span>
            </div>
            <div className="py-3 flex justify-between">
              <span className="text-slate-500">Company Name</span>
              <span className="font-semibold text-slate-800">{displayUser.companyName || 'None'}</span>
            </div>
            <div className="py-3 flex justify-between">
              <span className="text-slate-500">TIN Number</span>
              <span className="font-semibold text-slate-800">{displayUser.tinNumber || 'None'}</span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-orange-600">
            <FileCheck className="h-5 w-5" />
            <h2 className="font-bold text-slate-800">Uploaded Documents</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Fayda ID Front', url: displayUser.faydaFront },
              { label: 'Fayda ID Back', url: displayUser.faydaBack },
              { label: 'Selfie with Fayda', url: displayUser.selfieFayda },
              { label: 'Passport Photo', url: displayUser.passportPhoto },
              { label: 'Education Certificate', url: displayUser.educationCertificate },
              { label: 'Business License', url: displayUser.businessLicenseFile },
            ].map((doc) => (
              <div key={doc.label} className="rounded-xl border border-slate-100 bg-slate-50 p-3 flex flex-col justify-between">
                <span className="text-xs font-semibold text-slate-500 mb-2">{doc.label}</span>
                {doc.url ? (
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-orange-600 hover:underline"
                  >
                    View Document â†’
                  </a>
                ) : (
                  <span className="text-xs text-slate-400">Not Uploaded</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

