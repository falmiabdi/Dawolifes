"use client"

import { getApiUrl } from '@/lib/get-api-url'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/auth-guard'
import { useI18n } from '@/lib/i18n'

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
  const { t } = useI18n()
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
            <span className="text-xs">{t('click_to_upload')}</span>
          </div>
        )}
        <input ref={ref} type="file" accept="image/*,.pdf" className="hidden" onChange={handle} />
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  const router = useRouter()
  const { getToken, refreshUser } = useAuth()
  const { t, tv } = useI18n()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [agreed, setAgreed] = useState({ terms: false, privacy: false })
  const [showTerms, setShowTerms] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)

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
        await refreshUser()
        toast.success(t('application_submitted'))
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
          <p className="text-sm font-bold uppercase tracking-widest text-orange-500">{t('agent_registration')}</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">{t('complete_profile')}</h1>
          <p className="mt-2 text-slate-500">{t('step_of')} {step}/{STEPS.length} â€” {({ Personal: t('personal'), Contact: t('contact'), Identity: t('identity'), Education: t('education'), Professional: t('professional'), Submit: t('submit') } as Record<string, string>)[STEPS[step - 1].label]}</p>
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
              <h2 className="text-xl font-bold text-slate-800">{t('personal_info')}</h2>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label>{t('full_name')} <span className="text-red-500">*</span></Label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Abebe Girma" />
                </div>
                <div className="space-y-2">
                  <Label>{t('gender')}</Label>
                  <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400">
                    <option value="">{t('select_gender')}</option>
                    <option>{t('male')}</option>
                    <option>{t('female')}</option>
                    <option>{t('other')}</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>{t('date_of_birth')}</Label>
                  <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{t('nationality')}</Label>
                  <Input value={nationality} onChange={(e) => setNationality(e.target.value)} placeholder="Ethiopian" />
                </div>
                <div className="space-y-2">
                  <Label>{t('preferred_language')}</Label>
                  <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400">
                    <option value="">{t('select_language')}</option>
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
              <h2 className="text-xl font-bold text-slate-800">{t('contact_info')}</h2>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t('ethio_telecom_phone')} <span className="text-red-500">*</span></Label>
                  <Input value={ethPhone} onChange={(e) => setEthPhone(e.target.value)} placeholder="+251 9XX XXX XXX" />
                </div>
                <div className="space-y-2">
                  <Label>{t('safaricom_phone')} ({t('optional')})</Label>
                  <Input value={safaricomPhone} onChange={(e) => setSafaricomPhone(e.target.value)} placeholder="+251 7XX XXX XXX" />
                </div>
                <div className="space-y-2">
                  <Label>{t('region')}</Label>
                  <select value={region} onChange={(e) => setRegion(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400">
                    <option value="">{t('select_region')}</option>
                    {['Addis Ababa', 'Afar', 'Amhara', 'Benishangul-Gumuz', 'Central Ethiopia', 'Dire Dawa', 'Gambela', 'Harari', 'Oromia', 'Sidama', 'Somali', 'South Ethiopia', 'SNNPR', 'Tigray'].map(r => <option key={r} value={r}>{tv(r)}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>{t('city')}</Label>
                  <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
                </div>
                <div className="space-y-2">
                  <Label>{t('woreda_subcity')}</Label>
                  <Input value={woreda} onChange={(e) => setWoreda(e.target.value)} placeholder="Woreda or Sub City" />
                </div>
                <div className="space-y-2">
                  <Label>{t('kebele')}</Label>
                  <Input value={kebele} onChange={(e) => setKebele(e.target.value)} placeholder="Kebele number" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>{t('full_address')}</Label>
                  <Input value={fullAddress} onChange={(e) => setFullAddress(e.target.value)} placeholder="Full mailing address" />
                </div>
              </div>
            </div>
          )}

          {/* â”€â”€ STEP 3 â”€â”€ */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-slate-800">{t('identity_verification')}</h2>
              <p className="text-sm text-slate-500">{t('identity_upload_note')}</p>
              <div className="grid gap-5 sm:grid-cols-2">
                <FileUpload label={`${t('fayda_front')} *`} value={faydaFront} onChange={setFaydaFront} field="faydaFront" uploadFile={uploadFile} />
                <FileUpload label={`${t('fayda_back')} *`} value={faydaBack} onChange={setFaydaBack} field="faydaBack" uploadFile={uploadFile} />
                <FileUpload label={`${t('selfie_fayda')} *`} value={selfie} onChange={setSelfie} field="selfie" uploadFile={uploadFile} />
                <FileUpload label={`${t('passport_photo')} *`} value={passport} onChange={setPassport} field="passport" uploadFile={uploadFile} />
              </div>
            </div>
          )}

          {/* â”€â”€ STEP 4 â”€â”€ */}
          {step === 4 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-slate-800">{t('education')}</h2>
              <div className="space-y-2">
                <Label>{t('highest_education')} <span className="text-red-500">*</span></Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {['Grade 10', 'Grade 12', 'TVET Certificate', 'Diploma', "Bachelor's Degree", "Master's Degree", 'PhD'].map((lvl) => (
                    <label key={lvl} className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 transition ${education === lvl ? 'border-orange-500 bg-orange-50' : 'border-slate-200 hover:border-orange-300'}`}>
                      <input type="radio" name="edu" value={lvl} checked={education === lvl} onChange={(e) => setEducation(e.target.value)} className="accent-orange-500" />
                      <span className="text-sm font-medium text-slate-700">{tv(lvl)}</span>
                    </label>
                  ))}
                </div>
              </div>
              <FileUpload label={`${t('upload_certificate')} (${t('optional')})`} value={eduCert} onChange={setEduCert} field="eduCert" uploadFile={uploadFile} />
            </div>
          )}

          {/* â”€â”€ STEP 5 â”€â”€ */}
          {step === 5 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-slate-800">{t('professional_info')}</h2>
              <p className="text-sm text-slate-500">{t('professional_optional_note')}</p>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label>{t('agent_experience')}</Label>
                  <select value={experience} onChange={(e) => setExperience(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400">
                    <option value="">{t('select_experience')}</option>
                    {[{ v: 'Less than 1 year', k: 'exp_less_1' }, { v: '1â€“3 years', k: 'exp_1_3' }, { v: '3â€“5 years', k: 'exp_3_5' }, { v: '5â€“10 years', k: 'exp_5_10' }, { v: 'More than 10 years', k: 'exp_more_10' }].map((o) => (
                      <option key={o.v} value={o.v}>{t(o.k)}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>{t('company_name')} ({t('optional')})</Label>
                  <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Your company name" />
                </div>
                <div className="space-y-2">
                  <Label>{t('tin_number')} ({t('optional')})</Label>
                  <Input value={tin} onChange={(e) => setTin(e.target.value)} placeholder="Tax Identification Number" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>{t('office_address')} ({t('optional')})</Label>
                  <Input value={officeAddr} onChange={(e) => setOfficeAddr(e.target.value)} placeholder="Office location" />
                </div>
                <div className="space-y-2">
                  <Label>{t('business_license_number')} ({t('optional')})</Label>
                  <Input value={licenseNum} onChange={(e) => setLicenseNum(e.target.value)} placeholder="License number" />
                </div>
                <FileUpload label={`${t('business_license_upload')} (${t('optional')})`} value={licenseFile} onChange={setLicenseFile} field="license" uploadFile={uploadFile} />
              </div>
            </div>
          )}

          {/* â”€â”€ STEP 6 â”€â”€ */}
          {step === 6 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-800">{t('review_submit')}</h2>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600 space-y-1">
                <p className="font-semibold text-slate-800 mb-3">{t('application_summary')}</p>
                <p><span className="font-medium">{t('name_label')}</span> {fullName}</p>
                <p><span className="font-medium">{t('phone_label')}</span> {ethPhone}</p>
                <p><span className="font-medium">{t('region_label')}</span> {region}, {city}</p>
                <p><span className="font-medium">{t('education_label')}</span> {education}</p>
                <p><span className="font-medium">{t('experience_label')}</span> {experience || t('not_specified')}</p>
              </div>
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" className="mt-1 accent-orange-500" checked={agreed.terms} onChange={(e) => setAgreed((a) => ({ ...a, terms: e.target.checked }))} />
                  <span className="text-sm text-slate-600">{t('agree_terms')} <button type="button" onClick={(e) => { e.preventDefault(); setShowTerms(true) }} className="font-semibold text-orange-600 underline">{t('terms_conditions')}</button> {t('of_platform')}</span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" className="mt-1 accent-orange-500" checked={agreed.privacy} onChange={(e) => setAgreed((a) => ({ ...a, privacy: e.target.checked }))} />
                  <span className="text-sm text-slate-600">{t('agree_terms')} <button type="button" onClick={(e) => { e.preventDefault(); setShowPrivacy(true) }} className="font-semibold text-orange-600 underline">{t('privacy_policy')}</button> {t('agree_privacy')}</span>
                </label>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <p className="font-semibold">{t('after_submission')}</p>
                <p className="mt-1">{t('after_submission_note')} <strong>{t('pending_approval')}</strong> {t('after_submission_note2')}</p>
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
              <ChevronLeft className="mr-1 h-4 w-4" /> {t('back')}
            </Button>
            <Button type="button" onClick={next} disabled={saving} className="rounded-full bg-orange-500 px-6 text-white hover:bg-orange-600">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {step === 6 ? t('submit_application') : t('save_continue')}
              {step < 6 && <ChevronRight className="ml-1 h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Terms & Conditions Modal */}
      {showTerms && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-xl md:p-8">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">{t('terms_conditions')}</h3>
              <button
                type="button"
                onClick={() => setShowTerms(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
              {t('terms_conditions_full')}
            </div>
            <div className="mt-6 flex justify-end">
              <Button type="button" onClick={() => setShowTerms(false)} className="rounded-full bg-orange-500 text-white hover:bg-orange-600">
                {t('close')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {showPrivacy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-xl md:p-8">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">{t('privacy_policy')}</h3>
              <button
                type="button"
                onClick={() => setShowPrivacy(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
              {t('privacy_policy_full')}
            </div>
            <div className="mt-6 flex justify-end">
              <Button type="button" onClick={() => setShowPrivacy(false)} className="rounded-full bg-orange-500 text-white hover:bg-orange-600">
                {t('close')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

