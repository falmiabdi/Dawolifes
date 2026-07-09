import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Calendar, Mail, MapPin, Phone, Shield, GraduationCap, Briefcase, FileCheck, CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react'
import { getServerSession } from '@/lib/auth-session'
import { connectToDatabase } from '@/lib/db'
import { UserModel } from '@/lib/models/user'
import { StatusBadge } from '@/components/ui/status-badge'
import { ProfilePhotoUploader } from '@/components/dashboard/profile-photo-uploader'

export default async function AgentProfilePage() {
  const session = await getServerSession()
  if (!session?.user?.id) {
    redirect('/login')
  }

  await connectToDatabase()
  const user = await UserModel.findById(session.user.id).lean()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <ProfilePhotoUploader
            currentPhoto={user.profilePhoto || ''}
            initials={user.fullName ? user.fullName.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">{user.fullName || user.username}</h1>
              <StatusBadge status={user.status || 'Pending'} />
            </div>
            <p className="text-sm text-slate-500">{user.email}</p>
          </div>
        </div>
        <div>
          {user.status === 'Pending' && (
            <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-2 text-xs font-medium text-amber-800 border border-amber-100">
              <Clock className="h-4 w-4" /> Under Review
            </div>
          )}
          {user.status === 'Approved' && (
            <div className="flex items-center gap-2 rounded-xl bg-green-50 px-4 py-2 text-xs font-medium text-green-800 border border-green-100">
              <CheckCircle2 className="h-4 w-4" /> Verified Agent
            </div>
          )}
          {user.status === 'Rejected' && (
            <div className="rounded-xl bg-red-50 px-4 py-2 text-xs font-medium text-red-800 border border-red-100 space-y-1">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4" /> Application Rejected
              </div>
              {user.rejectionReason && <p className="text-slate-600">Reason: {user.rejectionReason}</p>}
            </div>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal Details */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-orange-600">
            <Shield className="h-5 w-5" />
            <h2 className="font-bold text-slate-800">Personal & Identity</h2>
          </div>
          <div className="divide-y divide-slate-100 text-sm">
            <div className="py-3 flex justify-between">
              <span className="text-slate-500">Gender</span>
              <span className="font-semibold text-slate-800">{user.gender || 'Not Specified'}</span>
            </div>
            <div className="py-3 flex justify-between">
              <span className="text-slate-500">Date of Birth</span>
              <span className="font-semibold text-slate-800">{user.dateOfBirth || 'Not Specified'}</span>
            </div>
            <div className="py-3 flex justify-between">
              <span className="text-slate-500">Nationality</span>
              <span className="font-semibold text-slate-800">{user.nationality || 'Ethiopian'}</span>
            </div>
            <div className="py-3 flex justify-between">
              <span className="text-slate-500">Preferred Language</span>
              <span className="font-semibold text-slate-800">{user.preferredLanguage || 'Not Specified'}</span>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-orange-600">
            <Phone className="h-5 w-5" />
            <h2 className="font-bold text-slate-800">Contact Information</h2>
          </div>
          <div className="divide-y divide-slate-100 text-sm">
            <div className="py-3 flex justify-between">
              <span className="text-slate-500">Ethio Telecom Phone</span>
              <span className="font-semibold text-slate-800">{user.ethPhone || 'Not Specified'}</span>
            </div>
            <div className="py-3 flex justify-between">
              <span className="text-slate-500">Safaricom Phone</span>
              <span className="font-semibold text-slate-800">{user.safaricomPhone || 'Not Specified'}</span>
            </div>
            <div className="py-3 flex justify-between">
              <span className="text-slate-500">Region & City</span>
              <span className="font-semibold text-slate-800">
                {user.region ? `${user.region}, ${user.city || ''}` : 'Not Specified'}
              </span>
            </div>
            <div className="py-3 flex justify-between">
              <span className="text-slate-500">Woreda / Kebele</span>
              <span className="font-semibold text-slate-800">
                {user.woreda ? `Woreda ${user.woreda}, Kebele ${user.kebele || ''}` : 'Not Specified'}
              </span>
            </div>
          </div>
        </div>

        {/* Education & Professional */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-orange-600">
            <GraduationCap className="h-5 w-5" />
            <h2 className="font-bold text-slate-800">Education & Background</h2>
          </div>
          <div className="divide-y divide-slate-100 text-sm">
            <div className="py-3 flex justify-between">
              <span className="text-slate-500">Highest Education</span>
              <span className="font-semibold text-slate-800">{user.highestEducation || 'Not Specified'}</span>
            </div>
            <div className="py-3 flex justify-between">
              <span className="text-slate-500">Agent Experience</span>
              <span className="font-semibold text-slate-800">{user.agentExperience || 'Not Specified'}</span>
            </div>
            <div className="py-3 flex justify-between">
              <span className="text-slate-500">Company Name</span>
              <span className="font-semibold text-slate-800">{user.companyName || 'None'}</span>
            </div>
            <div className="py-3 flex justify-between">
              <span className="text-slate-500">TIN Number</span>
              <span className="font-semibold text-slate-800">{user.tinNumber || 'None'}</span>
            </div>
          </div>
        </div>

        {/* Identity & Legal Uploads */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-orange-600">
            <FileCheck className="h-5 w-5" />
            <h2 className="font-bold text-slate-800">Uploaded Documents</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Fayda ID Front', url: user.faydaFront },
              { label: 'Fayda ID Back', url: user.faydaBack },
              { label: 'Selfie with Fayda', url: user.selfieFayda },
              { label: 'Passport Photo', url: user.passportPhoto },
              { label: 'Education Certificate', url: user.educationCertificate },
              { label: 'Business License', url: user.businessLicenseFile },
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
                    View Document →
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
