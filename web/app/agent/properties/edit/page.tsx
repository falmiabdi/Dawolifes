"use client"

import { getApiUrl } from '@/lib/get-api-url'

import { useState, useEffect, Suspense, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/components/auth/auth-guard"
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Home as HomeIcon,
  MapPin,
  Plus,
  Send,
  Upload,
  Trash2,
  Loader2,
  AlertCircle,
  FileText,
  ChevronLeft,
} from "lucide-react"
import { amenityOptions, formatPrice } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { MapPicker } from "@/components/maps/map-picker"
import { SiteHeader } from "@/components/site-header"
import toast from "react-hot-toast"

type FormState = {
  title: string
  posterType: string
  ownerType: string
  propertyType: string
  listingType: string
  price: string
  priceType: string
  area: string
  bedrooms: string
  bathrooms: string
  condition: string
  legalizedYear: string
  description: string
  features: string[]
  region: string
  city: string
  subCity: string
  woreda: string
  images: string[]
  videoUrl: string
  latitude: number
  longitude: number
  locationDocument: string
}

const steps = [
  { label: "Basic Info", icon: HomeIcon },
  { label: "Location & Map", icon: MapPin },
  { label: "Photos & Media", icon: Upload },
  { label: "Location Map", icon: MapPin },
]


export default function EditPropertyPageWrapper() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </main>
      </div>
    }>
      <EditPropertyPage />
    </Suspense>
  )
}

