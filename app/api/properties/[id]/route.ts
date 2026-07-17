import { NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth-session'
import { connectToDatabase } from '@/lib/db'
import { PropertyModel } from '@/lib/models/property'
import { UserModel } from '@/lib/models/user'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session?.userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    await connectToDatabase()

    const property = await PropertyModel.findById(id)
    if (!property) {
      return NextResponse.json({ message: 'Property not found.' }, { status: 404 })
    }

    const user = await UserModel.findById(session.userId).lean()
    if (!user) {
      return NextResponse.json({ message: 'User not found.' }, { status: 404 })
    }

    const body = await request.json()

    // If user is Admin, they can update the status
    if (user.role === 'admin') {
      if (body.status && ['Pending', 'Approved', 'Rejected'].includes(body.status)) {
        property.status = body.status
        if (body.status === 'Rejected') {
          property.rejectionReason = body.rejectionReason || ''
        } else {
          property.rejectionReason = ''
        }
      }
    } else {
      // If user is Agent, they can only edit if it is their property and they are approved
      if (property.agentId.toString() !== session.userId) {
        return NextResponse.json({ message: 'Access denied.' }, { status: 403 })
      }
      if (user.status !== 'Approved') {
        return NextResponse.json({ message: 'Your account is not approved.' }, { status: 403 })
      }

      // Fields agents can update
      const allowedFields = [
        'title', 'type', 'listingType', 'price', 'priceType', 'region', 'city',
        'subCity', 'woreda', 'kebele', 'parcel', 'block', 'homeNo', 'area',
        'bedrooms', 'bathrooms', 'condition', 'legalizedYear', 'description', 'videoUrl',
        'features', 'images', 'latitude', 'longitude', 'locationDocument'
      ]

      for (const field of allowedFields) {
        if (body[field] !== undefined) {
          property[field] = body[field]
        }
      }
      // Whenever agent edits their listing, it goes back to Pending review
      property.status = 'Pending'
    }

    await property.save()
    return NextResponse.json({ property, ok: true })
  } catch (error: any) {
    console.error('PATCH /api/properties error:', error)
    return NextResponse.json({ message: error.message || 'Server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session?.userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    await connectToDatabase()

    const property = await PropertyModel.findById(id)
    if (!property) {
      return NextResponse.json({ message: 'Property not found.' }, { status: 404 })
    }

    const user = await UserModel.findById(session.userId).lean()
    if (!user) {
      return NextResponse.json({ message: 'User not found.' }, { status: 404 })
    }

    // Only Admin or the owning Agent can delete the listing
    if (user.role !== 'admin' && property.agentId.toString() !== session.userId) {
      return NextResponse.json({ message: 'Access denied.' }, { status: 403 })
    }

    await PropertyModel.findByIdAndDelete(id)
    return NextResponse.json({ message: 'Property listing deleted successfully.', ok: true })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Server error' }, { status: 500 })
  }
}
