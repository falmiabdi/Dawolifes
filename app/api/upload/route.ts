import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    console.log('[Upload API] Cloud name:', cloudName ? 'set' : 'MISSING')
    console.log('[Upload API] API key:', apiKey ? 'set' : 'MISSING')
    console.log('[Upload API] API secret:', apiSecret ? 'set' : 'MISSING')

    if (!cloudName || !apiKey || !apiSecret) {
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

    console.log('[Upload API] File received:', file.name, file.type, file.size, 'bytes')

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Build timestamp and signature for Cloudinary signed upload
    const timestamp = Math.round(Date.now() / 1000).toString()

    // Cloudinary signature: SHA1 of "timestamp=<ts><api_secret>"
    const stringToSign = `timestamp=${timestamp}${apiSecret}`
    const signature = crypto.createHash('sha1').update(stringToSign).digest('hex')

    console.log('[Upload API] Timestamp:', timestamp)
    console.log('[Upload API] Signature generated:', signature.substring(0, 10) + '...')

    // Use multipart form with the actual file buffer (not base64)
    const cloudinaryForm = new FormData()
    const blob = new Blob([buffer], { type: file.type })
    cloudinaryForm.append('file', blob, file.name)
    cloudinaryForm.append('api_key', apiKey)
    cloudinaryForm.append('timestamp', timestamp)
    cloudinaryForm.append('signature', signature)

    const isVideo = file.type.startsWith('video/')
    const uploadType = isVideo ? 'video' : 'image'
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${uploadType}/upload`
    console.log('[Upload API] Sending to Cloudinary:', cloudinaryUrl, '(type:', uploadType + ')')

    const cloudinaryResponse = await fetch(cloudinaryUrl, {
      method: 'POST',
      body: cloudinaryForm,
    })

    const uploadResult = await cloudinaryResponse.json()

    console.log('[Upload API] Cloudinary response status:', cloudinaryResponse.status)

    if (!cloudinaryResponse.ok) {
      console.error('[Upload API] Cloudinary error:', JSON.stringify(uploadResult))
      return NextResponse.json(
        { message: uploadResult.error?.message || 'Failed to upload to Cloudinary' },
        { status: 400 }
      )
    }

    console.log('[Upload API] Success! URL:', uploadResult.secure_url)

    return NextResponse.json({
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      ok: true,
    })
  } catch (error: any) {
    console.error('[Upload API] Unexpected error:', error)
    return NextResponse.json({ message: error.message || 'Server error' }, { status: 500 })
  }
}
