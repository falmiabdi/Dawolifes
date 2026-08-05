"use client"

import { getApiUrl } from '@/lib/get-api-url'
import { useI18n } from '@/lib/i18n'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/auth-guard'

import {
  ArrowLeft, ArrowRight, Building2, Check, CheckCircle2,
  Home as HomeIcon, MapPin, Plus, Send, Upload, X, Loader2, Info, FileText
} from 'lucide-react'
import { amenityOptions, formatPrice, houseSafetyFeatureOptions, houseInteriorFeatureOptions, houseExteriorFeatureOptions } from '@/lib/data'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { MapPicker } from '@/components/maps/map-picker'

const steps = [
  { id: 1, labelKey: 'basic_info', icon: HomeIcon },
  { id: 2, labelKey: 'location_details', icon: MapPin },
  { id: 3, labelKey: 'media_upload', icon: Upload },
  { id: 4, labelKey: 'location_map2', icon: MapPin },
  { id: 5, labelKey: 'review_submit', icon: CheckCircle2 },
]

export default function AgentPostPage() {
  const router = useRouter()
  const { t, tv } = useI18n()
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
  const [customSafetyFeature, setCustomSafetyFeature] = useState('')
  const [customInteriorFeature, setCustomInteriorFeature] = useState('')
  const [customExteriorFeature, setCustomExteriorFeature] = useState('')
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

  const addFeatureValue = (value: string, setter: (v: string) => void) => {
    const val = value.trim()
    if (val && !features.includes(val)) {
      setFeatures((prev) => [...prev, val])
    }
    setter('')
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploadingImage(true)
    setError('')
    try {
      const headers = await getAuthHeaders()
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch(`${getApiUrl()}/api/agent/upload`, {
          method: 'POST',
          headers,
          body: fd,
        })
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.message || t('failed_upload_file').replace('{name}', file.name))
        }
        if (data.url) {
          setUploadedImages((prev) => [...prev, data.url])
        }
      }
    } catch (err: any) {
      console.error('[Image Upload Error]', err)
      setError(err.message || t('failed_upload_images'))
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
        throw new Error(data.message || t('failed_upload_document'))
      }
      if (data.url) {
        setLocationDocument(data.url)
      }
    } catch (err: any) {
      console.error('[Document Upload Error]', err)
      setError(err.message || t('failed_upload_document_retry'))
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
          setError(data.message || t('failed_submit_property'))
        }
      }
    } catch (err) {
      setError(t('error_occurred'))
    } finally {
      setSaving(false)
    }
  }

  const next = () => {
    setError('')
    if (step === 1) {
      if (!title.trim()) { setError(t('title_required')); return }
      if (!price.trim()) { setError(t('price_required')); return }
    } else if (step === 2) {
      if (!region.trim()) { setError(t('region_required')); return }
      if (!city.trim()) { setError(t('city_required')); return }
    } else if (step === 3) {
      if (uploadedImages.length === 0) { setError(t('upload_at_least_one')); return }
    } else if (step === 4) {
      if (latitude === 0 || longitude === 0) { setError(t('select_location_map')); return }
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
        <h1 className="mt-4 text-xl font-bold text-slate-900">{t('posting_unavailable')}</h1>
        <p className="mt-2 text-sm text-slate-500">
          {t('posting_unavailable_property_note')}{' '}
          <span className="font-semibold">{tv(user.status)}</span>.
        </p>
        <Button
          onClick={() => router.push('/agent')}
          className="mt-6 rounded-full bg-orange-500 text-white hover:bg-orange-600"
        >
          {t('back_to_dashboard')}
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900">{t('post_property_listing')}</h1>
        <p className="mt-1 text-sm text-slate-500">{t('post_property_note')}</p>
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
                  {t(s.labelKey)}
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
                <h2>{t('basic_property_details')}</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t('listing_by')} *</Label>
                  <select value={posterType} onChange={(e) => setPosterType(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400">
                    {['Agent', 'Owner'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>{t('owner_type')}</Label>
                  <select value={ownerType} onChange={(e) => setOwnerType(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400">
                    {['Farmer Owner', 'Saving Owner'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('property_title')} *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('property_title_placeholder')} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t('property_type')} *</Label>
                  <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400">
                    {['House', 'Apartment', 'Land', 'Commercial', 'Villa'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>{t('listing_type')} *</Label>
                  <select value={listingType} onChange={(e) => setListingType(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400">
                    {['For Rent', 'For Sale'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t('price_etb')} *</Label>
                  <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder={t('price_placeholder')} />
                </div>
                <div className="space-y-2">
                  <Label>{t('price_type')}</Label>
                  <select value={priceType} onChange={(e) => setPriceType(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400">
                    {['Fixed Price', 'Negotiable', 'per month'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>{t('area')}</Label>
                  <Input type="number" value={area} onChange={(e) => setArea(e.target.value)} placeholder={t('area_placeholder')} />
                </div>
                <div className="space-y-2">
                  <Label>{t('bedrooms')}</Label>
                  <Input type="number" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} placeholder={t('bedrooms_placeholder')} />
                </div>
                <div className="space-y-2">
                  <Label>{t('bathrooms')}</Label>
                  <Input type="number" value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} placeholder={t('bathrooms_placeholder')} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t('condition')}</Label>
                  <select value={condition} onChange={(e) => setCondition(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400">
                    {['Finished', 'Semi-finished', 'Under Construction'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>{t('legalized_year')}</Label>
                  <Input type="number" value={legalizedYear} onChange={(e) => setLegalizedYear(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('description')}</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder={t('description_placeholder')} />
              </div>

              <div className="space-y-3">
                <Label>{t('features_amenities')}</Label>
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
                  <Input value={customFeature} onChange={(e) => setCustomFeature(e.target.value)} placeholder={t('add_custom_feature')} />
                  <Button type="button" onClick={addCustomFeature} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl">{t('add')}</Button>
                </div>
              </div>

              <div className="space-y-3">
                <Label>{t('safety_features')}</Label>
                <div className="flex flex-wrap gap-2">
                  {houseSafetyFeatureOptions.map((opt) => {
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
                  <Input value={customSafetyFeature} onChange={(e) => setCustomSafetyFeature(e.target.value)} placeholder={t('add_custom_feature')} />
                  <Button type="button" onClick={() => addFeatureValue(customSafetyFeature, setCustomSafetyFeature)} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl">{t('add')}</Button>
                </div>
              </div>

              <div className="space-y-3">
                <Label>{t('interior_features')}</Label>
                <div className="flex flex-wrap gap-2">
                  {houseInteriorFeatureOptions.map((opt) => {
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
                  <Input value={customInteriorFeature} onChange={(e) => setCustomInteriorFeature(e.target.value)} placeholder={t('add_custom_feature')} />
                  <Button type="button" onClick={() => addFeatureValue(customInteriorFeature, setCustomInteriorFeature)} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl">{t('add')}</Button>
                </div>
              </div>

              <div className="space-y-3">
                <Label>{t('exterior_features')}</Label>
                <div className="flex flex-wrap gap-2">
                  {houseExteriorFeatureOptions.map((opt) => {
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
                  <Input value={customExteriorFeature} onChange={(e) => setCustomExteriorFeature(e.target.value)} placeholder={t('add_custom_feature')} />
                  <Button type="button" onClick={() => addFeatureValue(customExteriorFeature, setCustomExteriorFeature)} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl">{t('add')}</Button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Location */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-orange-600 font-bold">
                <MapPin className="h-5 w-5" />
                <h2>{t('property_location')}</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t('region')} *</Label>
                  <select value={region} onChange={(e) => setRegion(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400">
                    <option value="">{t('select_region')}</option>
                    {['Addis Ababa', 'Afar', 'Amhara', 'Benishangul-Gumuz', 'Central Ethiopia', 'Dire Dawa', 'Gambela', 'Harari', 'Oromia', 'Sidama', 'Somali', 'South Ethiopia', 'SNNPR', 'Tigray'].map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>{t('city')} *</Label>
                  <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder={t('city_placeholder')} />
                </div>
                <div className="space-y-2">
                  <Label>{t('sub_city')}</Label>
                  <Input value={subCity} onChange={(e) => setSubCity(e.target.value)} placeholder={t('sub_city_placeholder')} />
                </div>
                <div className="space-y-2">
                  <Label>{t('woreda')}</Label>
                  <Input value={woreda} onChange={(e) => setWoreda(e.target.value)} placeholder={t('woreda_placeholder')} />
                </div>
                <div className="space-y-2">
                  <Label>{t('kebele')}</Label>
                  <Input value={kebele} onChange={(e) => setKebele(e.target.value)} placeholder={t('kebele_placeholder')} />
                </div>
                <div className="space-y-2">
                  <Label>{t('parcel_number')}</Label>
                  <Input value={parcel} onChange={(e) => setParcel(e.target.value)} placeholder={t('parcel_placeholder')} />
                </div>
                <div className="space-y-2">
                  <Label>{t('block_number')}</Label>
                  <Input value={block} onChange={(e) => setBlock(e.target.value)} placeholder={t('block_placeholder')} />
                </div>
                <div className="space-y-2">
                  <Label>{t('house_number')}</Label>
                  <Input value={homeNo} onChange={(e) => setHomeNo(e.target.value)} placeholder={t('home_no_placeholder')} />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Media Upload */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-orange-600 font-bold">
                <Upload className="h-5 w-5" />
                <h2>{t('photos_media_title')}</h2>
              </div>
              <p className="text-sm text-slate-500">{t('upload_note')}</p>
              
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 py-8 transition hover:border-orange-500 hover:bg-orange-50/50"
              >
                {uploadingImage ? (
                  <div className="flex flex-col items-center gap-2 text-orange-500">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="text-xs">{t('uploading_images')}</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <Upload className="h-8 w-8 text-slate-400" />
                    <span className="text-sm font-semibold">{t('click_upload_photos')}</span>
                    <span className="text-xs">{t('supported_image_formats')}</span>
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
                <Label>{t('video_url')}</Label>
                <Input
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder={t('video_url_placeholder')}
                />
                <p className="text-xs text-slate-400">{t('video_tour_note')}</p>
              </div>
            </div>
          )}

          {/* STEP 4: Location Map */}
          {step === 4 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-orange-600 font-bold">
                <MapPin className="h-5 w-5" />
                <h2>{t('property_location_map')}</h2>
              </div>
              <div className="flex items-start gap-2 rounded-xl bg-orange-50 p-3 text-sm text-orange-700">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{t('map_note')}</p>
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
                  <Label>{t('latitude')}</Label>
                  <Input
                    type="number"
                    step="any"
                    value={latitude || ''}
                    onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                    placeholder={t('latitude_placeholder')}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('longitude')}</Label>
                  <Input
                    type="number"
                    step="any"
                    value={longitude || ''}
                    onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                    placeholder={t('longitude_placeholder')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-semibold text-slate-800">
                  {t('location_document_optional')}
                </Label>
                <p className="text-xs text-slate-500">
                  {t('location_document_note')}
                </p>
                <label className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 py-8 text-center transition hover:border-orange-500 hover:bg-orange-50/50 cursor-pointer">
                  {uploadingImage ? (
                    <div className="flex flex-col items-center gap-2 text-orange-500">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="text-xs">{t('uploading_document')}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <FileText className="h-6 w-6 text-slate-400" />
                      <span className="text-sm font-semibold">{t('click_upload_document')}</span>
                      <span className="text-xs">{t('doc_types')}</span>
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
                    <span>{t('upload_success')}</span>
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
                <h2>{t('review_listing_info')}</h2>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600 space-y-2">
                <p className="font-bold text-slate-800 text-base mb-2">{title}</p>
                <div className="grid grid-cols-2 gap-y-2">
                  <p><span className="font-semibold">{t('type_label')}</span> {tv(propertyType)} ({tv(listingType)})</p>
                  <p><span className="font-semibold">{t('price_label')}</span> {formatPrice(Number(price))} ETB ({tv(priceType)})</p>
                  <p><span className="font-semibold">{t('location_label')}</span> {city}, {tv(region)}</p>
                  <p><span className="font-semibold">{t('beds_baths_label')}</span> {bedrooms} / {bathrooms}</p>
                  <p><span className="font-semibold">{t('area_label')}</span> {area} mÂ²</p>
                  <p><span className="font-semibold">{t('condition_label')}</span> {tv(condition)}</p>
                </div>
                {description && (
                  <div className="mt-3 border-t border-slate-200 pt-3">
                    <p className="font-semibold text-slate-700">{t('description')}</p>
                    <p className="text-slate-600 line-clamp-3">{description}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 rounded-xl bg-orange-50 p-4 border border-orange-100 text-xs text-orange-800">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <p>{t('submit_agree_note')}</p>
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
              <ArrowLeft className="mr-1 h-4 w-4" /> {t('back')}
            </Button>
            {step < 4 ? (
              <Button type="button" onClick={next} className="rounded-full bg-orange-500 text-white hover:bg-orange-600">
                {t('next')} <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmit} disabled={saving} className="rounded-full bg-orange-500 text-white hover:bg-orange-600 px-6">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                {t('submit_listing')}
              </Button>
            )}
          </div>
        </div>

        {/* Sidebar Summary */}
        <aside className="rounded-3xl border border-slate-200 bg-white p-5 lg:sticky lg:top-24 lg:self-start space-y-4 shadow-sm">
          <p className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <Building2 className="h-4 w-4 text-orange-500" />
            <span>{t('property_summary')}</span>
          </p>
          <div className="divide-y divide-slate-100 text-xs">
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-500">{t('listing_by')}</span>
              <span className="font-semibold text-slate-800">{tv(posterType)}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-500">{t('owner_type')}</span>
              <span className="font-semibold text-slate-800">{tv(ownerType)}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-500">{t('type')}</span>
              <span className="font-semibold text-slate-800">{tv(propertyType)}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-500">{t('listing')}</span>
              <span className="font-semibold text-slate-800">{tv(listingType)}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-500">{t('price')}</span>
              <span className="font-bold text-orange-600">{price ? `${formatPrice(Number(price))} ETB` : t('not_set')}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-500">{t('location')}</span>
              <span className="font-semibold text-slate-800 truncate max-w-[120px]">{city || t('not_set')}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-500">{t('photos')}</span>
              <span className="font-semibold text-slate-800">{uploadedImages.length} {t('uploaded')}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-500">{t('features')}</span>
              <span className="font-semibold text-slate-800">{features.length} {t('selected')}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

