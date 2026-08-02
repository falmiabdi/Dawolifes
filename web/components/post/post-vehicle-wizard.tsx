"use client"

import { getApiUrl } from '@/lib/get-api-url'

import { useState, useCallback } from "react"
import { useAuth } from "@/components/auth/auth-guard"

import {
  ArrowLeft,
  ArrowRight,
  Car,
  Check,
  CheckCircle2,
  MapPin,
  Plus,
  Send,
  Upload,
  Trash2,
  Loader2,
  AlertCircle,
  FileText,
  Settings,
  Shield,
  DollarSign,
  FileCheck,
  Image,
  MapIcon,
  ClipboardCheck,
} from "lucide-react"
import {
  vehicleCategories,
  vehicleMakes,
  fuelTypes,
  transmissionTypes,
  drivetrainTypes,
  vehicleConditions,
  colorOptions,
  countryOfOriginOptions,
  safetyFeatureOptions,
  interiorFeatureOptions,
  exteriorFeatureOptions,
  formatPrice,
} from "@/lib/data"
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
import dynamic from "next/dynamic"

const MapPicker = dynamic(() => import("@/components/maps/map-picker").then((m) => m.MapPicker), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full animate-pulse rounded-2xl bg-muted" />,
})

const steps = [
  { label: "Basic Info", icon: Car },
  { label: "Technical", icon: Settings },
  { label: "Condition & Features", icon: Shield },
  { label: "Pricing", icon: DollarSign },
  { label: "Location & Legal", icon: FileCheck },
  { label: "Photos", icon: Image },
  { label: "Map", icon: MapIcon },
  { label: "Review", icon: ClipboardCheck },
]

type VehicleFormState = {
  title: string
  listingType: string
  vehicleCategory: string
  make: string
  model: string
  trimVersion: string
  manufacturingYear: string
  registrationYear: string
  color: string
  countryOfOrigin: string
  condition: string
  fuelType: string
  engineSize: string
  horsepower: string
  transmission: string
  drivetrain: string
  cylinders: string
  seatingCapacity: string
  doors: string
  mileage: string
  fuelConsumption: string
  fuelTankCapacity: string
  groundClearance: string
  weight: string
  tireSize: string
  accidentFree: boolean
  accidentHistory: string
  serviceHistoryAvailable: boolean
  ownershipCount: string
  imported: boolean
  locallyAssembled: boolean
  safetyFeatures: string[]
  interiorFeatures: string[]
  exteriorFeatures: string[]
  price: string
  priceType: string
  sellingPrice: string
  negotiable: boolean
  financingAvailable: boolean
  exchangeAccepted: boolean
  bankLoanAccepted: boolean
  dailyRate: string
  weeklyRate: string
  monthlyRate: string
  securityDeposit: string
  minRentalDays: string
  maxRentalDays: string
  driverIncluded: boolean
  selfDrive: boolean
  fuelPolicy: string
  mileageLimit: string
  extraKmCharge: string
  deliveryAvailable: boolean
  airportPickup: boolean
  region: string
  city: string
  subCity: string
  woreda: string
  pickupAddress: string
  regionRegistration: string
  ownershipCertificate: string
  roadFundPaid: boolean
  insuranceValid: boolean
  inspectionCertificate: boolean
  customsClearance: boolean
  dutyPaid: boolean
  plateType: string
  plateNumber: string
  description: string
  images: string[]
  videoUrl: string
  latitude: number
  longitude: number
}

const initialState: VehicleFormState = {
  title: "",
  listingType: "For Sale",
  vehicleCategory: "Sedan",
  make: "",
  model: "",
  trimVersion: "",
  manufacturingYear: "",
  registrationYear: "",
  color: "",
  countryOfOrigin: "",
  condition: "Used",
  fuelType: "",
  engineSize: "",
  horsepower: "",
  transmission: "",
  drivetrain: "",
  cylinders: "",
  seatingCapacity: "",
  doors: "",
  mileage: "",
  fuelConsumption: "",
  fuelTankCapacity: "",
  groundClearance: "",
  weight: "",
  tireSize: "",
  accidentFree: false,
  accidentHistory: "",
  serviceHistoryAvailable: false,
  ownershipCount: "",
  imported: false,
  locallyAssembled: false,
  safetyFeatures: [],
  interiorFeatures: [],
  exteriorFeatures: [],
  price: "",
  priceType: "Fixed Price",
  sellingPrice: "",
  negotiable: false,
  financingAvailable: false,
  exchangeAccepted: false,
  bankLoanAccepted: false,
  dailyRate: "",
  weeklyRate: "",
  monthlyRate: "",
  securityDeposit: "",
  minRentalDays: "",
  maxRentalDays: "",
  driverIncluded: false,
  selfDrive: false,
  fuelPolicy: "",
  mileageLimit: "",
  extraKmCharge: "",
  deliveryAvailable: false,
  airportPickup: false,
  region: "",
  city: "",
  subCity: "",
  woreda: "",
  pickupAddress: "",
  regionRegistration: "",
  ownershipCertificate: "",
  roadFundPaid: false,
  insuranceValid: false,
  inspectionCertificate: false,
  customsClearance: false,
  dutyPaid: false,
  plateType: "",
  plateNumber: "",
  description: "",
  images: [],
  videoUrl: "",
  latitude: 0,
  longitude: 0,
}

