import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { PropertyCard } from "@/components/property-card"
import { connectToDatabase } from "@/lib/db"
import { PropertyModel } from "@/lib/models/property"
import "@/lib/models/user"

export async function LatestProperties() {
  let dbPropertiesTransformed: any[] = []
  
  try {
    await connectToDatabase()
    const dbProperties = await PropertyModel.find({ status: 'Approved' })
      .populate('agentId')
      .sort({ createdAt: -1 })
      .lean()

    dbPropertiesTransformed = dbProperties
      .filter((p: any) => p.agentId && p.agentId.status !== 'Suspended')
      .map((p: any) => ({
      id: p._id.toString(),
      title: p.title,
      type: p.type,
      listingType: p.listingType,
      price: p.price,
      priceType: p.priceType,
      region: p.region,
      city: p.city,
      subCity: p.subCity || '',
      woreda: p.woreda || '',
      kebele: p.kebele || '',
      parcel: p.parcel || '',
      block: p.block || '',
      homeNo: p.homeNo || '',
      area: p.area || 0,
      bedrooms: p.bedrooms || 0,
      bathrooms: p.bathrooms || 0,
      condition: p.condition || 'Finished',
      legalizedYear: p.legalizedYear || 2024,
      description: p.description || '',
      features: p.features || [],
      images: p.images && p.images.length > 0 ? p.images : ["/placeholder.jpg"],
      agent: {
        id: p.agentId?._id?.toString() || 'unknown',
        name: p.agentId?.fullName || p.agentId?.username || 'Unknown Agent',
        role: p.agentId?.role === 'admin' ? 'Administrator' : 'Real Estate Agent',
        phone: p.agentId?.ethPhone || p.agentId?.safaricomPhone || '+251 900 000 000',
        avatar: p.agentId?.profilePhoto || '/placeholder-user.jpg',
      }
    }))
  } catch (err) {
    console.error('[LatestProperties DB Load Error]', err)
  }

  return (
    <section id="listings" className="bg-muted/40 py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-foreground md:text-2xl">Latest Properties</h2>
            <p className="mt-1 text-sm text-muted-foreground">Newly listed homes and lands across Ethiopia</p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {dbPropertiesTransformed.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>

        {dbPropertiesTransformed.length === 0 && (
          <div className="mt-12 text-center text-muted-foreground">
            <p className="text-lg font-semibold">No properties listed yet</p>
            <p className="mt-1 text-sm">Check back soon for new listings.</p>
          </div>
        )}
      </div>
    </section>
  )
}
