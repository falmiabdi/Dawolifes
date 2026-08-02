"use client"

import { getApiUrl } from '@/lib/get-api-url'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/auth-guard'

import { CheckCircle2, ChevronRight, ChevronLeft, Upload, X, Loader2, User, Phone, Shield, GraduationCap, Briefcase, FileCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import toast from 'react-hot-toast'

const STEPS = [
  { id: 1, label: 'Personal', icon: User },
  { id: 2, label: 'Contact', icon: Phone },
  { id: 3, label: 'Identity', icon: Shield },
  { id: 4, label: 'Education', icon: GraduationCap },
  { id: 5, label: 'Professional', icon: Briefcase },
  { id: 6, label: 'Submit', icon: FileCheck },
]

interface FileState { url: string; preview: string }

function FileUpload({ label, value, onChange, field, uploadFile }: {
  label: string
  value: FileState | null
  onChange: (v: FileState | null) => void
  field: string
  uploadFile: (file: File, field: string) => Promise<string>
}) {
  const ref = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const previewRef = useRef<string | null>(null)

  useEffect(() => {
    return () => {
      if (previewRef.current) {
        URL.revokeObjectURL(previewRef.current)
      }
    }
  }, [])

  async function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('File size must be less than 10MB')
      return
    }

    const blobUrl = URL.createObjectURL(file)
    previewRef.current = blobUrl
    onChange({ url: '', preview: blobUrl })
    setUploading(true)

    try {
      const url = await uploadFile(file, field)
      URL.revokeObjectURL(blobUrl)
      previewRef.current = null
      onChange({ url, preview: url })
    } catch (err: any) {
      URL.revokeObjectURL(blobUrl)
      previewRef.current = null
      onChange(null)
      toast.error(err.message || 'Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  function clear() {
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current)
      previewRef.current = null
    }
    onChange(null)
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div
        onClick={() => ref.current?.click()}
        className="relative flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 transition hover:border-orange-400 hover:bg-orange-50"
      >
        {uploading && !value ? (
          <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
        ) : value ? (
          <>
            <img src={value.preview} alt={label} className="max-h-[100px] rounded-xl object-cover" />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); clear() }}
              className="absolute top-2 right-2 rounded-full bg-red-500 p-1 text-white"
            >
              <X className="h-3 w-3" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <Upload className="h-6 w-6" />
            <span className="text-xs">Click to upload</span>
          </div>
        )}
        <input ref={ref} type="file" accept="image/*,.pdf" className="hidden" onChange={handle} />
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  const router = useRouter()
  const { getToken } = useAuth()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [agreed, setAgreed] = useState({ terms: false, privacy: false })

  // Step 1
  const [fullName, setFullName] = useState('')
  const [gender, setGender] = useState('')
  const [dob, setDob] = useState('')
  const [nationality, setNationality] = useState('Ethiopian')
  const [language, setLanguage] = useState('')

  // Step 2
  const [ethPhone, setEthPhone] = useState('')
  const [safaricomPhone, setSafaricomPhone] = useState('')
  const [region, setRegion] = useState('')
  const [city, setCity] = useState('')
  const [woreda, setWoreda] = useState('')
  const [kebele, setKebele] = useState('')
  const [fullAddress, setFullAddress] = useState('')

  // Step 3 - files
  const [faydaFront, setFaydaFront] = useState<FileState | null>(null)
  const [faydaBack, setFaydaBack] = useState<FileState | null>(null)
  const [selfie, setSelfie] = useState<FileState | null>(null)
  const [passport, setPassport] = useState<FileState | null>(null)

  // Step 4
  const [education, setEducation] = useState('')
  const [eduCert, setEduCert] = useState<FileState | null>(null)

  // Step 5 - all optional
  const [experience, setExperience] = useState('')
  const [company, setCompany] = useState('')
  const [officeAddr, setOfficeAddr] = useState('')
  const [licenseNum, setLicenseNum] = useState('')
  const [licenseFile, setLicenseFile] = useState<FileState | null>(null)
  const [tin, setTin] = useState('')

  const [error, setError] = useState('')



  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const token = await getToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [getToken])

  const uploadFile = useCallback(async (file: File, field: string): Promise<string> => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('field', field)
    const headers = await getAuthHeaders()
    const res = await fetch(`${getApiUrl()}/api/agent/upload`, { method: 'POST', headers, body: fd })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || 'Upload failed')
    }
    const data = await res.json()
    return data.url || ''
  }, [getAuthHeaders])

  async function saveStep(data: Record<string, unknown>) {
    const headers = { 'Content-Type': 'application/json', ...await getAuthHeaders() }
    const res = await fetch(`${getApiUrl()}/api/agent/onboarding`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || 'Failed to save step')
    }
  }

  async function next() {
    setError('')
    setSaving(true)
    try {
      if (step === 1) {
        if (!fullName.trim()) { setError('Full name is required.'); setSaving(false); return }
        await saveStep({ fullName, gender, dateOfBirth: dob, nationality, preferredLanguage: language })
      } else if (step === 2) {
        if (!ethPhone.trim()) { setError('Ethiopian Telecom phone is required.'); setSaving(false); return }
        await saveStep({ ethPhone, safaricomPhone, region, city, woreda, kebele, fullAddress })
      } else if (step === 3) {
        if (!faydaFront || !faydaBack || !selfie || !passport) {
          setError('All 4 identity documents are required.')
          setSaving(false)
          return
        }
        await saveStep({ faydaFront: faydaFront.url, faydaBack: faydaBack.url, selfieFayda: selfie.url, passportPhoto: passport?.url || '' })
      } else if (step === 4) {
        if (!education) { setError('Please select your highest education level.'); setSaving(false); return }
        await saveStep({ highestEducation: education, educationCertificate: eduCert?.url || '' })
      } else if (step === 5) {
        await saveStep({ agentExperience: experience, companyName: company, officeAddress: officeAddr, businessLicenseNumber: licenseNum, businessLicenseFile: licenseFile?.url || '', tinNumber: tin })
      } else if (step === 6) {
        if (!agreed.terms || !agreed.privacy) { setError('You must accept both the Terms & Conditions and Privacy Policy.'); setSaving(false); return }
        await saveStep({ onboardingComplete: true })
        toast.success('Application submitted successfully!')
        router.push('/agent')
        return
      }
      setStep((s) => s + 1)
    } catch (err: any) {
      toast.error(err.message || 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-orange-500">Agent Registration</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Complete Your Profile</h1>
          <p className="mt-2 text-slate-500">Step {step} of {STEPS.length} â€” {STEPS[step - 1].label}</p>
        </div>

        {/* Step progress */}
        <div className="mb-10 flex items-center justify-between">
          {STEPS.map((s, i) => {
            const Icon = s.icon
            const done = step > s.id
            const active = step === s.id
            return (
              <div key={s.id} className="flex flex-1 items-center">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 ${done ? 'border-orange-500 bg-orange-500 text-white' : active ? 'border-orange-500 bg-white text-orange-500' : 'border-slate-200 bg-white text-slate-400'}`}>
                  {done ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-4 w-4" />}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 transition-all duration-500 ${done ? 'bg-orange-500' : 'bg-slate-200'}`} />
                )}
              </div>
            )
          })}
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
          )}

          {/* â”€â”€ STEP 1 â”€â”€ */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-slate-800">Personal Information</h2>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Full Name <span className="text-red-500">*</span></Label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Abebe Girma" />
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400">
                    <option value="">Select gender</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Nationality</Label>
                  <Input value={nationality} onChange={(e) => setNationality(e.target.value)} placeholder="Ethiopian" />
                </div>
                <div className="space-y-2">
                  <Label>Preferred Language</Label>
                  <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400">
                    <option value="">Select language</option>
                    <option>English</option>
                    <option>Afaan Oromo</option>
                    <option>Amharic</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* â”€â”€ STEP 2 â”€â”€ */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-slate-800">Contact Information</h2>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Ethiopian Telecom Phone <span className="text-red-500">*</span></Label>
                  <Input value={ethPhone} onChange={(e) => setEthPhone(e.target.value)} placeholder="+251 9XX XXX XXX" />
                </div>
                <div className="space-y-2">
                  <Label>Safaricom Ethiopia Phone (Optional)</Label>
                  <Input value={safaricomPhone} onChange={(e) => setSafaricomPhone(e.target.value)} placeholder="+251 7XX XXX XXX" />
                </div>
                <div className="space-y-2">
                  <Label>Region</Label>
                  <select value={region} onChange={(e) => setRegion(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400">
                    <option value="">Select region</option>
                    {['Addis Ababa', 'Afar', 'Amhara', 'Benishangul-Gumuz', 'Central Ethiopia', 'Dire Dawa', 'Gambela', 'Harari', 'Oromia', 'Sidama', 'Somali', 'South Ethiopia', 'SNNPR', 'Tigray'].map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
                </div>
                <div className="space-y-2">
                  <Label>Woreda / Sub City</Label>
                  <Input value={woreda} onChange={(e) => setWoreda(e.target.value)} placeholder="Woreda or Sub City" />
                </div>
                <div className="space-y-2">
                  <Label>Kebele</Label>
                  <Input value={kebele} onChange={(e) => setKebele(e.target.value)} placeholder="Kebele number" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Full Address</Label>
                  <Input value={fullAddress} onChange={(e) => setFullAddress(e.target.value)} placeholder="Full mailing address" />
                </div>
              </div>
            </div>
          )}

          {/* â”€â”€ STEP 3 â”€â”€ */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-slate-800">Identity Verification</h2>
              <p className="text-sm text-slate-500">Upload clear photos of your identification documents. All fields are required.</p>
              <div className="grid gap-5 sm:grid-cols-2">
                <FileUpload label="Fayda ID Front *" value={faydaFront} onChange={setFaydaFront} field="faydaFront" uploadFile={uploadFile} />
                <FileUpload label="Fayda ID Back *" value={faydaBack} onChange={setFaydaBack} field="faydaBack" uploadFile={uploadFile} />
                <FileUpload label="Selfie Holding Fayda ID *" value={selfie} onChange={setSelfie} field="selfie" uploadFile={uploadFile} />
                <FileUpload label="Passport Size Photo *" value={passport} onChange={setPassport} field="passport" uploadFile={uploadFile} />
              </div>
            </div>
          )}

          {/* â”€â”€ STEP 4 â”€â”€ */}
          {step === 4 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-slate-800">Education</h2>
              <div className="space-y-2">
                <Label>Highest Education Level <span className="text-red-500">*</span></Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {['Grade 10', 'Grade 12', 'TVET Certificate', 'Diploma', "Bachelor's Degree", "Master's Degree", 'PhD'].map((lvl) => (
                    <label key={lvl} className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 transition ${education === lvl ? 'border-orange-500 bg-orange-50' : 'border-slate-200 hover:border-orange-300'}`}>
                      <input type="radio" name="edu" value={lvl} checked={education === lvl} onChange={(e) => setEducation(e.target.value)} className="accent-orange-500" />
                      <span className="text-sm font-medium text-slate-700">{lvl}</span>
                    </label>
                  ))}
                </div>
              </div>
              <FileUpload label="Upload Certificate (Optional)" value={eduCert} onChange={setEduCert} field="eduCert" uploadFile={uploadFile} />
            </div>
          )}

          {/* â”€â”€ STEP 5 â”€â”€ */}
          {step === 5 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-slate-800">Professional Information</h2>
              <p className="text-sm text-slate-500">All fields in this step are optional.</p>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Agent Experience</Label>
                  <select value={experience} onChange={(e) => setExperience(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400">
                    <option value="">Select experience</option>
                    <option>Less than 1 year</option>
                    <option>1â€“3 years</option>
                    <option>3â€“5 years</option>
                    <option>5â€“10 years</option>
                    <option>More than 10 years</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Company Name (Optional)</Label>
                  <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Your company name" />
                </div>
                <div className="space-y-2">
                  <Label>TIN Number (Optional)</Label>
                  <Input value={tin} onChange={(e) => setTin(e.target.value)} placeholder="Tax Identification Number" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Office Address (Optional)</Label>
                  <Input value={officeAddr} onChange={(e) => setOfficeAddr(e.target.value)} placeholder="Office location" />
                </div>
                <div className="space-y-2">
                  <Label>Business License Number (Optional)</Label>
                  <Input value={licenseNum} onChange={(e) => setLicenseNum(e.target.value)} placeholder="License number" />
                </div>
                <FileUpload label="Business License Upload (Optional)" value={licenseFile} onChange={setLicenseFile} field="license" uploadFile={uploadFile} />
              </div>
            </div>
          )}

          {/* â”€â”€ STEP 6 â”€â”€ */}
          {step === 6 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-800">Review & Submit</h2>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600 space-y-1">
                <p className="font-semibold text-slate-800 mb-3">Application Summary</p>
                <p><span className="font-medium">Name:</span> {fullName}</p>
                <p><span className="font-medium">Phone:</span> {ethPhone}</p>
                <p><span className="font-medium">Region:</span> {region}, {city}</p>
                <p><span className="font-medium">Education:</span> {education}</p>
                <p><span className="font-medium">Experience:</span> {experience || 'Not specified'}</p>
              </div>
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" className="mt-1 accent-orange-500" checked={agreed.terms} onChange={(e) => setAgreed((a) => ({ ...a, terms: e.target.checked }))} />
                  <span className="text-sm text-slate-600">I agree to the <span className="font-semibold text-orange-600 underline cursor-pointer">Terms & Conditions</span> of the DawoLife platform.</span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" className="mt-1 accent-orange-500" checked={agreed.privacy} onChange={(e) => setAgreed((a) => ({ ...a, privacy: e.target.checked }))} />
                  <span className="text-sm text-slate-600">I agree to the <span className="font-semibold text-orange-600 underline cursor-pointer">Privacy Policy</span> and consent to data processing.</span>
                </label>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <p className="font-semibold">After Submission</p>
                <p className="mt-1">Your account will be in <strong>Pending Approval</strong> status. You cannot publish properties until an administrator approves your account. If rejected, a reason will be provided and you may resubmit.</p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1 || saving}
              className="rounded-full"
            >
              <ChevronLeft className="mr-1 h-4 w-4" /> Back
            </Button>
            <Button type="button" onClick={next} disabled={saving} className="rounded-full bg-orange-500 px-6 text-white hover:bg-orange-600">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {step === 6 ? 'Submit Application' : 'Save & Continue'}
              {step < 6 && <ChevronRight className="ml-1 h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

