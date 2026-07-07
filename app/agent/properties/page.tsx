import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Building2, PlusCircle, Pencil, Trash2, ExternalLink, Calendar, Search, MapPin } from 'lucide-react'
import { getServerSession } from '@/lib/auth-session'
import { connectToDatabase } from '@/lib/db'
import { PropertyModel } from '@/lib/models/property'
import { formatPrice } from '@/lib/data'
import { StatusBadge } from '@/components/ui/status-badge'
import { PropertyDeleteButton } from './delete-button'

export default async function AgentPropertiesPage() {
  const session = await getServerSession()
  if (!session?.userId) {
    redirect('/login')
  }

  await connectToDatabase()
  const properties = await PropertyModel.find({ agentId: session.userId })
    .sort({ createdAt: -1 })
    .lean()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">My Listed Properties</h1>
          <p className="text-sm text-slate-500">Manage, edit, or delete your existing listings.</p>
        </div>
        <Link
          href={session.user.status === 'Approved' ? '/agent/post' : '#'}
          className={`inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 ${session.user.status !== 'Approved' ? 'cursor-not-allowed opacity-50' : ''}`}
        >
          <PlusCircle className="h-4 w-4" /> Post a Property
        </Link>
      </div>

      {session.user.status !== 'Approved' && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-semibold">Account Pending Approval</p>
          <p className="mt-1">You cannot post new listings or publish changes until your agent application has been approved by the administrators.</p>
        </div>
      )}

      {properties.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-slate-200 bg-white py-16 text-slate-400 shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
            <Building2 className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-700">No properties listed yet</h2>
          <p className="text-sm max-w-xs text-center">Get started by listing your first property on DelaHarme portal.</p>
          {session.user.status === 'Approved' && (
            <Link href="/agent/post" className="mt-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition">
              Create Listing
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p: any) => {
            const firstImage = p.images?.[0] || '/placeholder-property.jpg'
            return (
              <div key={p._id.toString()} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                  <img
                    src={firstImage}
                    alt={p.title}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  <div className="absolute left-3 top-3">
                    <StatusBadge status={p.status} />
                  </div>
                  <div className="absolute right-3 top-3 rounded-full bg-slate-900/70 px-2.5 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
                    {p.listingType}
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                    <MapPin className="h-3 w-3" />
                    <span>{p.city}, {p.region}</span>
                  </div>
                  <h3 className="mt-2 font-bold text-slate-800 line-clamp-1">{p.title}</h3>
                  <p className="mt-1 text-lg font-extrabold text-orange-600">
                    {formatPrice(p.price)} ETB <span className="text-xs font-medium text-slate-400">{p.priceType}</span>
                  </p>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                    <div className="flex gap-1">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">{p.bedrooms} Beds</span>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">{p.bathrooms} Baths</span>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">{p.area} m²</span>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Link
                      href={`/listings/${p._id.toString()}`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> View
                    </Link>
                    <PropertyDeleteButton id={p._id.toString()} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