function EditPropertyPage() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const router = useRouter()
  const { getToken } = useAuth()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormState | null>(null)
  const [customFeature, setCustomFeature] = useState("")
  const [uploadingImage, setUploadingImage] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [rejectionReason, setRejectionReason] = useState("")

  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const token = await getToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [getToken])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => (f ? { ...f, [key]: value } : f))

  const toggleFeature = (feature: string) =>
    setForm((f) =>
      f
        ? {
            ...f,
            features: f.features.includes(feature)
              ? f.features.filter((x) => x !== feature)
              : [...f.features, feature],
          }
        : f,
    )

  const addCustomFeature = () => {
    const value = customFeature.trim()
    if (value && form && !form.features.includes(value)) {
      set("features", [...form.features, value])
    }
    setCustomFeature("")
  }

  useEffect(() => {
    if (!id) {
      toast.error("No property ID provided.")
      router.push("/agent/properties")
      return
    }

    async function fetchProperty() {
      try {
        const res = await fetch(`${getApiUrl()}/api/properties/${id}`)
        if (!res.ok) {
          toast.error("Failed to load property.")
          router.push("/agent/properties")
          return
        }
        const data = await res.json()
        const p = data.property
        setRejectionReason(p.rejectionReason || "")
        setForm({
          title: p.title || "",
          posterType: p.posterType || "Agent",
          ownerType: p.ownerType || "Farmer Owner",
          propertyType: p.type || "House",
          listingType: p.listingType || "For Rent",
          price: String(p.price || ""),
          priceType: p.priceType || "Fixed Price",
          area: String(p.area || ""),
          bedrooms: String(p.bedrooms || ""),
          bathrooms: String(p.bathrooms || ""),
          condition: p.condition || "Finished",
          legalizedYear: String(p.legalizedYear || ""),
          description: p.description || "",
          features: p.features || [],
          region: p.region || "",
          city: p.city || "",
          subCity: p.subCity || "",
          woreda: p.woreda || "",
          images: p.images || [],
          videoUrl: p.videoUrl || "",
          latitude: p.latitude || 0,
          longitude: p.longitude || 0,
          locationDocument: p.locationDocument || "",
        })
      } catch {
        toast.error("Error loading property.")
        router.push("/agent/properties")
      } finally {
        setLoading(false)
      }
    }
    fetchProperty()
  }, [id, router])

  const next = () => {
    if (step === 2 && form && form.images.length < 3) {
      setError("Please upload at least 3 photos of the property to continue.")
      return
    }
    if (step === 3 && form && (form.latitude === 0 || form.longitude === 0)) {
      setError("Please select the property location on the map to continue.")
      return
    }
    setError("")
    setStep((s) => Math.min(s + 1, steps.length - 1))
  }

  const back = () => {
    setError("")
    setStep((s) => Math.max(s - 1, 0))
  }

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingImage(true)
    setError("")

    try {
      const headers = await getAuthHeaders()
      const uploadedUrls: string[] = []
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData()
        formData.append("file", files[i])

        const res = await fetch(`${getApiUrl()}/api/agent/upload`, {
          method: "POST",
          headers,
          body: formData,
        })

        if (!res.ok) {
          const errData = await res.json()
          throw new Error(errData.message || `Failed to upload ${files[i].name}`)
        }

        const data = await res.json()
        uploadedUrls.push(data.url)
      }

      set("images", [...(form?.images || []), ...uploadedUrls])
    } catch (err: any) {
      setError(err.message || "Error uploading image")
    } finally {
      setUploadingImage(false)
    }
  }

  const handleUploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    setError("")

    try {
      const headers = await getAuthHeaders()
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch(`${getApiUrl()}/api/agent/upload`, {
        method: "POST",
        headers,
        body: formData,
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.message || "Failed to upload document")
      }

      const data = await res.json()
      set("locationDocument", data.url)
    } catch (err: any) {
      setError(err.message || "Error uploading document")
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async () => {
    if (!form) return
    if (form.images.length < 3) {
      setError("At least 3 photos are required to list a property.")
      return
    }
    if (form.latitude === 0 || form.longitude === 0) {
      setError("Please select the property location on the map.")
      return
    }

    try {
      setSubmitting(true)
      setError("")

      const authHeaders = await getAuthHeaders()
      const res = await fetch(`${getApiUrl()}/api/properties/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          title: form.title,
          posterType: form.posterType,
          ownerType: form.ownerType,
          type: form.propertyType,
          listingType: form.listingType,
          price: Number(form.price),
          priceType: form.priceType,
          area: form.area ? Number(form.area) : undefined,
          bedrooms: form.bedrooms ? Number(form.bedrooms) : undefined,
          bathrooms: form.bathrooms ? Number(form.bathrooms) : undefined,
          condition: form.condition,
          legalizedYear: form.legalizedYear ? Number(form.legalizedYear) : undefined,
          description: form.description,
          features: form.features,
          region: form.region,
          city: form.city,
          subCity: form.subCity,
          woreda: form.woreda,
          images: form.images,
          videoUrl: form.videoUrl,
          latitude: form.latitude,
          longitude: form.longitude,
          locationDocument: form.locationDocument,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || "Failed to update property")
      }

      toast.success("Property updated successfully! It will be re-reviewed.")
      router.push("/agent/properties")
    } catch (err: any) {
      setError(err.message || "Something went wrong while updating the property.")
    } finally {
      setSubmitting(false)
    }
  }

  if (!id) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">No property ID provided.</p>
        </main>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </main>
      </div>
    )
  }

  if (!form) return null

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 bg-muted/30 py-10">
        <div className="px-4 sm:px-6">
          <div className="mx-auto max-w-4xl">
            <Link
              href="/agent/properties"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-orange-600 transition mb-6"
            >
              <ChevronLeft className="h-4 w-4" /> Back to My Properties
            </Link>

            {rejectionReason && (
              <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-red-700 uppercase tracking-wider">
                    Why was this listing rejected?
                  </p>
                  <p className="mt-1 text-sm text-red-600">{rejectionReason}</p>
                </div>
              </div>
            )}

            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground">Edit Property</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Update your listing based on the rejection feedback above
              </p>
            </div>

            <div className="mt-8 flex items-center justify-between">
              {steps.map((s, i) => {
                const Icon = s.icon
                const done = i < step
                const current = i === step
                return (
                  <div key={s.label} className="flex flex-1 items-center last:flex-none">
                    <div className="flex flex-col items-center gap-1.5">
                      <span
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
                          done && "border-success bg-success text-white",
                          current && "border-primary bg-primary text-primary-foreground",
                          !done && !current && "border-border bg-card text-muted-foreground",
                        )}
                      >
                        {done ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                      </span>
                      <span
                        className={cn(
                          "hidden text-xs font-medium sm:block",
                          current ? "text-primary" : "text-muted-foreground",
                        )}
                      >
                        {s.label}
                      </span>
                    </div>
                    {i < steps.length - 1 && (
                      <div className={cn("mx-2 h-0.5 flex-1", i < step ? "bg-success" : "bg-border")} />
                    )}
                  </div>
                )
              })}
            </div>

            {error && (
              <div className="mt-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-2">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
              <div className="rounded-2xl border border-border bg-card p-6">
                {step === 0 && (
                  <div className="space-y-5">
                    <SectionTitle icon={<HomeIcon className="h-5 w-5" />} title="Property Details" />
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field label="Listing By" required>
                        <SelectBox
                          value={form.posterType}
                          onChange={(v) => set("posterType", v)}
                          options={["Agent", "Owner"]}
                        />
                      </Field>
                      <Field label="Owner Type">
                        <SelectBox
                          value={form.ownerType}
                          onChange={(v) => set("ownerType", v)}
                          options={["Farmer Owner", "Saving Owner"]}
                        />
                      </Field>
                    </div>
                    <Field label="Property Title" required>
                      <Input
                        value={form.title}
                        onChange={(e) => set("title", e.target.value)}
                        placeholder="e.g. 3-Bedroom House in Bole, Addis Ababa"
                      />
                    </Field>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field label="Property Type" required>
                        <SelectBox
                          value={form.propertyType}
                          onChange={(v) => set("propertyType", v)}
                          options={["House", "Apartment", "Land", "Commercial", "Villa"]}
                        />
                      </Field>
                      <Field label="Listing Type" required>
                        <SelectBox
                          value={form.listingType}
                          onChange={(v) => set("listingType", v)}
                          options={["For Rent", "For Sale"]}
                        />
                      </Field>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field label="Price (ETB)" required>
                        <Input
                          type="number"
                          value={form.price}
                          onChange={(e) => set("price", e.target.value)}
                          placeholder="e.g. 7000000"
                        />
                      </Field>
                      <Field label="Price Type">
                        <SelectBox
                          value={form.priceType}
                          onChange={(v) => set("priceType", v)}
                          options={["Fixed Price", "Negotiable", "per month"]}
                        />
                      </Field>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <Field label="Area (mÂ²)">
                        <Input value={form.area} onChange={(e) => set("area", e.target.value)} placeholder="214" />
                      </Field>
                      <Field label="Bedrooms">
                        <Input value={form.bedrooms} onChange={(e) => set("bedrooms", e.target.value)} placeholder="3" />
                      </Field>
                      <Field label="Bathrooms">
                        <Input value={form.bathrooms} onChange={(e) => set("bathrooms", e.target.value)} placeholder="2" />
                      </Field>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field label="Condition">
                        <SelectBox
                          value={form.condition}
                          onChange={(v) => set("condition", v)}
                          options={["Finished", "Semi-finished", "Under Construction"]}
                        />
                      </Field>
                      <Field label="Legalized Year">
                        <Input
                          value={form.legalizedYear}
                          onChange={(e) => set("legalizedYear", e.target.value)}
                          placeholder="2023"
                        />
                      </Field>
                    </div>
                    <Field label="Description">
                      <Textarea
                        rows={4}
                        value={form.description}
                        onChange={(e) => set("description", e.target.value)}
                        placeholder="Describe the property..."
                      />
                    </Field>

                    <div>
                      <p className="mb-3 text-sm font-semibold text-foreground">Features &amp; Amenities</p>
                      <div className="flex flex-wrap gap-2">
                        {amenityOptions.map((a) => (
                          <button
                            key={a}
                            type="button"
                            onClick={() => toggleFeature(a)}
                            className={cn(
                              "rounded-full border px-3 py-1.5 text-sm transition-colors",
                              form.features.includes(a)
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-card text-foreground hover:border-primary",
                            )}
                          >
                            {a}
                          </button>
                        ))}
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Input
                          value={customFeature}
                          onChange={(e) => setCustomFeature(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                              e.preventDefault()
                              addCustomFeature()
                            }
                          }}
                          placeholder="Add custom feature..."
                        />
                        <Button type="button" onClick={addCustomFeature} className="shrink-0 rounded-lg">
                          Add <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {step === 1 && (
                  <div className="space-y-5">
                    <SectionTitle icon={<MapPin className="h-5 w-5" />} title="Property Location" />
                    <div className="flex items-start gap-2 rounded-xl bg-accent/10 p-3 text-sm text-accent">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                      <p>
                        Search by address OR click directly on the map to set the exact location. Fields below will be
                        auto-filled.
                      </p>
                    </div>
                    <Input placeholder="Search address in Ethiopia (e.g. Bole, Addis Ababa)..." />
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field label="Region">
                        <Input value={form.region} onChange={(e) => set("region", e.target.value)} placeholder="e.g. Oromia" />
                      </Field>
                      <Field label="City">
                        <Input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="e.g. Addis Ababa" />
                      </Field>
                      <Field label="Sub-city">
                        <Input value={form.subCity} onChange={(e) => set("subCity", e.target.value)} placeholder="e.g. Bole" />
                      </Field>
                      <Field label="Woreda">
                        <Input
                          value={form.woreda}
                          onChange={(e) => set("woreda", e.target.value)}
                          placeholder="e.g. Waddessa"
                        />
                      </Field>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-5">
                    <SectionTitle icon={<Upload className="h-5 w-5" />} title="Photos & Media" />
                    <div>
                      <Label className="mb-2 block font-semibold text-slate-800">
                        Property Photos <span className="text-red-500">* (at least 3 photos required)</span>
                      </Label>

                      <label className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-12 text-center transition hover:bg-slate-50 cursor-pointer">
                        {uploadingImage ? (
                          <>
                            <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
                            <span className="text-sm font-semibold text-slate-700">Uploading photos to Cloudinary...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="h-8 w-8 text-orange-500" />
                            <span className="text-sm font-semibold text-slate-700">Click to upload photos</span>
                            <span className="text-xs text-slate-400">Select one or more images (JPG, PNG, WEBP)</span>
                          </>
                        )}
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          className="hidden"
                          onChange={handleUploadImage}
                          disabled={uploadingImage}
                        />
                      </label>

                      {form.images.length > 0 && (
                        <div className="mt-5 space-y-2">
                          <p className="text-xs font-semibold text-orange-600">
                            {form.images.length} photo(s) added {form.images.length < 3 && `(need ${3 - form.images.length} more)`}
                          </p>

                          <div className="grid grid-cols-3 gap-3">
                            {form.images.map((url, idx) => (
                              <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 group/item shadow-sm">
                                <img src={url} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => set("images", form.images.filter((_, i) => i !== idx))}
                                  className="absolute right-1.5 top-1.5 bg-red-500/90 hover:bg-red-600 text-white rounded-lg p-1.5 shadow transition-all duration-200 opacity-90 group-hover/item:opacity-100"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <Field label="Video URL (YouTube/Vimeo) â€” Optional">
                      <Input
                        value={form.videoUrl}
                        onChange={(e) => set("videoUrl", e.target.value)}
                        placeholder="https://youtube.com/watch?v=..."
                      />
                    </Field>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-5">
                    <SectionTitle icon={<MapPin className="h-5 w-5" />} title="Property Location Map" />
                    <div className="flex items-start gap-2 rounded-xl bg-primary/10 p-3 text-sm text-primary">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                      <p>
                        Click on the map to select the exact location, or enter the coordinates manually below.
                      </p>
                    </div>

                    <MapPicker
                      latitude={form.latitude}
                      longitude={form.longitude}
                      onLocationChange={(lat, lng) => {
                        set("latitude", lat)
                        set("longitude", lng)
                      }}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Latitude">
                        <Input
                          type="number"
                          step="any"
                          value={form.latitude || ""}
                          onChange={(e) => set("latitude", parseFloat(e.target.value) || 0)}
                          placeholder="e.g. 9.0375"
                        />
                      </Field>
                      <Field label="Longitude">
                        <Input
                          type="number"
                          step="any"
                          value={form.longitude || ""}
                          onChange={(e) => set("longitude", parseFloat(e.target.value) || 0)}
                          placeholder="e.g. 38.7612"
                        />
                      </Field>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-semibold text-slate-800">Location Document (Optional)</Label>
                      <p className="text-xs text-muted-foreground">
                        Upload a document showing property boundaries, land title, or location verification
                      </p>
                      <label className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-8 text-center transition hover:bg-slate-50 cursor-pointer">
                        {uploadingImage ? (
                          <>
                            <Loader2 className="h-6 w-6 text-orange-500 animate-spin" />
                            <span className="text-sm font-semibold text-slate-700">Uploading document...</span>
                          </>
                        ) : (
                          <>
                            <FileText className="h-6 w-6 text-orange-500" />
                            <span className="text-sm font-semibold text-slate-700">Click to upload document</span>
                            <span className="text-xs text-slate-400">PDF, JPG, PNG (Max 10MB)</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={handleUploadDocument}
                          disabled={uploadingImage}
                        />
                      </label>
                      {form.locationDocument && (
                        <div className="mt-2 flex items-center gap-2 rounded-xl bg-green-50 p-3 text-sm text-green-700">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Document uploaded successfully</span>
                          <button
                            type="button"
                            onClick={() => set("locationDocument", "")}
                            className="ml-auto text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-8 flex items-center justify-between border-t border-border pt-5">
                  <Button variant="outline" onClick={back} disabled={step === 0 || submitting} className="rounded-xl">
                    <ArrowLeft className="h-4 w-4" /> Back
                  </Button>
                  {step < steps.length - 1 ? (
                    <Button
                      onClick={next}
                      disabled={(step === 2 && form.images.length < 3) || (step === 3 && (form.latitude === 0 || form.longitude === 0))}
                      className="rounded-xl font-semibold"
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="rounded-xl font-semibold bg-orange-500 hover:bg-orange-600 text-white min-h-[44px]"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Updating...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" /> Update Property
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>

              <aside className="rounded-2xl border border-border bg-card p-5 lg:sticky lg:top-24 lg:self-start">
                <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Building2 className="h-4 w-4 text-primary" /> Property Summary
                </p>
                <dl className="mt-4 space-y-3 text-sm">
                  <SummaryRow label="Listing By" value={form.posterType} />
                  <SummaryRow label="Owner Type" value={form.ownerType} />
                  <SummaryRow label="Type" value={form.propertyType} />
                  <SummaryRow label="Listing" value={form.listingType} />
                  <SummaryRow
                    label="Price"
                    value={form.price ? `${formatPrice(Number(form.price))} ETB` : "Not set"}
                    highlight={!!form.price}
                  />
                  <SummaryRow label="Location" value={form.subCity || form.city || "Not set"} />
                  <SummaryRow label="Photos" value={form.images.length > 0 ? `${form.images.length} uploaded` : "None"} />
                  <SummaryRow label="Features" value={form.features.length ? `${form.features.length} selected` : "None"} />
                </dl>
              </aside>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
      <span className="text-primary">{icon}</span> {title}
    </h2>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <Label className="mb-1.5 block">
        {label} {required && <span className="text-primary">*</span>}
      </Label>
      {children}
    </div>
  )
}

function SelectBox({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v ?? "")}>
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function SummaryRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("truncate text-right font-medium", highlight ? "text-primary" : "text-foreground")}>
        {value}
      </dd>
    </div>
  )
}

