import { NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth-session'
import { connectToDatabase } from '@/lib/db'
import { PropertyModel } from '@/lib/models/property'
import { UserModel } from '@/lib/models/user'

export async function GET(request: Request) {
  try {
    await connectToDatabase()
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agentId')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const query: Record<string, any> = {}

    if (agentId) {
      query.agentId = agentId
    }
    if (status && status !== 'all') {
      query.status = status
    }
    if (search) {
      query.title = { $regex: search, $options: 'i' }
    }

    const properties = await PropertyModel.find(query)
      .sort({ createdAt: -1 })
      .populate('agentId', 'username email fullName ethPhone status')
      .lean()

    return NextResponse.json({ properties })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session?.userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    await connectToDatabase()
    const user = await UserModel.findById(session.userId).lean()
    if (!user || user.role !== 'agent') {
      return NextResponse.json({ message: 'Only agents can list properties.' }, { status: 403 })
    }

    if (user.status !== 'Approved') {
      return NextResponse.json({ message: 'Your agent account must be Approved to list properties.' }, { status: 403 })
    }

    const body = await request.json()

    if (!body.title || !body.type || !body.listingType || !body.price || !body.region || !body.city) {
      return NextResponse.json({ message: 'Missing required fields.' }, { status: 400 })
    }

    const property = await PropertyModel.create({
      title: body.title,
      type: body.type,
      listingType: body.listingType,
      price: Number(body.price),
      priceType: body.priceType || 'Fixed Price',
      region: body.region,
      city: body.city,
      subCity: body.subCity || '',
      woreda: body.woreda || '',
      kebele: body.kebele || '',
      parcel: body.parcel || '',
      block: body.block || '',
      homeNo: body.homeNo || '',
      area: Number(body.area) || 0,
      bedrooms: Number(body.bedrooms) || 0,
      bathrooms: Number(body.bathrooms) || 0,
      condition: body.condition || 'Finished',
      legalizedYear: Number(body.legalizedYear) || new Date().getFullYear(),
      description: body.description || '',
      features: body.features || [],
      images: body.images || [],
      videoUrl: body.videoUrl || '',
      agentId: session.userId,
      status: 'Pending', // All new property listings default to Pending review
    })

    return NextResponse.json({ property, ok: true })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Server error' }, { status: 500 })
  }
}
