"use client"

import { getApiUrl } from '@/lib/get-api-url'

import { useState, useEffect, Suspense, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Car, Loader2, Send, AlertCircle, ChevronLeft } from "lucide-react"
import { useAuth } from "@/components/auth/auth-guard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import toast from "react-hot-toast"


export default function EditVehiclePageWrapper() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    }>
      <EditVehiclePage />
    </Suspense>
  )
}

function EditVehiclePage() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const router = useRouter()
  const { getToken } = useAuth()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [rejectionReason, setRejectionReason] = useState("")

  const [title, setTitle] = useState("")
  const [make, setMake] = useState("")
  const [model, setModel] = useState("")
  const [manufacturingYear, setManufacturingYear] = useState("")
  const [price, setPrice] = useState("")
  const [mileage, setMileage] = useState("")
  const [description, setDescription] = useState("")
  const [images, setImages] = useState<string[]>([])

  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const token = await getToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [getToken])

  useEffect(() => {
    if (!id) {
      toast.error("No vehicle ID provided.")
      router.push("/agent/vehicles")
      return
    }

    async function fetchVehicle() {
      try {
        const res = await fetch(`${getApiUrl()}/api/vehicles/${id}`)
        if (!res.ok) throw new Error("Not found")
        const data = await res.json()
        const v = data.vehicle
        setTitle(v.title || "")
        setMake(v.make || "")
        setModel(v.vehicleModel || v.model || "")
        setManufacturingYear(String(v.manufacturingYear || ""))
        setPrice(String(v.price || ""))
        setMileage(String(v.mileage || ""))
        setDescription(v.description || "")
        setImages(v.images || [])
        setRejectionReason(v.rejectionReason || "")
      } catch {
        toast.error("Failed to load vehicle.")
        router.push("/agent/vehicles")
      } finally {
        setLoading(false)
      }
    }
    fetchVehicle()
  }, [id, router])

  async function handleSubmit() {
    if (!title.trim()) { setError("Title is required."); return }
    setError("")
    setSubmitting(true)
    try {
      const authHeaders = await getAuthHeaders()
      const res = await fetch(`${getApiUrl()}/api/vehicles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          title,
          vehicleModel: model,
          manufacturingYear: Number(manufacturingYear) || undefined,
          price: Number(price) || 0,
          mileage: mileage ? Number(mileage) : undefined,
          description,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || "Failed to update vehicle")
      }
      toast.success("Vehicle updated successfully! It will be re-reviewed.")
      router.push("/agent/vehicles")
    } catch (err: any) {
      setError(err.message || "Something went wrong.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <Link
        href="/agent/vehicles"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-orange-600 transition"
      >
        <ChevronLeft className="h-4 w-4" /> Back to My Vehicles
      </Link>

      {rejectionReason && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-bold text-red-700 uppercase tracking-wider">Why was this listing rejected?</p>
            <p className="mt-1 text-sm text-red-600">{rejectionReason}</p>
          </div>
        </div>
      )}

      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900">Edit Vehicle</h1>
        <p className="mt-1 text-sm text-slate-500">Update your vehicle listing based on the rejection feedback above</p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm space-y-5">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        <div className="space-y-2">
          <Label>Title *</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Make</Label>
            <Input value={make} disabled className="bg-slate-50" />
          </div>
          <div className="space-y-2">
            <Label>Model</Label>
            <Input value={model} onChange={(e) => setModel(e.target.value)} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Year</Label>
            <Input value={manufacturingYear} onChange={(e) => setManufacturingYear(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Price (ETB)</Label>
            <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Mileage (km)</Label>
            <Input type="number" value={mileage} onChange={(e) => setMileage(e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 pt-5">
          <Button variant="outline" onClick={() => router.push("/agent/vehicles")} className="rounded-full">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-full bg-orange-500 text-white hover:bg-orange-600 px-6"
          >
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Update Vehicle
          </Button>
        </div>
      </div>
    </div>
  )
}

