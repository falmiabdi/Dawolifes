import { NextResponse } from 'next/server'

import { getServerSession } from '@/lib/auth-session'
import { deleteAgent, listAgents, updateAgentStatus } from '@/lib/auth-store'

function isAdmin(session: Awaited<ReturnType<typeof getServerSession>>) {
  return Boolean(session?.user && session.user.email === 'felmitesfaye@gmail.com')
}

export async function GET(request: Request) {
  const session = await getServerSession()
  if (!isAdmin(session)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || 'all'

  const agents = await listAgents({ search, status })
  return NextResponse.json({ agents })
}

export async function POST(request: Request) {
  const session = await getServerSession()
  if (!isAdmin(session)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 })
  }

  const body = await request.json()
  const action = String(body.action || '')
  const id = String(body.id || '')

  if (!id || !action) {
    return NextResponse.json({ message: 'Missing action payload.' }, { status: 400 })
  }

  if (action === 'delete') {
    await deleteAgent(id)
    return NextResponse.json({ message: 'Agent deleted successfully.' })
  }

  let status: 'Approved' | 'Rejected' | 'Suspended' | 'Pending' = 'Pending'
  let rejectionReason = ''

  if (action === 'approve') {
    status = 'Approved'
  } else if (action === 'reject') {
    status = 'Rejected'
    rejectionReason = String(body.rejectionReason || 'Your account was rejected. Please update your documents and resubmit.')
  } else if (action === 'suspend') {
    status = 'Suspended'
  } else if (action === 'reactivate') {
    status = 'Approved'
  } else {
    return NextResponse.json({ message: 'Unsupported action.' }, { status: 400 })
  }

  await updateAgentStatus(id, status, rejectionReason)
  return NextResponse.json({ message: 'Agent status updated.' })
}