export function PostVehicleWizard() {
  const { getToken } = useAuth()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<VehicleFormState>(initialState)
  const [submitted, setSubmitted] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const token = await getToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [getToken])

  const set = <K extends keyof VehicleFormState>(key: K, value: VehicleFormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const toggleArrayItem = (field: "safetyFeatures" | "interiorFeatures" | "exteriorFeatures", item: string) =>
    setForm((f) => ({
      ...f,
      [field]: f[field].includes(item) ? f[field].filter((x) => x !== item) : [...f[field], item],
    }))

  const next = () => {
    if (step === 5 && form.images.length < 3) {
      setError("Please upload at least 3 photos of the vehicle to continue.")
      return
    }
    if (step === 6 && (form.latitude === 0 || form.longitude === 0)) {
      setError("Please select the vehicle location on the map to continue.")
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

      set("images", [...form.images, ...uploadedUrls])
    } catch (err: any) {
      setError(err.message || "Error uploading image")
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async () => {
    if (form.images.length < 3) {
      setError("At least 3 photos are required to list a vehicle.")
      return
    }
    if (form.latitude === 0 || form.longitude === 0) {
      setError("Please select the vehicle location on the map.")
      return
    }

    try {
      setSubmitting(true)
      setError("")

      const authHeaders = await getAuthHeaders()
      const body: Record<string, any> = {
        title: form.title,
        vehicleId: `${form.make}-${form.model}-${Date.now()}`,
        listingType: form.listingType,
        vehicleCategory: form.vehicleCategory,
        make: form.make,
        vehicleModel: form.model,
        trimVersion: form.trimVersion,
        manufacturingYear: Number(form.manufacturingYear) || new Date().getFullYear(),
        registrationYear: form.registrationYear ? Number(form.registrationYear) : undefined,
        color: form.color,
        countryOfOrigin: form.countryOfOrigin,
        condition: form.condition,
        fuelType: form.fuelType,
        engineSize: form.engineSize ? Number(form.engineSize) : undefined,
        horsepower: form.horsepower ? Number(form.horsepower) : undefined,
        transmission: form.transmission,
        drivetrain: form.drivetrain,
        cylinders: form.cylinders ? Number(form.cylinders) : undefined,
        seatingCapacity: form.seatingCapacity ? Number(form.seatingCapacity) : undefined,
        doors: form.doors ? Number(form.doors) : undefined,
        mileage: form.mileage ? Number(form.mileage) : undefined,
        fuelConsumption: form.fuelConsumption,
        fuelTankCapacity: form.fuelTankCapacity ? Number(form.fuelTankCapacity) : undefined,
        groundClearance: form.groundClearance ? Number(form.groundClearance) : undefined,
        weight: form.weight ? Number(form.weight) : undefined,
        tireSize: form.tireSize,
        accidentFree: form.accidentFree,
        accidentHistory: form.accidentHistory,
        serviceHistoryAvailable: form.serviceHistoryAvailable,
        ownershipCount: form.ownershipCount ? Number(form.ownershipCount) : undefined,
        imported: form.imported,
        locallyAssembled: form.locallyAssembled,
        safetyFeatures: form.safetyFeatures,
        interiorFeatures: form.interiorFeatures,
        exteriorFeatures: form.exteriorFeatures,
        price: Number(form.price) || 0,
        priceType: form.priceType,
        sellingPrice: form.sellingPrice ? Number(form.sellingPrice) : undefined,
        negotiable: form.negotiable,
        financingAvailable: form.financingAvailable,
        exchangeAccepted: form.exchangeAccepted,
        bankLoanAccepted: form.bankLoanAccepted,
        dailyRate: form.dailyRate ? Number(form.dailyRate) : undefined,
        weeklyRate: form.weeklyRate ? Number(form.weeklyRate) : undefined,
        monthlyRate: form.monthlyRate ? Number(form.monthlyRate) : undefined,
        securityDeposit: form.securityDeposit ? Number(form.securityDeposit) : undefined,
        minRentalDays: form.minRentalDays ? Number(form.minRentalDays) : undefined,
        maxRentalDays: form.maxRentalDays ? Number(form.maxRentalDays) : undefined,
        driverIncluded: form.driverIncluded,
        selfDrive: form.selfDrive,
        fuelPolicy: form.fuelPolicy,
        mileageLimit: form.mileageLimit ? Number(form.mileageLimit) : undefined,
        extraKmCharge: form.extraKmCharge ? Number(form.extraKmCharge) : undefined,
        deliveryAvailable: form.deliveryAvailable,
        airportPickup: form.airportPickup,
        region: form.region,
        city: form.city,
        subCity: form.subCity,
        woreda: form.woreda,
        pickupAddress: form.pickupAddress,
        regionRegistration: form.regionRegistration,
        ownershipCertificate: form.ownershipCertificate,
        roadFundPaid: form.roadFundPaid,
        insuranceValid: form.insuranceValid,
        inspectionCertificate: form.inspectionCertificate,
        customsClearance: form.customsClearance,
        dutyPaid: form.dutyPaid,
        plateType: form.plateType,
        plateNumber: form.plateNumber,
        description: form.description,
        images: form.images,
      }
      if (form.videoUrl) body.videoUrl = form.videoUrl
      if (form.latitude) body.latitude = form.latitude
      if (form.longitude) body.longitude = form.longitude
      // Convert string "" to undefined for boolean fields
      for (const key of ['ownershipCertificate']) {
        if (!(body as any)[key]) delete (body as any)[key]
      }
      const res = await fetch(`${getApiUrl()}/api/vehicles`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (!res.ok) {
        if (data.errors?.fieldErrors) {
          const msgs = Object.entries(data.errors.fieldErrors)
            .map(([field, errs]) => `${field}: ${(errs as string[]).join(', ')}`)
          throw new Error(msgs.join(' | '))
        }
        throw new Error(data.message || "Failed to submit vehicle")
      }

      setSubmitted(true)
    } catch (err: any) {
      setError(err.message || "Something went wrong while submitting the vehicle.")
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-border bg-card p-10 text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success">
          <CheckCircle2 className="h-8 w-8" />
        </span>
        <h2 className="mt-5 text-2xl font-bold text-foreground">Vehicle Submitted!</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Your vehicle listing has been received and is pending review. Our team will verify the details and publish
          it shortly.
        </p>
        <Button
          className="mt-6 rounded-xl font-semibold"
          onClick={() => {
            setForm(initialState)
            setStep(0)
            setSubmitted(false)
          }}
        >
          Post Another Vehicle
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">Post a Vehicle</h1>
        <p className="mt-1 text-sm text-muted-foreground">List your vehicle for millions of buyers across Ethiopia</p>
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
                  {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
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

      <div className="mt-4 flex justify-center">
        <button
          type="button"
          onClick={() => {
            const demoImgs = [
              'https://images.unsplash.com/photo-1541899481282-d53b9a353a1f?w=800',
              'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800',
              'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800',
            ]
            setForm({
              ...initialState,
              title: "Toyota Corolla 2020",
              listingType: "For Sale",
              vehicleCategory: "Sedan",
              make: "Toyota",
              model: "Corolla",
              trimVersion: "LE",
              manufacturingYear: "2020",
              registrationYear: "2020",
              color: "White",
              countryOfOrigin: "Japan",
              condition: "Used",
              fuelType: "Petrol",
              engineSize: "1800",
              horsepower: "140",
              transmission: "Automatic",
              drivetrain: "FWD",
              cylinders: "4",
              seatingCapacity: "5",
              doors: "4",
              mileage: "45000",
              fuelConsumption: "7.5L/100km",
              tireSize: "205/55R16",
              accidentFree: true,
              serviceHistoryAvailable: true,
              ownershipCount: "1",
              imported: true,
              safetyFeatures: ["ABS", "Airbags", "Rear Camera"],
              interiorFeatures: ["AC", "Leather Seats", "Touch Screen"],
              exteriorFeatures: ["Alloy Wheels", "Fog Lights"],
              price: "1850000",
              priceType: "Fixed Price",
              region: "Addis Ababa",
              city: "Bole",
              subCity: "Bole",
              woreda: "03",
              description: "Well-maintained Toyota Corolla 2020, single owner, full service history. Perfect condition, driven only in city.",
              images: demoImgs,
              latitude: 9.0192,
              longitude: 38.7525,
            })
          }}
          className="text-xs text-blue-600 hover:text-blue-800 underline cursor-pointer"
        >
          Fill Demo Data
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
        {/* Form panel */}
        <div className="rounded-2xl border border-border bg-card p-6">
          {step === 0 && (
            <div className="space-y-5">
              <SectionTitle icon={<Car className="h-5 w-5" />} title="Basic Vehicle Info" />
              <Field label="Vehicle Title" required>
                <Input
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="e.g. 2020 Toyota Land Cruiser V8"
                />
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Listing Type" required>
                  <SelectBox
                    value={form.listingType}
                    onChange={(v) => set("listingType", v)}
                    options={["For Sale", "For Rent", "Both"]}
                  />
                </Field>
                <Field label="Vehicle Category" required>
                  <SelectBox
                    value={form.vehicleCategory}
                    onChange={(v) => set("vehicleCategory", v)}
                    options={vehicleCategories}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Make" required>
                  <SelectBox
                    value={form.make}
                    onChange={(v) => set("make", v)}
                    options={vehicleMakes}
                  />
                </Field>
                <Field label="Model" required>
                  <Input
                    value={form.model}
                    onChange={(e) => set("model", e.target.value)}
                    placeholder="e.g. Land Cruiser"
                  />
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Trim / Version">
                  <Input
                    value={form.trimVersion}
                    onChange={(e) => set("trimVersion", e.target.value)}
                    placeholder="e.g. VX-R"
                  />
                </Field>
                <Field label="Condition" required>
                  <SelectBox
                    value={form.condition}
                    onChange={(v) => set("condition", v)}
                    options={vehicleConditions}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="Manufacturing Year" required>
                  <Input
                    value={form.manufacturingYear}
                    onChange={(e) => set("manufacturingYear", e.target.value)}
                    placeholder="2020"
                  />
                </Field>
                <Field label="Registration Year">
                  <Input
                    value={form.registrationYear}
                    onChange={(e) => set("registrationYear", e.target.value)}
                    placeholder="2020"
                  />
                </Field>
                <Field label="Color">
                  <SelectBox
                    value={form.color}
                    onChange={(v) => set("color", v)}
                    options={colorOptions}
                  />
                </Field>
              </div>
              <Field label="Country of Origin">
                <SelectBox
                  value={form.countryOfOrigin}
                  onChange={(v) => set("countryOfOrigin", v)}
                  options={countryOfOriginOptions}
                />
              </Field>
              <Field label="Description">
                <Textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Describe the vehicle..."
                />
              </Field>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <SectionTitle icon={<Settings className="h-5 w-5" />} title="Technical Specifications" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="Fuel Type">
                  <SelectBox
                    value={form.fuelType}
                    onChange={(v) => set("fuelType", v)}
                    options={fuelTypes}
                  />
                </Field>
                <Field label="Engine Size (L)">
                  <Input
                    value={form.engineSize}
                    onChange={(e) => set("engineSize", e.target.value)}
                    placeholder="e.g. 4.5"
                  />
                </Field>
                <Field label="Horsepower">
                  <Input
                    value={form.horsepower}
                    onChange={(e) => set("horsepower", e.target.value)}
                    placeholder="e.g. 381"
                  />
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="Transmission">
                  <SelectBox
                    value={form.transmission}
                    onChange={(v) => set("transmission", v)}
                    options={transmissionTypes}
                  />
                </Field>
                <Field label="Drivetrain">
                  <SelectBox
                    value={form.drivetrain}
                    onChange={(v) => set("drivetrain", v)}
                    options={drivetrainTypes}
                  />
                </Field>
                <Field label="Cylinders">
                  <Input
                    value={form.cylinders}
                    onChange={(e) => set("cylinders", e.target.value)}
                    placeholder="e.g. 6"
                  />
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="Seating Capacity">
                  <Input
                    value={form.seatingCapacity}
                    onChange={(e) => set("seatingCapacity", e.target.value)}
                    placeholder="e.g. 7"
                  />
                </Field>
                <Field label="Doors">
                  <Input
                    value={form.doors}
                    onChange={(e) => set("doors", e.target.value)}
                    placeholder="e.g. 5"
                  />
                </Field>
                <Field label="Mileage (km)">
                  <Input
                    type="number"
                    value={form.mileage}
                    onChange={(e) => set("mileage", e.target.value)}
                    placeholder="e.g. 45000"
                  />
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="Fuel Consumption (L/100km)">
                  <Input
                    value={form.fuelConsumption}
                    onChange={(e) => set("fuelConsumption", e.target.value)}
                    placeholder="e.g. 12.5"
                  />
                </Field>
                <Field label="Fuel Tank Capacity (L)">
                  <Input
                    value={form.fuelTankCapacity}
                    onChange={(e) => set("fuelTankCapacity", e.target.value)}
                    placeholder="e.g. 93"
                  />
                </Field>
                <Field label="Ground Clearance (mm)">
                  <Input
                    value={form.groundClearance}
                    onChange={(e) => set("groundClearance", e.target.value)}
                    placeholder="e.g. 225"
                  />
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Weight (kg)">
                  <Input
                    value={form.weight}
                    onChange={(e) => set("weight", e.target.value)}
                    placeholder="e.g. 2650"
                  />
                </Field>
                <Field label="Tire Size">
                  <Input
                    value={form.tireSize}
                    onChange={(e) => set("tireSize", e.target.value)}
                    placeholder="e.g. 265/65R18"
                  />
                </Field>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <SectionTitle icon={<Shield className="h-5 w-5" />} title="Vehicle Condition & Features" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="Accident Free">
                  <SelectBox
                    value={form.accidentFree ? "Yes" : "No"}
                    onChange={(v) => set("accidentFree", v === "Yes")}
                    options={["Yes", "No"]}
                  />
                </Field>
                <Field label="Service History Available">
                  <SelectBox
                    value={form.serviceHistoryAvailable ? "Yes" : "No"}
                    onChange={(v) => set("serviceHistoryAvailable", v === "Yes")}
                    options={["Yes", "No"]}
                  />
                </Field>
                <Field label="Ownership Count">
                  <Input
                    type="number"
                    value={form.ownershipCount}
                    onChange={(e) => set("ownershipCount", e.target.value)}
                    placeholder="e.g. 2"
                  />
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Imported">
                  <SelectBox
                    value={form.imported ? "Yes" : "No"}
                    onChange={(v) => set("imported", v === "Yes")}
                    options={["Yes", "No"]}
                  />
                </Field>
                <Field label="Locally Assembled">
                  <SelectBox
                    value={form.locallyAssembled ? "Yes" : "No"}
                    onChange={(v) => set("locallyAssembled", v === "Yes")}
                    options={["Yes", "No"]}
                  />
                </Field>
              </div>
              <Field label="Accident History">
                <Textarea
                  rows={3}
                  value={form.accidentHistory}
                  onChange={(e) => set("accidentHistory", e.target.value)}
                  placeholder="Describe any accident history..."
                />
              </Field>

              <div>
                <p className="mb-3 text-sm font-semibold text-foreground">Safety Features</p>
                <div className="flex flex-wrap gap-2">
                  {safetyFeatureOptions.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => toggleArrayItem("safetyFeatures", f)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-sm transition-colors",
                        form.safetyFeatures.includes(f)
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-foreground hover:border-primary",
                      )}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-3 text-sm font-semibold text-foreground">Interior Features</p>
                <div className="flex flex-wrap gap-2">
                  {interiorFeatureOptions.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => toggleArrayItem("interiorFeatures", f)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-sm transition-colors",
                        form.interiorFeatures.includes(f)
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-foreground hover:border-primary",
                      )}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-3 text-sm font-semibold text-foreground">Exterior Features</p>
                <div className="flex flex-wrap gap-2">
                  {exteriorFeatureOptions.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => toggleArrayItem("exteriorFeatures", f)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-sm transition-colors",
                        form.exteriorFeatures.includes(f)
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-foreground hover:border-primary",
                      )}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <SectionTitle icon={<DollarSign className="h-5 w-5" />} title="Pricing & Rental/Sale Info" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Price (ETB)" required>
                  <Input
                    type="number"
                    value={form.price}
                    onChange={(e) => set("price", e.target.value)}
                    placeholder="e.g. 3500000"
                  />
                </Field>
                <Field label="Price Type">
                  <SelectBox
                    value={form.priceType}
                    onChange={(v) => set("priceType", v)}
                    options={["Fixed Price", "Negotiable", "Starting From"]}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Selling Price (ETB)">
                  <Input
                    type="number"
                    value={form.sellingPrice}
                    onChange={(e) => set("sellingPrice", e.target.value)}
                    placeholder="e.g. 3500000"
                  />
                </Field>
                <Field label="Negotiable">
                  <SelectBox
                    value={form.negotiable ? "Yes" : "No"}
                    onChange={(v) => set("negotiable", v === "Yes")}
                    options={["Yes", "No"]}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="Financing Available">
                  <SelectBox
                    value={form.financingAvailable ? "Yes" : "No"}
                    onChange={(v) => set("financingAvailable", v === "Yes")}
                    options={["Yes", "No"]}
                  />
                </Field>
                <Field label="Exchange Accepted">
                  <SelectBox
                    value={form.exchangeAccepted ? "Yes" : "No"}
                    onChange={(v) => set("exchangeAccepted", v === "Yes")}
                    options={["Yes", "No"]}
                  />
                </Field>
                <Field label="Bank Loan Accepted">
                  <SelectBox
                    value={form.bankLoanAccepted ? "Yes" : "No"}
                    onChange={(v) => set("bankLoanAccepted", v === "Yes")}
                    options={["Yes", "No"]}
                  />
                </Field>
              </div>

              {(form.listingType === "For Rent" || form.listingType === "Both") && (
                <>
                  <div className="border-t border-border pt-5">
                    <p className="mb-3 text-sm font-semibold text-foreground">Rental Information</p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Field label="Daily Rate (ETB)">
                      <Input
                        type="number"
                        value={form.dailyRate}
                        onChange={(e) => set("dailyRate", e.target.value)}
                        placeholder="e.g. 5000"
                      />
                    </Field>
                    <Field label="Weekly Rate (ETB)">
                      <Input
                        type="number"
                        value={form.weeklyRate}
                        onChange={(e) => set("weeklyRate", e.target.value)}
                        placeholder="e.g. 30000"
                      />
                    </Field>
                    <Field label="Monthly Rate (ETB)">
                      <Input
                        type="number"
                        value={form.monthlyRate}
                        onChange={(e) => set("monthlyRate", e.target.value)}
                        placeholder="e.g. 100000"
                      />
                    </Field>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Field label="Security Deposit (ETB)">
                      <Input
                        type="number"
                        value={form.securityDeposit}
                        onChange={(e) => set("securityDeposit", e.target.value)}
                        placeholder="e.g. 50000"
                      />
                    </Field>
                    <Field label="Min Rental Days">
                      <Input
                        type="number"
                        value={form.minRentalDays}
                        onChange={(e) => set("minRentalDays", e.target.value)}
                        placeholder="e.g. 1"
                      />
                    </Field>
                    <Field label="Max Rental Days">
                      <Input
                        type="number"
                        value={form.maxRentalDays}
                        onChange={(e) => set("maxRentalDays", e.target.value)}
                        placeholder="e.g. 30"
                      />
                    </Field>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Field label="Driver Included">
                      <SelectBox
                        value={form.driverIncluded ? "Yes" : "No"}
                        onChange={(v) => set("driverIncluded", v === "Yes")}
                        options={["Yes", "No"]}
                      />
                    </Field>
                    <Field label="Self Drive">
                      <SelectBox
                        value={form.selfDrive ? "Yes" : "No"}
                        onChange={(v) => set("selfDrive", v === "Yes")}
                        options={["Yes", "No"]}
                      />
                    </Field>
                    <Field label="Fuel Policy">
                      <SelectBox
                        value={form.fuelPolicy}
                        onChange={(v) => set("fuelPolicy", v)}
                        options={["Full to Full", "Prepaid", "Included"]}
                      />
                    </Field>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Field label="Mileage Limit (km/day)">
                      <Input
                        value={form.mileageLimit}
                        onChange={(e) => set("mileageLimit", e.target.value)}
                        placeholder="e.g. 200"
                      />
                    </Field>
                    <Field label="Extra Km Charge (ETB)">
                      <Input
                        type="number"
                        value={form.extraKmCharge}
                        onChange={(e) => set("extraKmCharge", e.target.value)}
                        placeholder="e.g. 15"
                      />
                    </Field>
                    <Field label="Delivery Available">
                      <SelectBox
                        value={form.deliveryAvailable ? "Yes" : "No"}
                        onChange={(v) => set("deliveryAvailable", v === "Yes")}
                        options={["Yes", "No"]}
                      />
                    </Field>
                  </div>
                  <Field label="Airport Pickup">
                    <SelectBox
                      value={form.airportPickup ? "Yes" : "No"}
                      onChange={(v) => set("airportPickup", v === "Yes")}
                      options={["Yes", "No"]}
                    />
                  </Field>
                </>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <SectionTitle icon={<FileCheck className="h-5 w-5" />} title="Location & Legal Info" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Region">
                  <Input
                    value={form.region}
                    onChange={(e) => set("region", e.target.value)}
                    placeholder="e.g. Addis Ababa"
                  />
                </Field>
                <Field label="City">
                  <Input
                    value={form.city}
                    onChange={(e) => set("city", e.target.value)}
                    placeholder="e.g. Addis Ababa"
                  />
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Sub-city">
                  <Input
                    value={form.subCity}
                    onChange={(e) => set("subCity", e.target.value)}
                    placeholder="e.g. Bole"
                  />
                </Field>
                <Field label="Woreda">
                  <Input
                    value={form.woreda}
                    onChange={(e) => set("woreda", e.target.value)}
                    placeholder="e.g. 03"
                  />
                </Field>
              </div>
              <Field label="Pickup Address">
                <Input
                  value={form.pickupAddress}
                  onChange={(e) => set("pickupAddress", e.target.value)}
                  placeholder="e.g. Bole Road, near Edna Mall"
                />
              </Field>

              <div className="border-t border-border pt-5">
                <p className="mb-3 text-sm font-semibold text-foreground">Legal Documents</p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Region of Registration">
                  <Input
                    value={form.regionRegistration}
                    onChange={(e) => set("regionRegistration", e.target.value)}
                    placeholder="e.g. Addis Ababa"
                  />
                </Field>
                <Field label="Ownership Certificate">
                  <SelectBox
                    value={form.ownershipCertificate}
                    onChange={(v) => set("ownershipCertificate", v)}
                    options={["Yes", "No", "Pending"]}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="Road Fund Paid">
                  <SelectBox
                    value={form.roadFundPaid ? "Yes" : "No"}
                    onChange={(v) => set("roadFundPaid", v === "Yes")}
                    options={["Yes", "No"]}
                  />
                </Field>
                <Field label="Insurance Valid">
                  <SelectBox
                    value={form.insuranceValid ? "Yes" : "No"}
                    onChange={(v) => set("insuranceValid", v === "Yes")}
                    options={["Yes", "No"]}
                  />
                </Field>
                <Field label="Inspection Certificate">
                  <SelectBox
                    value={form.inspectionCertificate ? "Yes" : "No"}
                    onChange={(v) => set("inspectionCertificate", v === "Yes")}
                    options={["Yes", "No"]}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="Customs Clearance">
                  <SelectBox
                    value={form.customsClearance ? "Yes" : "No"}
                    onChange={(v) => set("customsClearance", v === "Yes")}
                    options={["Yes", "No"]}
                  />
                </Field>
                <Field label="Duty Paid">
                  <SelectBox
                    value={form.dutyPaid ? "Yes" : "No"}
                    onChange={(v) => set("dutyPaid", v === "Yes")}
                    options={["Yes", "No"]}
                  />
                </Field>
                <Field label="Plate Type">
                  <SelectBox
                    value={form.plateType}
                    onChange={(v) => set("plateType", v)}
                    options={["Black", "Red", "Green", "Yellow", "Diplomatic"]}
                  />
                </Field>
              </div>
              <Field label="Plate Number">
                <Input
                  value={form.plateNumber}
                  onChange={(e) => set("plateNumber", e.target.value)}
                  placeholder="e.g. AA-123456"
                />
              </Field>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-5">
              <SectionTitle icon={<Image className="h-5 w-5" />} title="Photos & Media" />
              <div>
                <Label className="mb-2 block font-semibold text-slate-800">
                  Vehicle Photos <span className="text-red-500">* (at least 3 photos required)</span>
                </Label>

                <label className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-12 text-center transition hover:bg-slate-50 cursor-pointer">
                  {uploadingImage ? (
                    <>
                      <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
                      <span className="text-sm font-semibold text-slate-700">Uploading photos...</span>
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
                      {form.images.length} photo(s) added{" "}
                      {form.images.length < 3 && "(need " + (3 - form.images.length) + " more)"}
                    </p>

                    <div className="grid grid-cols-3 gap-3">
                      {form.images.map((url, idx) => (
                        <div
                          key={idx}
                          className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 group/item shadow-sm"
                        >
                          <img src={url} alt={'Upload ' + (idx + 1)} className="w-full h-full object-cover" />
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

          {step === 6 && (
            <div className="space-y-5">
              <SectionTitle icon={<MapIcon className="h-5 w-5" />} title="Vehicle Location Map" />
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
            </div>
          )}

          {step === 7 && (
            <div className="space-y-5">
              <SectionTitle icon={<ClipboardCheck className="h-5 w-5" />} title="Review & Submit" />
              <p className="text-sm text-muted-foreground">
                Please review all the information below before submitting your vehicle listing.
              </p>

              <div className="space-y-4 rounded-xl border border-border bg-muted/50 p-4">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Basic Info</p>
                  <p className="mt-1 text-sm text-foreground">{form.title || "No title set"}</p>
                  <p className="text-sm text-muted-foreground">
                    {form.vehicleCategory} Â· {form.make} {form.model} Â· {form.manufacturingYear}
                  </p>
                </div>
                <div className="border-t border-border pt-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pricing</p>
                  <p className="mt-1 text-sm font-semibold text-primary">
                    {form.price ? formatPrice(Number(form.price)) + ' ETB' : "Price not set"}
                  </p>
                  <p className="text-sm text-muted-foreground">{form.listingType} Â· {form.priceType}</p>
                </div>
                <div className="border-t border-border pt-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Technical</p>
                  <p className="text-sm text-muted-foreground">
                    {[form.fuelType, form.transmission, form.drivetrain, form.mileage ? Number(form.mileage).toLocaleString() + ' km' : ""]
                      .filter(Boolean)
                      .join(" Â· ") || "Not specified"}
                  </p>
                </div>
                <div className="border-t border-border pt-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Location</p>
                  <p className="text-sm text-muted-foreground">
                    {[form.subCity, form.city, form.region].filter(Boolean).join(", ") || "Not set"}
                  </p>
                </div>
                <div className="border-t border-border pt-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Media</p>
                  <p className="text-sm text-muted-foreground">
                    {form.images.length} photo(s) Â· {form.videoUrl ? "Video attached" : "No video"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Nav buttons */}
          <div className="mt-8 flex items-center justify-between border-t border-border pt-5">
            <Button variant="outline" onClick={back} disabled={step === 0 || submitting} className="rounded-xl">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            {step < steps.length - 1 ? (
              <Button
                onClick={next}
                disabled={(step === 5 && form.images.length < 3) || (step === 6 && (form.latitude === 0 || form.longitude === 0))}
                className="rounded-xl font-semibold"
              >
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded-xl font-semibold bg-orange-500 hover:bg-orange-600 text-white min-h-[44px]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" /> Submit Vehicle
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Live summary */}
        <aside className="rounded-2xl border border-border bg-card p-5 lg:sticky lg:top-24 lg:self-start">
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Car className="h-4 w-4 text-primary" /> Vehicle Summary
          </p>
          <dl className="mt-4 space-y-3 text-sm">
            <SummaryRow label="Category" value={form.vehicleCategory || "Not set"} />
            <SummaryRow label="Make/Model" value={form.make && form.model ? form.make + ' ' + form.model : "Not set"} />
            <SummaryRow label="Year" value={form.manufacturingYear || "Not set"} />
            <SummaryRow label="Listing" value={form.listingType} />
            <SummaryRow
              label="Price"
              value={form.price ? formatPrice(Number(form.price)) + ' ETB' : "Not set"}
              highlight={!!form.price}
            />
            <SummaryRow label="Condition" value={form.condition || "Not set"} />
            <SummaryRow label="Fuel" value={form.fuelType || "Not set"} />
            <SummaryRow label="Transmission" value={form.transmission || "Not set"} />
            <SummaryRow label="Mileage" value={form.mileage ? Number(form.mileage).toLocaleString() + ' km' : "Not set"} />
            <SummaryRow label="Location" value={form.subCity || form.city || "Not set"} />
            <SummaryRow label="Photos" value={form.images.length > 0 ? form.images.length + ' uploaded' : "None"} />
            <SummaryRow
              label="Features"
              value={
                form.safetyFeatures.length + form.interiorFeatures.length + form.exteriorFeatures.length > 0
                  ? (form.safetyFeatures.length + form.interiorFeatures.length + form.exteriorFeatures.length) + ' selected'
                  : "None"
              }
            />
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

