import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

import { getSessionFromRequest } from '@/lib/auth-session'

export async function POST(request: Request) {
  const session = await getSessionFromRequest(request)
  if (!session?.userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const field = formData.get('field') as string | null

  if (!file || !field) {
    return NextResponse.json({ message: 'No file provided' }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const uploadDir = join(process.cwd(), 'public', 'uploads', session.userId)
  await mkdir(uploadDir, { recursive: true })

  const ext = file.name.split('.').pop()
  const filename = `${field}-${Date.now()}.${ext}`
  const filepath = join(uploadDir, filename)
  await writeFile(filepath, buffer)

  const url = `/uploads/${session.userId}/${filename}`
  return NextResponse.json({ url })
}
