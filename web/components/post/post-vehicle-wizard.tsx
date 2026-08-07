"use client"

import { getApiUrl } from '@/lib/get-api-url'
import { useI18n } from '@/lib/i18n'

import { useState, useCallback } from "react"
import { useAuth } from "@/components/auth/auth-guard"
import Link from "next/link"

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
  ownershipCertificate: boolean
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
  ownershipCertificate: false,
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
  const { t, tv } = useI18n()
  const stepLabels: Record<string, string> = {
    'Basic Info': t('basic_info'),
    'Technical': t('technical'),
    'Condition & Features': t('condition_features'),
    'Pricing': t('pricing'),
    'Location & Legal': t('location_legal'),
    'Photos': t('photos_step'),
    'Map': t('map_step'),
    'Review': t('review'),
  }
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<VehicleFormState>(initialState)
  const [customSafetyFeature, setCustomSafetyFeature] = useState("")
  const [customInteriorFeature, setCustomInteriorFeature] = useState("")
  const [customExteriorFeature, setCustomExteriorFeature] = useState("")
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

  // Same custom-feature pattern as the house/property wizard: type a value,
  // press Enter or "Add", and it is appended to the selected features.
  const addCustomFeatureValue = (
    field: "safetyFeatures" | "interiorFeatures" | "exteriorFeatures",
    value: string,
    setter: (v: string) => void,
  ) => {
    const trimmed = value.trim()
    if (trimmed && !form[field].includes(trimmed)) {
      set(field, [...form[field], trimmed])
    }
    setter("")
  }

  const next = () => {
    if (step === 5 && form.images.length < 3) {
      setError(t('at_least_3_continue_vehicle'))
      return
    }
    if (step === 6 && (form.latitude === 0 || form.longitude === 0)) {
      setError(t('select_location_map_continue_vehicle'))
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
          throw new Error(errData.message || t('upload_failed').replace('{name}', files[i].name))
        }

        const data = await res.json()
        uploadedUrls.push(data.url)
      }

      set("images", [...form.images, ...uploadedUrls])
    } catch (err: any) {
      setError(err.message || t('error_uploading_image'))
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async () => {
    if (form.images.length < 3) {
      setError(t('at_least_3_list_vehicle'))
      return
    }
    if (form.latitude === 0 || form.longitude === 0) {
      setError(t('select_location_map_vehicle'))
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
        throw new Error(data.message || t('failed_submit_vehicle'))
      }

      setSubmitted(true)
    } catch (err: any) {
      setError(err.message || t('submit_vehicle_error'))
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
        <h2 className="mt-5 text-2xl font-bold text-foreground">{t('vehicle_submitted')}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t('vehicle_submitted_note')}</p>
        <Button
          className="mt-6 rounded-xl font-semibold"
          onClick={() => {
            setForm(initialState)
            setStep(0)
            setSubmitted(false)
          }}
        >
          {t('post_another_vehicle')}
        </Button>
        <Link
          href="/agent/vehicles"
          className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          {t('my_vehicles')}
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">{t('post_vehicle')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('list_vehicle_note')}</p>
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
                  {stepLabels[s.label]}
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
        {/* Form panel */}
        <div className="rounded-2xl border border-border bg-card p-6">
          {step === 0 && (
            <div className="space-y-5">
              <SectionTitle icon={<Car className="h-5 w-5" />} title={t('basic_vehicle_info')} />
              <Field label={t('vehicle_title')} required>
                <Input
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder={t('ph_vehicle_title')}
                />
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label={t('listing_type')} required>
                  <SelectBox
                    value={form.listingType}
                    onChange={(v) => set("listingType", v)}
                    options={["For Sale", "For Rent", "Both"]}
                  />
                </Field>
                <Field label={t('vehicle_category')} required>
                  <SelectBox
                    value={form.vehicleCategory}
                    onChange={(v) => set("vehicleCategory", v)}
                    options={vehicleCategories}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label={t('make')} required>
                  <SelectBox
                    value={form.make}
                    onChange={(v) => set("make", v)}
                    options={vehicleMakes}
                  />
                </Field>
                <Field label={t('model')} required>
                  <Input
                    value={form.model}
                    onChange={(e) => set("model", e.target.value)}
                    placeholder={t('ph_model')}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label={t('trim_version')}>
                  <Input
                    value={form.trimVersion}
                    onChange={(e) => set("trimVersion", e.target.value)}
                    placeholder={t('ph_trim_version')}
                  />
                </Field>
                <Field label={t('vehicle_condition')} required>
                  <SelectBox
                    value={form.condition}
                    onChange={(v) => set("condition", v)}
                    options={vehicleConditions}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label={t('manufacturing_year')} required>
                  <Input
                    value={form.manufacturingYear}
                    onChange={(e) => set("manufacturingYear", e.target.value)}
                    placeholder="2020"
                  />
                </Field>
                <Field label={t('registration_year')}>
                  <Input
                    value={form.registrationYear}
                    onChange={(e) => set("registrationYear", e.target.value)}
                    placeholder="2020"
                  />
                </Field>
                <Field label={t('color')}>
                  <SelectBox
                    value={form.color}
                    onChange={(v) => set("color", v)}
                    options={colorOptions}
                  />
                </Field>
              </div>
              <Field label={t('country_of_origin')}>
                <SelectBox
                  value={form.countryOfOrigin}
                  onChange={(v) => set("countryOfOrigin", v)}
                  options={countryOfOriginOptions}
                />
              </Field>
              <Field label={t('description')}>
                <Textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder={t('ph_describe_vehicle')}
                />
              </Field>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <SectionTitle icon={<Settings className="h-5 w-5" />} title={t('technical_specs')} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label={t('fuel_type')}>
                  <SelectBox
                    value={form.fuelType}
                    onChange={(v) => set("fuelType", v)}
                    options={fuelTypes}
                  />
                </Field>
                <Field label={t('engine_size')}>
                  <Input
                    value={form.engineSize}
                    onChange={(e) => set("engineSize", e.target.value)}
                    placeholder={t('ph_engine_size')}
                  />
                </Field>
                <Field label={t('horsepower')}>
                  <Input
                    value={form.horsepower}
                    onChange={(e) => set("horsepower", e.target.value)}
                    placeholder={t('ph_horsepower')}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label={t('transmission')}>
                  <SelectBox
                    value={form.transmission}
                    onChange={(v) => set("transmission", v)}
                    options={transmissionTypes}
                  />
                </Field>
                <Field label={t('drivetrain')}>
                  <SelectBox
                    value={form.drivetrain}
                    onChange={(v) => set("drivetrain", v)}
                    options={drivetrainTypes}
                  />
                </Field>
                <Field label={t('cylinders')}>
                  <Input
                    value={form.cylinders}
                    onChange={(e) => set("cylinders", e.target.value)}
                    placeholder={t('ph_cylinders')}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label={t('seating_capacity')}>
                  <Input
                    value={form.seatingCapacity}
                    onChange={(e) => set("seatingCapacity", e.target.value)}
                    placeholder={t('ph_seating_capacity')}
                  />
                </Field>
                <Field label={t('doors')}>
                  <Input
                    value={form.doors}
                    onChange={(e) => set("doors", e.target.value)}
                    placeholder={t('ph_doors')}
                  />
                </Field>
                <Field label={t('mileage')}>
                  <Input
                    type="number"
                    value={form.mileage}
                    onChange={(e) => set("mileage", e.target.value)}
                    placeholder={t('ph_mileage')}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label={t('fuel_consumption')}>
                  <Input
                    value={form.fuelConsumption}
                    onChange={(e) => set("fuelConsumption", e.target.value)}
                    placeholder={t('ph_fuel_consumption')}
                  />
                </Field>
                <Field label={t('fuel_tank_capacity')}>
                  <Input
                    value={form.fuelTankCapacity}
                    onChange={(e) => set("fuelTankCapacity", e.target.value)}
                    placeholder={t('ph_fuel_tank_capacity')}
                  />
                </Field>
                <Field label={t('ground_clearance')}>
                  <Input
                    value={form.groundClearance}
                    onChange={(e) => set("groundClearance", e.target.value)}
                    placeholder={t('ph_ground_clearance')}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label={t('weight')}>
                  <Input
                    value={form.weight}
                    onChange={(e) => set("weight", e.target.value)}
                    placeholder={t('ph_weight')}
                  />
                </Field>
                <Field label={t('tire_size')}>
                  <Input
                    value={form.tireSize}
                    onChange={(e) => set("tireSize", e.target.value)}
                    placeholder={t('ph_tire_size')}
                  />
                </Field>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <SectionTitle icon={<Shield className="h-5 w-5" />} title={t('vehicle_condition_features')} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label={t('accident_free')}>
                  <SelectBox
                    value={form.accidentFree ? "Yes" : "No"}
                    onChange={(v) => set("accidentFree", v === "Yes")}
                    options={["Yes", "No"]}
                  />
                </Field>
                <Field label={t('service_history')}>
                  <SelectBox
                    value={form.serviceHistoryAvailable ? "Yes" : "No"}
                    onChange={(v) => set("serviceHistoryAvailable", v === "Yes")}
                    options={["Yes", "No"]}
                  />
                </Field>
                <Field label={t('ownership_count')}>
                  <Input
                    type="number"
                    value={form.ownershipCount}
                    onChange={(e) => set("ownershipCount", e.target.value)}
                    placeholder={t('ph_ownership_count')}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label={t('imported')}>
                  <SelectBox
                    value={form.imported ? "Yes" : "No"}
                    onChange={(v) => set("imported", v === "Yes")}
                    options={["Yes", "No"]}
                  />
                </Field>
                <Field label={t('locally_assembled')}>
                  <SelectBox
                    value={form.locallyAssembled ? "Yes" : "No"}
                    onChange={(v) => set("locallyAssembled", v === "Yes")}
                    options={["Yes", "No"]}
                  />
                </Field>
              </div>
              <Field label={t('accident_history')}>
                <Textarea
                  rows={3}
                  value={form.accidentHistory}
                  onChange={(e) => set("accidentHistory", e.target.value)}
                  placeholder={t('ph_describe_accident_history')}
                />
              </Field>

              <FeatureGroup
                title={t('safety_features')}
                options={safetyFeatureOptions}
                selected={form.safetyFeatures}
                onToggle={(f) => toggleArrayItem("safetyFeatures", f)}
                customValue={customSafetyFeature}
                onCustomChange={setCustomSafetyFeature}
                onCustomAdd={() => addCustomFeatureValue("safetyFeatures", customSafetyFeature, setCustomSafetyFeature)}
              />

              <FeatureGroup
                title={t('interior_features')}
                options={interiorFeatureOptions}
                selected={form.interiorFeatures}
                onToggle={(f) => toggleArrayItem("interiorFeatures", f)}
                customValue={customInteriorFeature}
                onCustomChange={setCustomInteriorFeature}
                onCustomAdd={() => addCustomFeatureValue("interiorFeatures", customInteriorFeature, setCustomInteriorFeature)}
              />

              <FeatureGroup
                title={t('exterior_features')}
                options={exteriorFeatureOptions}
                selected={form.exteriorFeatures}
                onToggle={(f) => toggleArrayItem("exteriorFeatures", f)}
                customValue={customExteriorFeature}
                onCustomChange={setCustomExteriorFeature}
                onCustomAdd={() => addCustomFeatureValue("exteriorFeatures", customExteriorFeature, setCustomExteriorFeature)}
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <SectionTitle icon={<DollarSign className="h-5 w-5" />} title={t('pricing_info')} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label={t('price_etb')} required>
                  <Input
                    type="number"
                    value={form.price}
                    onChange={(e) => set("price", e.target.value)}
                    placeholder={t('ph_price')}
                  />
                </Field>
                <Field label={t('price_type')}>
                  <SelectBox
                    value={form.priceType}
                    onChange={(v) => set("priceType", v)}
                    options={["Fixed Price", "Negotiable", "Starting From"]}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label={t('selling_price')}>
                  <Input
                    type="number"
                    value={form.sellingPrice}
                    onChange={(e) => set("sellingPrice", e.target.value)}
                    placeholder={t('ph_price')}
                  />
                </Field>
                <Field label={t('negotiable')}>
                  <SelectBox
                    value={form.negotiable ? "Yes" : "No"}
                    onChange={(v) => set("negotiable", v === "Yes")}
                    options={["Yes", "No"]}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label={t('financing_available')}>
                  <SelectBox
                    value={form.financingAvailable ? "Yes" : "No"}
                    onChange={(v) => set("financingAvailable", v === "Yes")}
                    options={["Yes", "No"]}
                  />
                </Field>
                <Field label={t('exchange_accepted')}>
                  <SelectBox
                    value={form.exchangeAccepted ? "Yes" : "No"}
                    onChange={(v) => set("exchangeAccepted", v === "Yes")}
                    options={["Yes", "No"]}
                  />
                </Field>
                <Field label={t('bank_loan')}>
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
                    <p className="mb-3 text-sm font-semibold text-foreground">{t('rental_info')}</p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Field label={t('daily_rate')}>
                      <Input
                        type="number"
                        value={form.dailyRate}
                        onChange={(e) => set("dailyRate", e.target.value)}
                        placeholder={t('ph_daily_rate')}
                      />
                    </Field>
                    <Field label={t('weekly_rate')}>
                      <Input
                        type="number"
                        value={form.weeklyRate}
                        onChange={(e) => set("weeklyRate", e.target.value)}
                        placeholder={t('ph_weekly_rate')}
                      />
                    </Field>
                    <Field label={t('monthly_rate')}>
                      <Input
                        type="number"
                        value={form.monthlyRate}
                        onChange={(e) => set("monthlyRate", e.target.value)}
                        placeholder={t('ph_monthly_rate')}
                      />
                    </Field>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Field label={t('security_deposit')}>
                      <Input
                        type="number"
                        value={form.securityDeposit}
                        onChange={(e) => set("securityDeposit", e.target.value)}
                        placeholder={t('ph_security_deposit')}
                      />
                    </Field>
                    <Field label={t('min_rental_days')}>
                      <Input
                        type="number"
                        value={form.minRentalDays}
                        onChange={(e) => set("minRentalDays", e.target.value)}
                        placeholder={t('ph_min_rental_days')}
                      />
                    </Field>
                    <Field label={t('max_rental_days')}>
                      <Input
                        type="number"
                        value={form.maxRentalDays}
                        onChange={(e) => set("maxRentalDays", e.target.value)}
                        placeholder={t('ph_max_rental_days')}
                      />
                    </Field>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Field label={t('driver_included')}>
                      <SelectBox
                        value={form.driverIncluded ? "Yes" : "No"}
                        onChange={(v) => set("driverIncluded", v === "Yes")}
                        options={["Yes", "No"]}
                      />
                    </Field>
                    <Field label={t('self_drive')}>
                      <SelectBox
                        value={form.selfDrive ? "Yes" : "No"}
                        onChange={(v) => set("selfDrive", v === "Yes")}
                        options={["Yes", "No"]}
                      />
                    </Field>
                    <Field label={t('fuel_policy')}>
                      <SelectBox
                        value={form.fuelPolicy}
                        onChange={(v) => set("fuelPolicy", v)}
                        options={["Full to Full", "Prepaid", "Included"]}
                      />
                    </Field>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Field label={t('mileage_limit')}>
                      <Input
                        value={form.mileageLimit}
                        onChange={(e) => set("mileageLimit", e.target.value)}
                        placeholder={t('ph_mileage_limit')}
                      />
                    </Field>
                    <Field label={t('extra_km_charge')}>
                      <Input
                        type="number"
                        value={form.extraKmCharge}
                        onChange={(e) => set("extraKmCharge", e.target.value)}
                        placeholder={t('ph_extra_km_charge')}
                      />
                    </Field>
                    <Field label={t('delivery_available')}>
                      <SelectBox
                        value={form.deliveryAvailable ? "Yes" : "No"}
                        onChange={(v) => set("deliveryAvailable", v === "Yes")}
                        options={["Yes", "No"]}
                      />
                    </Field>
                  </div>
                  <Field label={t('airport_pickup')}>
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
              <SectionTitle icon={<FileCheck className="h-5 w-5" />} title={t('location_legal_info')} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label={t('region')}>
                  <Input
                    value={form.region}
                    onChange={(e) => set("region", e.target.value)}
                    placeholder={t('ph_region_city')}
                  />
                </Field>
                <Field label={t('city')}>
                  <Input
                    value={form.city}
                    onChange={(e) => set("city", e.target.value)}
                    placeholder={t('ph_region_city')}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label={t('sub_city')}>
                  <Input
                    value={form.subCity}
                    onChange={(e) => set("subCity", e.target.value)}
                    placeholder={t('ph_sub_city')}
                  />
                </Field>
                <Field label={t('woreda')}>
                  <Input
                    value={form.woreda}
                    onChange={(e) => set("woreda", e.target.value)}
                    placeholder={t('ph_woreda')}
                  />
                </Field>
              </div>
              <Field label={t('pickup_address')}>
                <Input
                  value={form.pickupAddress}
                  onChange={(e) => set("pickupAddress", e.target.value)}
                  placeholder={t('ph_pickup_address')}
                />
              </Field>

              <div className="border-t border-border pt-5">
                <p className="mb-3 text-sm font-semibold text-foreground">{t('legal_documents')}</p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label={t('region_registration')}>
                  <Input
                    value={form.regionRegistration}
                    onChange={(e) => set("regionRegistration", e.target.value)}
                    placeholder={t('ph_region_city')}
                  />
                </Field>
                <Field label={t('ownership_certificate')}>
                  <SelectBox
                    value={form.ownershipCertificate ? "Yes" : "No"}
                    onChange={(v) => set("ownershipCertificate", v === "Yes")}
                    options={["Yes", "No"]}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label={t('road_fund_paid')}>
                  <SelectBox
                    value={form.roadFundPaid ? "Yes" : "No"}
                    onChange={(v) => set("roadFundPaid", v === "Yes")}
                    options={["Yes", "No"]}
                  />
                </Field>
                <Field label={t('insurance_valid')}>
                  <SelectBox
                    value={form.insuranceValid ? "Yes" : "No"}
                    onChange={(v) => set("insuranceValid", v === "Yes")}
                    options={["Yes", "No"]}
                  />
                </Field>
                <Field label={t('inspection_certificate')}>
                  <SelectBox
                    value={form.inspectionCertificate ? "Yes" : "No"}
                    onChange={(v) => set("inspectionCertificate", v === "Yes")}
                    options={["Yes", "No"]}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label={t('customs_clearance')}>
                  <SelectBox
                    value={form.customsClearance ? "Yes" : "No"}
                    onChange={(v) => set("customsClearance", v === "Yes")}
                    options={["Yes", "No"]}
                  />
                </Field>
                <Field label={t('duty_paid')}>
                  <SelectBox
                    value={form.dutyPaid ? "Yes" : "No"}
                    onChange={(v) => set("dutyPaid", v === "Yes")}
                    options={["Yes", "No"]}
                  />
                </Field>
                 <Field label={t('plate_type')}>
                   <SelectBox
                     value={form.plateType}
                     onChange={(v) => set("plateType", v)}
                     options={["Code 1", "Code 2", "Code 3", "Code 4", "Code 5"]}
                   />
                 </Field>
              </div>
              <Field label={t('plate_number')}>
                <Input
                  value={form.plateNumber}
                  onChange={(e) => set("plateNumber", e.target.value)}
                  placeholder={t('ph_plate_number')}
                />
              </Field>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-5">
              <SectionTitle icon={<Image className="h-5 w-5" />} title={t('photos_media_title')} />
              <div>
                <Label className="mb-2 block font-semibold text-slate-800">
                  {t('vehicle_photos')} <span className="text-red-500">* {t('at_least_3')}</span>
                </Label>

                <label className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-12 text-center transition hover:bg-slate-50 cursor-pointer">
                  {uploadingImage ? (
                    <>
                      <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
                      <span className="text-sm font-semibold text-slate-700">{t('uploading_photos')}</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-orange-500" />
                      <span className="text-sm font-semibold text-slate-700">{t('click_upload_photos')}</span>
                      <span className="text-xs text-slate-400">{t('select_images')}</span>
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
                      {form.images.length} {t('photos_added')}{" "}
                      {form.images.length < 3 && '(' + t('need_more') + ' ' + (3 - form.images.length) + ')'}
                    </p>

                    <div className="grid grid-cols-3 gap-3">
                      {form.images.map((url, idx) => (
                        <div
                          key={idx}
                          className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 group/item shadow-sm"
                        >
                          <img src={url} alt={t('upload') + ' ' + (idx + 1)} className="w-full h-full object-cover" />
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

              <Field label={t('video_url')}>
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
              <SectionTitle icon={<MapIcon className="h-5 w-5" />} title={t('vehicle_location_map')} />
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
                <Field label={t('latitude')}>
                  <Input
                    type="number"
                    step="any"
                    value={form.latitude || ""}
                    onChange={(e) => set("latitude", parseFloat(e.target.value) || 0)}
                    placeholder={t('ph_latitude')}
                  />
                </Field>
                <Field label={t('longitude')}>
                  <Input
                    type="number"
                    step="any"
                    value={form.longitude || ""}
                    onChange={(e) => set("longitude", parseFloat(e.target.value) || 0)}
                    placeholder={t('ph_longitude')}
                  />
                </Field>
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-5">
              <SectionTitle icon={<ClipboardCheck className="h-5 w-5" />} title={t('review_submit_title')} />
              <p className="text-sm text-muted-foreground">{t('review_vehicle_note')}</p>

              <ReviewGroup title={t('basic_info')}>
                <ReviewRow label={t('vehicle_title')} value={form.title || t('no_title_set')} />
                <ReviewRow label={t('listing_type')} value={tv(form.listingType)} />
                <ReviewRow label={t('vehicle_category')} value={tv(form.vehicleCategory)} />
                <ReviewRow label={t('make_model')} value={`${form.make} ${form.model}`.trim()} />
                <ReviewRow label={t('trim_version')} value={form.trimVersion} />
                <ReviewRow label={t('manufacturing_year')} value={form.manufacturingYear} />
                <ReviewRow label={t('registration_year')} value={form.registrationYear} />
                <ReviewRow label={t('color')} value={form.color} />
                <ReviewRow label={t('country_of_origin')} value={form.countryOfOrigin} />
                <ReviewRow label={t('vehicle_condition')} value={tv(form.condition)} />
              </ReviewGroup>

              <ReviewGroup title={t('technical_specs')}>
                <ReviewRow label={t('fuel_type')} value={form.fuelType} />
                <ReviewRow label={t('engine_size')} value={form.engineSize ? `${form.engineSize} L` : undefined} />
                <ReviewRow label={t('horsepower')} value={form.horsepower ? `${form.horsepower} hp` : undefined} />
                <ReviewRow label={t('transmission')} value={form.transmission} />
                <ReviewRow label={t('drivetrain')} value={form.drivetrain} />
                <ReviewRow label={t('cylinders')} value={form.cylinders} />
                <ReviewRow label={t('seating_capacity')} value={form.seatingCapacity} />
                <ReviewRow label={t('doors')} value={form.doors} />
                <ReviewRow label={t('mileage')} value={form.mileage ? `${Number(form.mileage).toLocaleString()} km` : undefined} />
                <ReviewRow label={t('fuel_consumption')} value={form.fuelConsumption ? `${form.fuelConsumption} L/100km` : undefined} />
                <ReviewRow label={t('fuel_tank_capacity')} value={form.fuelTankCapacity ? `${form.fuelTankCapacity} L` : undefined} />
                <ReviewRow label={t('ground_clearance')} value={form.groundClearance ? `${form.groundClearance} mm` : undefined} />
                <ReviewRow label={t('weight')} value={form.weight ? `${form.weight} kg` : undefined} />
                <ReviewRow label={t('tire_size')} value={form.tireSize} />
              </ReviewGroup>

              <ReviewGroup title={t('vehicle_condition_features')}>
                <ReviewRow label={t('accident_free')} value={form.accidentFree ? t('yes') : t('no')} />
                <ReviewRow label={t('service_history')} value={form.serviceHistoryAvailable ? t('yes') : t('no')} />
                <ReviewRow label={t('ownership_count')} value={form.ownershipCount} />
                <ReviewRow label={t('imported')} value={form.imported ? t('yes') : t('no')} />
                <ReviewRow label={t('locally_assembled')} value={form.locallyAssembled ? t('yes') : t('no')} />
                <ReviewRow label={t('accident_history')} value={form.accidentHistory} />
              </ReviewGroup>

              {[
                { label: t('safety_features'), items: form.safetyFeatures },
                { label: t('interior_features'), items: form.interiorFeatures },
                { label: t('exterior_features'), items: form.exteriorFeatures },
              ].map((grp) => (
                <ReviewGroup key={grp.label} title={grp.label}>
                  {grp.items.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {grp.items.map((f) => (
                        <span key={f} className="rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground">
                          {f}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t('not_specified')}</p>
                  )}
                </ReviewGroup>
              ))}

              <ReviewGroup title={t('pricing_info')}>
                <ReviewRow label={t('price_etb')} value={form.price ? `${formatPrice(Number(form.price))} ETB` : t('price_not_set')} />
                <ReviewRow label={t('price_type')} value={tv(form.priceType)} />
                <ReviewRow label={t('selling_price')} value={form.sellingPrice ? `${formatPrice(Number(form.sellingPrice))} ETB` : undefined} />
                <ReviewRow label={t('negotiable')} value={form.negotiable ? t('yes') : t('no')} />
              </ReviewGroup>

              <ReviewGroup title={t('location_legal_info')}>
                <ReviewRow label={t('region')} value={form.region} />
                <ReviewRow label={t('city')} value={form.city} />
                <ReviewRow label={t('sub_city')} value={form.subCity} />
                <ReviewRow label={t('woreda')} value={form.woreda} />
                <ReviewRow label={t('plate_type')} value={form.plateType} />
                <ReviewRow label={t('plate_number')} value={form.plateNumber} />
              </ReviewGroup>

              <ReviewGroup title={t('photos_media_title')}>
                <p className="text-sm text-muted-foreground">
                  {form.images.length} {t('photos_plural')} · {form.videoUrl ? t('video_attached') : t('no_video')}
                </p>
              </ReviewGroup>
            </div>
          )}

          {/* Nav buttons */}
          <div className="mt-8 flex items-center justify-between border-t border-border pt-5">
            <Button variant="outline" onClick={back} disabled={step === 0 || submitting} className="rounded-xl">
              <ArrowLeft className="h-4 w-4" /> {t('back')}
            </Button>
            {step < steps.length - 1 ? (
              <Button
                onClick={next}
                disabled={(step === 5 && form.images.length < 3) || (step === 6 && (form.latitude === 0 || form.longitude === 0))}
                className="rounded-xl font-semibold"
              >
                {t('next')} <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded-xl font-semibold bg-orange-500 hover:bg-orange-600 text-white min-h-[44px]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> {t('submitting')}
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" /> {t('submit_vehicle')}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Live summary */}
        <aside className="rounded-2xl border border-border bg-card p-5 lg:sticky lg:top-24 lg:self-start">
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Car className="h-4 w-4 text-primary" /> {t('vehicle_summary')}
          </p>
          <dl className="mt-4 space-y-3 text-sm">
            <SummaryRow label={t('category')} value={form.vehicleCategory ? tv(form.vehicleCategory) : t('not_set')} />
            <SummaryRow label={t('make_model')} value={form.make && form.model ? form.make + ' ' + form.model : t('not_set')} />
            <SummaryRow label={t('year')} value={form.manufacturingYear || t('not_set')} />
            <SummaryRow label={t('listing')} value={tv(form.listingType)} />
            <SummaryRow
              label={t('price')}
              value={form.price ? formatPrice(Number(form.price)) + ' ETB' : t('not_set')}
              highlight={!!form.price}
            />
            <SummaryRow label={t('condition')} value={form.condition ? tv(form.condition) : t('not_set')} />
            <SummaryRow label={t('fuel')} value={form.fuelType ? tv(form.fuelType) : t('not_set')} />
            <SummaryRow label={t('transmission')} value={form.transmission ? tv(form.transmission) : t('not_set')} />
            <SummaryRow label={t('mileage')} value={form.mileage ? Number(form.mileage).toLocaleString() + ' km' : t('not_set')} />
            <SummaryRow label={t('location')} value={form.subCity || form.city || t('not_set')} />
            <SummaryRow label={t('photos')} value={form.images.length > 0 ? form.images.length + ' ' + t('uploaded') : t('none')} />
            <SummaryRow
              label={t('features')}
              value={
                form.safetyFeatures.length + form.interiorFeatures.length + form.exteriorFeatures.length > 0
                  ? (form.safetyFeatures.length + form.interiorFeatures.length + form.exteriorFeatures.length) + ' ' + t('selected')
                  : t('none')
              }
            />
          </dl>
        </aside>
      </div>
    </div>
  )
}

// A collapsible label/value row used in the review step. Blank values are
// skipped so only information the user actually entered is shown.
function ReviewRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <div className="flex items-start justify-between gap-3 py-1">
      <span className="shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium text-foreground">{value}</span>
    </div>
  )
}

function ReviewGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-muted/50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <div className="mt-2 space-y-1">{children}</div>
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

// Feature chips with an "Add Custom Feature" input — the same UX pattern the
// house/property wizard uses. Custom values are shown as selected chips and
// can be removed by clicking them again.
function FeatureGroup({
  title,
  options,
  selected,
  onToggle,
  customValue,
  onCustomChange,
  onCustomAdd,
}: {
  title: string
  options: string[]
  selected: string[]
  onToggle: (item: string) => void
  customValue: string
  onCustomChange: (v: string) => void
  onCustomAdd: () => void
}) {
  const { t } = useI18n()
  const customSelected = selected.filter((f) => !options.includes(f))
  return (
    <div>
      <p className="mb-3 text-sm font-semibold text-foreground">{title}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => onToggle(f)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm transition-colors",
              selected.includes(f)
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:border-primary",
            )}
          >
            {f}
          </button>
        ))}
        {customSelected.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => onToggle(f)}
            className="rounded-full border border-primary bg-primary text-primary-foreground px-3 py-1.5 text-sm transition-colors"
          >
            {f}
          </button>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <Input
          value={customValue}
          onChange={(e) => onCustomChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing) {
              e.preventDefault()
              onCustomAdd()
            }
          }}
          placeholder={t('add_custom_feature')}
        />
        <Button type="button" onClick={onCustomAdd} className="shrink-0 rounded-lg">
          {t('add')} <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
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
  const { tv } = useI18n()
  return (
    <Select value={value} onValueChange={(v) => onChange(v ?? "")}>
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {tv(o)}
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

