import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    if (!cloudName || !apiKey || !apiSecret) {
      console.error('[Agent Upload] Missing Cloudinary credentials')
      return NextResponse.json(
        { message: 'Cloudinary configuration is missing on the server.' },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ message: 'No file uploaded' }, { status: 400 })
    }

    console.log('[Agent Upload] File:', file.name, '|', file.type, '|', file.size, 'bytes')

    // Convert file to buffer for Cloudinary
    const buffer = Buffer.from(await file.arrayBuffer())

    // Build Cloudinary signed upload
    const timestamp = Math.round(Date.now() / 1000).toString()
    const stringToSign = `timestamp=${timestamp}${apiSecret}`
    const signature = crypto.createHash('sha1').update(stringToSign).digest('hex')

    // Send as multipart form with blob
    const cloudinaryForm = new FormData()
    const blob = new Blob([buffer], { type: file.type })
    cloudinaryForm.append('file', blob, file.name)
    cloudinaryForm.append('api_key', apiKey)
    cloudinaryForm.append('timestamp', timestamp)
    cloudinaryForm.append('signature', signature)

    const isVideo = file.type.startsWith('video/')
    const uploadType = isVideo ? 'video' : 'image'
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${uploadType}/upload`
    console.log('[Agent Upload] Uploading to Cloudinary (type:', uploadType + ')...')

    const cloudinaryRes = await fetch(cloudinaryUrl, {
      method: 'POST',
      body: cloudinaryForm,
    })

    const result = await cloudinaryRes.json()

    if (!cloudinaryRes.ok) {
      console.error('[Agent Upload] Cloudinary error:', JSON.stringify(result))
      return NextResponse.json(
        { message: result.error?.message || 'Cloudinary upload failed' },
        { status: 400 }
      )
    }

    console.log('[Agent Upload] Success:', result.secure_url)

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
      ok: true,
    })
  } catch (error: any) {
    console.error('[Agent Upload] Server error:', error)
    return NextResponse.json(
      { message: error.message || 'Server error during upload' },
      { status: 500 }
    )
  }
}
