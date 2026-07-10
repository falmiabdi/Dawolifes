import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { properties as mockProperties } from "@/lib/data"
import { PropertyCard } from "@/components/property-card"
import { connectToDatabase } from "@/lib/db"
import { PropertyModel } from "@/lib/models/property"
import "@/lib/models/user" // Pre-register User model for populate query to work

export async function LatestProperties() {
  let dbPropertiesTransformed: any[] = []
  
  try {
    await connectToDatabase()
    // Fetch approved properties from database
    const dbProperties = await PropertyModel.find({ status: { $in: ['Approved', 'Pending'] } }) // Show pending/approved for preview purposes or approved
      .populate('agentId')
      .sort({ createdAt: -1 })
      .limit(6)
      .lean()

    dbPropertiesTransformed = dbProperties.map((p: any) => ({
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
      images: p.images && p.images.length > 0 ? p.images : ["/placeholder-property.jpg"],
      agent: {
        id: p.agentId?._id?.toString() || 'unknown',
        name: p.agentId?.fullName || p.agentId?.username || 'Unknown Agent',
        role: p.agentId?.role === 'admin' ? 'Administrator' : 'Real Estate Agent',
        phone: p.agentId?.ethPhone || p.agentId?.safaricomPhone || '+251 900 000 000',
        avatar: p.agentId?.profilePhoto || '/placeholder-user.jpg', // Dynamic Cloudinary Agent photo!
      }
    }))
  } catch (err) {
    console.error('[LatestProperties DB Load Error]', err)
  }

  // Combine database properties with mock properties (DB ones first)
  const combinedProperties = [...dbPropertiesTransformed, ...mockProperties].slice(0, 9)

  return (
    <section id="listings" className="bg-muted/40 py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-foreground md:text-2xl">Latest Properties</h2>
            <p className="mt-1 text-sm text-muted-foreground">Newly listed homes and lands across Ethiopia</p>
          </div>
          <Link
            href="#listings"
            className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {combinedProperties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      </div>
    </section>
  )
}
