"use client"

import { getApiUrl } from '@/lib/get-api-url'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/auth-guard'

import {
  ArrowLeft, ArrowRight, Building2, Check, CheckCircle2,
  Home as HomeIcon, MapPin, Plus, Send, Upload, X, Loader2, Info, FileText
} from 'lucide-react'
import { amenityOptions, formatPrice } from '@/lib/data'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { MapPicker } from '@/components/maps/map-picker'

const steps = [
  { id: 1, label: 'Basic Info', icon: HomeIcon },
  { id: 2, label: 'Location Details', icon: MapPin },
  { id: 3, label: 'Media Upload', icon: Upload },
  { id: 4, label: 'Location Map', icon: MapPin },
  { id: 5, label: 'Review & Submit', icon: CheckCircle2 },
]

export default function AgentPostPage() {
  const router = useRouter()
  const { getToken, user } = useAuth()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Form Fields
  const [title, setTitle] = useState('')
  const [posterType, setPosterType] = useState('Agent')
  const [ownerType, setOwnerType] = useState('Farmer Owner')
  const [propertyType, setPropertyType] = useState('House')
  const [listingType, setListingType] = useState('For Rent')
  const [price, setPrice] = useState('')
  const [priceType, setPriceType] = useState('Fixed Price')
  const [area, setArea] = useState('')
  const [bedrooms, setBedrooms] = useState('')
  const [bathrooms, setBathrooms] = useState('')
  const [condition, setCondition] = useState('Finished')
  const [legalizedYear, setLegalizedYear] = useState(String(new Date().getFullYear()))
  const [description, setDescription] = useState('')
  const [features, setFeatures] = useState<string[]>([])
  
  // Location
  const [region, setRegion] = useState('')
  const [city, setCity] = useState('')
  const [subCity, setSubCity] = useState('')
  const [woreda, setWoreda] = useState('')
  const [kebele, setKebele] = useState('')
  const [parcel, setParcel] = useState('')
  const [block, setBlock] = useState('')
  const [homeNo, setHomeNo] = useState('')

  // Images
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [uploadingImage, setUploadingImage] = useState(false)
  
  // Video
  const [videoUrl, setVideoUrl] = useState('')
  
  // Map
  const [latitude, setLatitude] = useState(0)
  const [longitude, setLongitude] = useState(0)
  const [locationDocument, setLocationDocument] = useState('')
  
  const [customFeature, setCustomFeature] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const token = await getToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [getToken])

  const toggleFeature = (feature: string) => {
    setFeatures((prev) =>
      prev.includes(feature) ? prev.filter((f) => f !== feature) : [...prev, feature]
    )
  }

  const addCustomFeature = () => {
    const val = customFeature.trim()
    if (val && !features.includes(val)) {
      setFeatures((prev) => [...prev, val])
    }
    setCustomFeature('')
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploadingImage(true)
    setError('')
    try {
      const token = await getToken()
      const uploadUrl = token
        ? `${getApiUrl()}/api/agent/upload?token=${encodeURIComponent(token)}`
        : `${getApiUrl()}/api/agent/upload`
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch(uploadUrl, {
          method: 'POST',
          body: fd,
        })
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.message || `Failed to upload ${file.name}`)
        }
        if (data.url) {
          setUploadedImages((prev) => [...prev, data.url])
        }
      }
    } catch (err: any) {
      console.error('[Image Upload Error]', err)
      setError(err.message || 'Failed to upload image(s). Please try again.')
    } finally {
      setUploadingImage(false)
      // Reset file input so the same file can be re-selected
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  function removeImage(index: number) {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleDocumentUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    setError('')
    try {
      const headers = await getAuthHeaders()
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`${getApiUrl()}/api/agent/upload`, {
        method: 'POST',
        headers,
        body: fd,
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || 'Failed to upload document')
      }
      if (data.url) {
        setLocationDocument(data.url)
      }
    } catch (err: any) {
      console.error('[Document Upload Error]', err)
      setError(err.message || 'Failed to upload document. Please try again.')
    } finally {
      setUploadingImage(false)
    }
  }

  async function handleSubmit() {
    setError('')
    setSaving(true)
    try {
      const authHeaders = await getAuthHeaders()
      const res = await fetch(`${getApiUrl()}/api/properties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          title, posterType, ownerType, type: propertyType, listingType, price: Number(price), priceType,
          area: area ? Number(area) : undefined,
          bedrooms: bedrooms ? Number(bedrooms) : undefined,
          bathrooms: bathrooms ? Number(bathrooms) : undefined,
          condition, legalizedYear: legalizedYear ? Number(legalizedYear) : undefined,
          description, features, region, city, subCity,
          woreda, kebele, parcel, block, homeNo,
          images: uploadedImages,
          ...(videoUrl ? { videoUrl } : {}),
          ...(latitude ? { latitude } : {}),
          ...(longitude ? { longitude } : {}),
          ...(locationDocument ? { locationDocument } : {}),
        }),
      })

      const data = await res.json()
      if (res.ok) {
        router.push('/agent/properties')
      } else {
        if (data.errors?.fieldErrors) {
          const msgs = Object.entries(data.errors.fieldErrors)
            .map(([field, errs]) => `${field}: ${(errs as string[]).join(', ')}`)
          setError(msgs.join(' | '))
        } else {
          setError(data.message || 'Failed to submit property listing.')
        }
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const next = () => {
    setError('')
    if (step === 1) {
      if (!title.trim()) { setError('Title is required.'); return }
      if (!price.trim()) { setError('Price is required.'); return }
    } else if (step === 2) {
      if (!region.trim()) { setError('Region is required.'); return }
      if (!city.trim()) { setError('City is required.'); return }
    } else if (step === 3) {
      if (uploadedImages.length === 0) { setError('Please upload at least one image.'); return }
    } else if (step === 4) {
      if (latitude === 0 || longitude === 0) { setError('Please select the property location on the map.'); return }
    }
    setStep((s) => s + 1)
  }

  const back = () => setStep((s) => Math.max(1, s - 1))

  if (user && user.status !== 'Approved') {
    return (
      <div className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <Info className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-xl font-bold text-slate-900">Posting is unavailable</h1>
        <p className="mt-2 text-sm text-slate-500">
          Your account must be approved before you can post property listings. Your current status is{' '}
          <span className="font-semibold">{user.status}</span>.
        </p>
        <Button
          onClick={() => router.push('/agent')}
          className="mt-6 rounded-full bg-orange-500 text-white hover:bg-orange-600"
        >
          Back to Dashboard
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900">Post a Property Listing</h1>
        <p className="mt-1 text-sm text-slate-500">Add a property to DawoLife platform. Listings will be reviewed by administrators.</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between">
        {steps.map((s, i) => {
          const Icon = s.icon
          const done = step > s.id
          const active = step === s.id
          return (
            <div key={s.id} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-300 ${done ? 'border-orange-500 bg-orange-500 text-white' : active ? 'border-orange-500 bg-white text-orange-500' : 'border-slate-200 bg-white text-slate-400'}`}
                >
                  {done ? <Check className="h-4 w-4" /> : s.id}
                </span>
                <span className={`hidden text-xs font-semibold sm:block ${active ? 'text-orange-500' : 'text-slate-400'}`}>
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`mx-2 h-0.5 flex-1 transition-all duration-500 ${done ? 'bg-orange-500' : 'bg-slate-200'}`} />
              )}
            </div>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Main Panel */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
          )}

          {/* STEP 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-orange-600 font-bold">
                <HomeIcon className="h-5 w-5" />
                <h2>Basic Property Details</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Listing By *</Label>
                  <select value={posterType} onChange={(e) => setPosterType(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400">
                    {['Agent', 'Owner'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Owner Type</Label>
                  <select value={ownerType} onChange={(e) => setOwnerType(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400">
                    {['Farmer Owner', 'Saving Owner'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Property Title *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. 3-Bedroom Villa in Old Airport" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Property Type *</Label>
                  <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400">
                    {['House', 'Apartment', 'Land', 'Commercial', 'Villa'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Listing Type *</Label>
                  <select value={listingType} onChange={(e) => setListingType(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400">
                    {['For Rent', 'For Sale'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Price (ETB) *</Label>
                  <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 15000000" />
                </div>
                <div className="space-y-2">
                  <Label>Price Type</Label>
                  <select value={priceType} onChange={(e) => setPriceType(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400">
                    {['Fixed Price', 'Negotiable', 'per month'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Area (mÂ²)</Label>
                  <Input type="number" value={area} onChange={(e) => setArea(e.target.value)} placeholder="e.g. 150" />
                </div>
                <div className="space-y-2">
                  <Label>Bedrooms</Label>
                  <Input type="number" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} placeholder="e.g. 3" />
                </div>
                <div className="space-y-2">
                  <Label>Bathrooms</Label>
                  <Input type="number" value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} placeholder="e.g. 2" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Condition</Label>
                  <select value={condition} onChange={(e) => setCondition(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400">
                    {['Finished', 'Semi-finished', 'Under Construction'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Legalized Year</Label>
                  <Input type="number" value={legalizedYear} onChange={(e) => setLegalizedYear(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Describe the property, features, environment..." />
              </div>

              <div className="space-y-3">
                <Label>Amenities & Features</Label>
                <div className="flex flex-wrap gap-2">
                  {amenityOptions.map((opt) => {
                    const active = features.includes(opt)
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => toggleFeature(opt)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-300 ${active ? 'border-orange-500 bg-orange-500 text-white shadow-md' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-orange-300'}`}
                      >
                        {opt}
                      </button>
                    )
                  })}
                </div>
                <div className="flex gap-2">
                  <Input value={customFeature} onChange={(e) => setCustomFeature(e.target.value)} placeholder="Add custom feature..." />
                  <Button type="button" onClick={addCustomFeature} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl">Add</Button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Location */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-orange-600 font-bold">
                <MapPin className="h-5 w-5" />
                <h2>Property Location</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Region *</Label>
                  <select value={region} onChange={(e) => setRegion(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400">
                    <option value="">Select region</option>
                    {['Addis Ababa', 'Afar', 'Amhara', 'Benishangul-Gumuz', 'Central Ethiopia', 'Dire Dawa', 'Gambela', 'Harari', 'Oromia', 'Sidama', 'Somali', 'South Ethiopia', 'SNNPR', 'Tigray'].map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>City *</Label>
                  <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Addis Ababa" />
                </div>
                <div className="space-y-2">
                  <Label>Sub City</Label>
                  <Input value={subCity} onChange={(e) => setSubCity(e.target.value)} placeholder="e.g. Bole" />
                </div>
                <div className="space-y-2">
                  <Label>Woreda</Label>
                  <Input value={woreda} onChange={(e) => setWoreda(e.target.value)} placeholder="e.g. 03" />
                </div>
                <div className="space-y-2">
                  <Label>Kebele</Label>
                  <Input value={kebele} onChange={(e) => setKebele(e.target.value)} placeholder="e.g. 05" />
                </div>
                <div className="space-y-2">
                  <Label>Parcel Number</Label>
                  <Input value={parcel} onChange={(e) => setParcel(e.target.value)} placeholder="e.g. 102" />
                </div>
                <div className="space-y-2">
                  <Label>Block Number</Label>
                  <Input value={block} onChange={(e) => setBlock(e.target.value)} placeholder="e.g. 5" />
                </div>
                <div className="space-y-2">
                  <Label>House Number</Label>
                  <Input value={homeNo} onChange={(e) => setHomeNo(e.target.value)} placeholder="e.g. 450" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Media Upload */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-orange-600 font-bold">
                <Upload className="h-5 w-5" />
                <h2>Photos & Media</h2>
              </div>
              <p className="text-sm text-slate-500">Upload high quality photos of the property. Add at least one photo. First image will be used as the listing thumbnail.</p>
              
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 py-8 transition hover:border-orange-500 hover:bg-orange-50/50"
              >
                {uploadingImage ? (
                  <div className="flex flex-col items-center gap-2 text-orange-500">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="text-xs">Uploading images...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <Upload className="h-8 w-8 text-slate-400" />
                    <span className="text-sm font-semibold">Click to upload photos</span>
                    <span className="text-xs">Supports JPG, PNG, WEBP files</span>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {uploadedImages.map((img, idx) => (
                    <div key={idx} className="relative group aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                      <img src={img} alt={`uploaded-${idx}`} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeImage(idx) }}
                        className="absolute right-2 top-2 rounded-full bg-red-500 p-1 text-white opacity-90 transition hover:opacity-100"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <Label>YouTube Video URL <span className="text-slate-400 font-normal">(optional)</span></Label>
                <Input
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="e.g. https://www.youtube.com/watch?v=..."
                />
                <p className="text-xs text-slate-400">Paste a YouTube or Vimeo link to add a video tour of the property.</p>
              </div>
            </div>
          )}

          {/* STEP 4: Location Map */}
          {step === 4 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-orange-600 font-bold">
                <MapPin className="h-5 w-5" />
                <h2>Property Location Map</h2>
              </div>
              <div className="flex items-start gap-2 rounded-xl bg-orange-50 p-3 text-sm text-orange-700">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  Click on the map to select the exact location of the property. This helps buyers find your property easily.
                </p>
              </div>
              
              <MapPicker
                latitude={latitude}
                longitude={longitude}
                onLocationChange={(lat, lng) => {
                  setLatitude(lat)
                  setLongitude(lng)
                }}
              />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Latitude</Label>
                  <Input
                    type="number"
                    step="any"
                    value={latitude || ''}
                    onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                    placeholder="e.g. 9.0375"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Longitude</Label>
                  <Input
                    type="number"
                    step="any"
                    value={longitude || ''}
                    onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                    placeholder="e.g. 38.7612"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-semibold text-slate-800">
                  Location Document (Optional)
                </Label>
                <p className="text-xs text-slate-500">
                  Upload a document showing property boundaries, land title, or location verification
                </p>
                <label className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 py-8 text-center transition hover:border-orange-500 hover:bg-orange-50/50 cursor-pointer">
                  {uploadingImage ? (
                    <div className="flex flex-col items-center gap-2 text-orange-500">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="text-xs">Uploading document...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <FileText className="h-6 w-6 text-slate-400" />
                      <span className="text-sm font-semibold">Click to upload document</span>
                      <span className="text-xs">PDF, JPG, PNG (Max 10MB)</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleDocumentUpload}
                    className="hidden"
                  />
                </label>
                {locationDocument && (
                  <div className="mt-2 flex items-center gap-2 rounded-xl bg-green-50 p-3 text-sm text-green-700">
                    <Check className="h-4 w-4" />
                    <span>Document uploaded successfully</span>
                    <button
                      type="button"
                      onClick={() => setLocationDocument('')}
                      className="ml-auto text-red-500 hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 5: Review */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-orange-600 font-bold">
                <CheckCircle2 className="h-5 w-5" />
                <h2>Review Listing Information</h2>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600 space-y-2">
                <p className="font-bold text-slate-800 text-base mb-2">{title}</p>
                <div className="grid grid-cols-2 gap-y-2">
                  <p><span className="font-semibold">Type:</span> {propertyType} ({listingType})</p>
                  <p><span className="font-semibold">Price:</span> {formatPrice(Number(price))} ETB ({priceType})</p>
                  <p><span className="font-semibold">Location:</span> {city}, {region}</p>
                  <p><span className="font-semibold">Beds/Baths:</span> {bedrooms} / {bathrooms}</p>
                  <p><span className="font-semibold">Area:</span> {area} mÂ²</p>
                  <p><span className="font-semibold">Condition:</span> {condition}</p>
                </div>
                {description && (
                  <div className="mt-3 border-t border-slate-200 pt-3">
                    <p className="font-semibold text-slate-700">Description</p>
                    <p className="text-slate-600 line-clamp-3">{description}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 rounded-xl bg-orange-50 p-4 border border-orange-100 text-xs text-orange-800">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <p>By submitting this property listing, you agree that the details are accurate. The listing will remain in Pending status until approved by an administrator.</p>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-5">
            <Button
              type="button"
              variant="outline"
              onClick={back}
              disabled={step === 1 || saving}
              className="rounded-full"
            >
              <ArrowLeft className="mr-1 h-4 w-4" /> Back
            </Button>
            {step < 4 ? (
              <Button type="button" onClick={next} className="rounded-full bg-orange-500 text-white hover:bg-orange-600">
                Next <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmit} disabled={saving} className="rounded-full bg-orange-500 text-white hover:bg-orange-600 px-6">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Submit Listing
              </Button>
            )}
          </div>
        </div>

        {/* Sidebar Summary */}
        <aside className="rounded-3xl border border-slate-200 bg-white p-5 lg:sticky lg:top-24 lg:self-start space-y-4 shadow-sm">
          <p className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <Building2 className="h-4 w-4 text-orange-500" />
            <span>Listing Summary</span>
          </p>
          <div className="divide-y divide-slate-100 text-xs">
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-500">Listing By</span>
              <span className="font-semibold text-slate-800">{posterType}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-500">Owner Type</span>
              <span className="font-semibold text-slate-800">{ownerType}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-500">Type</span>
              <span className="font-semibold text-slate-800">{propertyType}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-500">Listing</span>
              <span className="font-semibold text-slate-800">{listingType}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-500">Price</span>
              <span className="font-bold text-orange-600">{price ? `${formatPrice(Number(price))} ETB` : 'Not set'}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-500">Location</span>
              <span className="font-semibold text-slate-800 truncate max-w-[120px]">{city || 'Not set'}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-500">Images</span>
              <span className="font-semibold text-slate-800">{uploadedImages.length} uploaded</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-500">Features</span>
              <span className="font-semibold text-slate-800">{features.length} selected</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

