"use client"

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, ArrowRight, Building2, Check, CheckCircle2,
  Home as HomeIcon, MapPin, Phone, Plus, Send, Upload, X, Loader2, Info
} from 'lucide-react'
import { amenityOptions, formatPrice } from '@/lib/data'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const steps = [
  { id: 1, label: 'Basic Info', icon: HomeIcon },
  { id: 2, label: 'Location Details', icon: MapPin },
  { id: 3, label: 'Media Upload', icon: Upload },
  { id: 4, label: 'Review & Submit', icon: CheckCircle2 },
]

export default function AgentPostPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Form Fields
  const [title, setTitle] = useState('')
  const [propertyType, setPropertyType] = useState('House')
  const [listingType, setListingType] = useState('For Rent')
  const [price, setPrice] = useState('')
  const [priceType, setPriceType] = useState('Fixed Price')
  const [area, setArea] = useState('')
  const [bedrooms, setBedrooms] = useState('')
  const [bathrooms, setBathrooms] = useState('')
  const [condition, setCondition] = useState('Finished')
  const [yearBuilt, setYearBuilt] = useState(String(new Date().getFullYear()))
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
  
  const [customFeature, setCustomFeature] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch('/api/agent/upload', {
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

  async function handleSubmit() {
    setError('')
    setSaving(true)
    try {
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, propertyType, listingType, price, priceType,
          area, bedrooms, bathrooms, condition, yearBuilt,
          description, features, region, city, subCity,
          woreda, kebele, parcel, block, homeNo,
          images: uploadedImages, type: propertyType
        }),
      })

      const data = await res.json()
      if (res.ok && data.ok) {
        router.push('/agent/properties')
      } else {
        setError(data.message || 'Failed to submit property listing.')
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
    }
    setStep((s) => s + 1)
  }

  const back = () => setStep((s) => Math.max(1, s - 1))

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900">Post a Property Listing</h1>
        <p className="mt-1 text-sm text-slate-500">Add a property to DelaHarme platform. Listings will be reviewed by administrators.</p>
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
              <div className="space-y-2">
                <Label>Property Title *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. 3-Bedroom Villa in Old Airport" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Property Type *</Label>
                  <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400">
                    {['House', 'Apartment', 'Land', 'Commercial', 'Villa', 'Condo'].map(o => <option key={o}>{o}</option>)}
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
                  <Label>Area (m²)</Label>
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
                  <Label>Year Built</Label>
                  <Input type="number" value={yearBuilt} onChange={(e) => setYearBuilt(e.target.value)} />
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
            </div>
          )}

          {/* STEP 4: Review */}
          {step === 4 && (
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
                  <p><span className="font-semibold">Area:</span> {area} m²</p>
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
