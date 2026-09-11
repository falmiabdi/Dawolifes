import { Router } from 'express'
import { z } from 'zod'
import { authMiddleware, agentMiddleware, adminMiddleware } from '../middleware/auth.js'
import { prisma } from '../lib/prisma.js'
import { notifyAdmins, createAndBroadcastNotification } from '../utils/notifications.js'
import { isValidUuid } from '../utils/validation.js'

const router = Router()

export type PermissionAction = 'EDIT' | 'DELETE'
export type PermissionEntity = 'PROPERTY' | 'VEHICLE'

/**
 * Gate before editing/deleting a listing:
 * - Admins always pass.
 * - Non-approved listings (Pending/Rejected) are freely editable by the poster.
 * - Approved listings require an Approved, unused permission request of the
 *   matching type from the poster. If one exists it is consumed (used=true)
 *   so each granted permission is usable only once.
 */
export async function assertListingPermissionAllowed(opts: {
  requesterId: string
  isAdmin: boolean
  entityType: PermissionEntity
  entityId: string
  listingStatus: string
  type: PermissionAction
}): Promise<{ allowed: true } | { allowed: false; code: string }> {
  if (opts.isAdmin || opts.listingStatus !== 'Approved') {
    return { allowed: true }
  }
  const request = await prisma.permissionRequest.findFirst({
    where: {
      entityType: opts.entityType,
      entityId: opts.entityId,
      requesterId: opts.requesterId,
      type: opts.type,
      status: 'Approved',
      used: false,
    },
  })
  if (!request) {
    return { allowed: false, code: 'PERMISSION_REQUIRED' }
  }
  await prisma.permissionRequest.update({ where: { id: request.id }, data: { used: true } })
  return { allowed: true }
}

const createSchema = z.object({
  entityType: z.enum(['PROPERTY', 'VEHICLE']),
  entityId: z.string(),
  type: z.enum(['EDIT', 'DELETE']),
  reason: z.string().max(500).optional(),
})

// Sellers request permission to edit/delete an already-approved listing.
// Pending/approved-unused duplicates are not created twice.
router.post('/', authMiddleware, agentMiddleware, async (req, res) => {
  try {
    const parsed = createSchema.safeParse(req.body)
    if (!parsed.success || !isValidUuid(parsed.data.entityId)) {
      return res.status(400).json({ message: 'Validation error' })
    }
    const { entityType, entityId, type, reason } = parsed.data
    const requesterId = req.user!.userId

    const listing =
      entityType === 'PROPERTY'
        ? await prisma.property.findUnique({ where: { id: entityId } })
        : await prisma.vehicle.findUnique({ where: { id: entityId } })
    if (!listing || listing.agentId !== requesterId) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    const existing = await prisma.permissionRequest.findFirst({
      where: {
        entityType,
        entityId,
        type,
        requesterId,
        status: { in: ['Pending', 'Approved'] },
        used: false,
      },
    })
    if (existing) {
      return res.status(200).json({ message: 'Permission already requested', request: existing })
    }

    const request = await prisma.permissionRequest.create({
      data: { entityType, entityId, type, requesterId, reason: reason || null },
    })

    notifyAdmins(
      'Permission Request',
      `A seller requests permission to ${type === 'EDIT' ? 'edit' : 'delete'} a ${entityType === 'PROPERTY' ? 'property' : 'vehicle'}.`,
      'info',
      { entityType: 'PERMISSION', entityId: request.id, permissionId: request.id, listingType: entityType, listingId: entityId, requestType: type }
    ).catch(() => {})

    res.status(201).json({ message: 'Permission requested', request })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to request permission' })
  }
})

// Admin list of all permission requests (with requester details for the badge).
router.get('/admin', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const requests = await prisma.permissionRequest.findMany({
      where: req.query.status ? { status: String(req.query.status) as any } : undefined,
      include: { requester: { select: { id: true, username: true, email: true, profilePhoto: true } } },
      orderBy: { createdAt: 'desc' },
    })
    const pendingCount = await prisma.permissionRequest.count({ where: { status: 'Pending' } })
    res.json({ requests, pendingCount })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch permission requests' })
  }
})

// A seller's own requests for a specific listing (status for UI badges).
router.get('/mine', authMiddleware, async (req, res) => {
  try {
    const { entityId, entityType, type } = req.query
    const where: any = { requesterId: req.user!.userId }
    if (entityId) where.entityId = String(entityId)
    if (entityType) where.entityType = String(entityType)
    if (type) where.type = String(type)
    const requests = await prisma.permissionRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    res.json({ requests })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch permission requests' })
  }
})

// Admin approves or rejects a permission request.
router.patch('/:id/decide', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    if (!isValidUuid(req.params.id)) {
      return res.status(404).json({ message: 'Request not found' })
    }
    const request = await prisma.permissionRequest.findUnique({ where: { id: req.params.id } })
    if (!request) {
      return res.status(404).json({ message: 'Request not found' })
    }

    const approve = req.body.approve === true
    const updated = await prisma.permissionRequest.update({
      where: { id: request.id },
      data: { status: approve ? 'Approved' : 'Rejected', decidedAt: new Date(), decidedById: req.user!.userId },
    })

    createAndBroadcastNotification(
      request.requesterId,
      approve ? 'Permission Approved' : 'Permission Rejected',
      approve
        ? `Your request to ${request.type === 'EDIT' ? 'edit' : 'delete'} has been approved.`
        : `Your request to ${request.type === 'EDIT' ? 'edit' : 'delete'} was rejected.`,
      approve ? 'success' : 'error',
      { entityType: 'PERMISSION', permissionId: request.id, approved: approve }
    ).catch(() => {})

    res.json({ message: approve ? 'Permission approved' : 'Permission rejected', request: updated })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to decide permission request' })
  }
})

export default router