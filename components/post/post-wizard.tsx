"use client"

import { useState } from "react"
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Home as HomeIcon,
  MapPin,
  Phone,
  Plus,
  Send,
  Upload,
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

const steps = [
  { label: "Basic Info", icon: HomeIcon },
  { label: "Location & Map", icon: MapPin },
  { label: "Photos & Media", icon: Upload },
  { label: "Contact", icon: Phone },
]

type FormState = {
  title: string
  propertyType: string
  listingType: string
  price: string
  priceType: string
  area: string
  bedrooms: string
  bathrooms: string
  condition: string
  yearBuilt: string
  description: string
  features: string[]
  region: string
  city: string
  subCity: string
  woreda: string
  name: string
  phone: string
  photos: number
}

const initialState: FormState = {
  title: "",
  propertyType: "House",
  listingType: "For Rent",
  price: "",
  priceType: "Fixed Price",
  area: "",
  bedrooms: "",
  bathrooms: "",
  condition: "Finished",
  yearBuilt: "",
  description: "",
  features: [],
  region: "",
  city: "",
  subCity: "",
  woreda: "",
  name: "",
  phone: "",
  photos: 0,
}

export function PostWizard() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormState>(initialState)
  const [customFeature, setCustomFeature] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const toggleFeature = (feature: string) =>
    setForm((f) => ({
      ...f,
      features: f.features.includes(feature)
        ? f.features.filter((x) => x !== feature)
        : [...f.features, feature],
    }))

  const addCustomFeature = () => {
    const value = customFeature.trim()
    if (value && !form.features.includes(value)) {
      set("features", [...form.features, value])
    }
    setCustomFeature("")
  }

  const next = () => setStep((s) => Math.min(s + 1, steps.length - 1))
  const back = () => setStep((s) => Math.max(s - 1, 0))

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-border bg-card p-10 text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success">
          <CheckCircle2 className="h-8 w-8" />
        </span>
        <h2 className="mt-5 text-2xl font-bold text-foreground">Property Submitted!</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Your listing has been received and is pending review. Our team will verify the details and publish it
          shortly.
        </p>
        <Button
          className="mt-6 rounded-xl font-semibold"
          onClick={() => {
            setForm(initialState)
            setStep(0)
            setSubmitted(false)
          }}
        >
          Post Another Property
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">Post a Property</h1>
        <p className="mt-1 text-sm text-muted-foreground">List your property for millions of buyers across Ethiopia</p>
      </div>

      {/* Stepper */}
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
                  {done ? <Check className="h-4 w-4" /> : i + 1}
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

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
        {/* Form panel */}
        <div className="rounded-2xl border border-border bg-card p-6">
          {step === 0 && (
            <div className="space-y-5">
              <SectionTitle icon={<HomeIcon className="h-5 w-5" />} title="Property Details" />
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
                    options={["House", "Apartment", "Land", "Commercial", "Villa", "Condo"]}
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
                <Field label="Area (m²)">
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
                <Field label="Year Built">
                  <Input
                    value={form.yearBuilt}
                    onChange={(e) => set("yearBuilt", e.target.value)}
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
              <div className="flex aspect-[16/7] items-center justify-center rounded-xl border border-border bg-muted text-sm text-muted-foreground">
                <span className="flex flex-col items-center gap-2">
                  <MapPin className="h-8 w-8 text-primary/50" /> Click on the map to drop a pin
                </span>
              </div>
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
                <Label className="mb-2 block">Property Photos</Label>
                <button
                  type="button"
                  onClick={() => set("photos", form.photos + 1)}
                  className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-muted/40 py-12 text-center transition-colors hover:border-primary"
                >
                  <Upload className="h-8 w-8 text-primary" />
                  <span className="text-sm font-medium text-foreground">Click to upload photos</span>
                  <span className="text-xs text-muted-foreground">JPG, PNG, WEBP supported</span>
                </button>
                {form.photos > 0 && (
                  <p className="mt-2 text-xs font-medium text-success">{form.photos} photo(s) added</p>
                )}
              </div>
              <Field label="Video URL (YouTube/Vimeo)">
                <Input placeholder="https://youtube.com/watch?v=..." />
              </Field>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <SectionTitle icon={<Phone className="h-5 w-5" />} title="Contact Information" />
              <Field label="Your Name" required>
                <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Full Name" />
              </Field>
              <Field label="Phone Number" required>
                <Input
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="+251 911 000 000"
                />
              </Field>
            </div>
          )}

          {/* Nav buttons */}
          <div className="mt-8 flex items-center justify-between border-t border-border pt-5">
            <Button variant="outline" onClick={back} disabled={step === 0} className="rounded-xl">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            {step < steps.length - 1 ? (
              <Button onClick={next} className="rounded-xl font-semibold">
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={() => setSubmitted(true)} className="rounded-xl font-semibold">
                <Send className="h-4 w-4" /> Submit Property
              </Button>
            )}
          </div>
        </div>

        {/* Live summary */}
        <aside className="rounded-2xl border border-border bg-card p-5 lg:sticky lg:top-24 lg:self-start">
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Building2 className="h-4 w-4 text-primary" /> Property Summary
          </p>
          <dl className="mt-4 space-y-3 text-sm">
            <SummaryRow label="Type" value={form.propertyType} />
            <SummaryRow label="Listing" value={form.listingType} />
            <SummaryRow
              label="Price"
              value={form.price ? `${formatPrice(Number(form.price))} ETB` : "Not set"}
              highlight={!!form.price}
            />
            <SummaryRow label="Location" value={form.subCity || form.city || "Not set"} />
            <SummaryRow label="Photos" value={form.photos > 0 ? `${form.photos} uploaded` : "None"} />
            <SummaryRow label="Features" value={form.features.length ? `${form.features.length} selected` : "None"} />
          </dl>
        </aside>
      </div>
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
