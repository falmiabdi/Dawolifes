import { NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth-session'
import { connectToDatabase } from '@/lib/db'
import { UserModel } from '@/lib/models/user'

export async function PUT(request: Request) {
  try {
    // Read the session from the cookie
    const session = await getSessionFromRequest(request)
    console.log('[Profile API] Session:', session ? 'found' : 'null', session?.userId ? `userId: ${session.userId}` : '')

    if (!session?.userId) {
      return NextResponse.json({ message: 'Unauthorized — please log in again.' }, { status: 401 })
    }

    const body = await request.json()
    const { profilePhoto } = body

    if (!profilePhoto) {
      return NextResponse.json({ message: 'Profile photo URL is required' }, { status: 400 })
    }

    await connectToDatabase()
    const updatedUser = await UserModel.findByIdAndUpdate(
      session.userId,
      { profilePhoto },
      { new: true }
    )

    if (!updatedUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    console.log('[Profile API] Photo updated for user:', session.userId)

    return NextResponse.json({
      message: 'Profile photo updated successfully',
      user: { profilePhoto: updatedUser.profilePhoto },
      ok: true,
    })
  } catch (error: any) {
    console.error('[Profile API Error]', error)
    return NextResponse.json({ message: error.message || 'Server error' }, { status: 500 })
  }
}
