import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { prisma } from '../lib/prisma.js'
import { isValidUuid } from '../utils/validation.js'

const router = Router()

const agentPublicSelect = {
  id: true,
  username: true,
  profilePhoto: true,
  phone: true,
  role: true,
}



async function hasContactedAgent(reviewerId: string, agentId: string): Promise<boolean> {
  const lead = await prisma.message.findFirst({
    where: {
      OR: [
        { senderId: reviewerId, recipientId: agentId },
        { senderId: agentId, recipientId: reviewerId },
      ],
    },
    select: { id: true },
  })
  return !!lead
}


router.post('/', authMiddleware, async (req, res) => {
  try {
    const { agentId, rating, comment } = req.body
    if (!isValidUuid(agentId)) {
      return res.status(400).json({ message: 'A valid agent id is required' })
    }
    const stars = Number(rating)
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
      return res.status(400).json({ message: 'Rating must be an integer between 1 and 5' })
    }

    const reviewerId = req.user!.userId
    if (reviewerId === agentId) {
      return res.status(400).json({ message: 'You cannot review yourself' })
    }

    const agent = await prisma.user.findUnique({
      where: { id: agentId },
      select: { role: true },
    })
    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' })
    }
    if (agent.role !== 'agent' && agent.role !== 'owner') {
      return res.status(400).json({ message: 'Reviews can only be left for agents or property owners' })
    }

    const contacted = await hasContactedAgent(reviewerId, agentId)
    if (!contacted) {
      return res.status(403).json({
        message: 'You can only rate an agent you have had a conversation with.',
      })
    }

    const existing = await prisma.review.findUnique({
      where: { reviewerId_agentId: { reviewerId, agentId } },
    })

    const review = existing
      ? await prisma.review.update({
          where: { id: existing.id },
          data: { rating: stars, comment: comment ? String(comment).slice(0, 1000) : null },
        })
      : await prisma.review.create({
          data: { reviewerId, agentId, rating: stars, comment: comment ? String(comment).slice(0, 1000) : null },
        })

    res.status(existing ? 200 : 201).json({ message: 'Review saved', review })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to save review' })
  }
})


router.get('/agent/:agentId', async (req, res) => {
  try {
    if (!isValidUuid(req.params.agentId)) {
      return res.status(400).json({ message: 'Invalid agent id' })
    }
    const agent = await prisma.user.findUnique({
      where: { id: req.params.agentId },
      select: agentPublicSelect,
    })
    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' })
    }

    const reviews = await prisma.review.findMany({
      where: { agentId: req.params.agentId },
      orderBy: { createdAt: 'desc' },
      include: { reviewer: { select: { id: true, username: true, profilePhoto: true } } },
    })

    const avg = reviews.length
      ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
      : 0

    res.json({ agent, rating: { average: avg, count: reviews.length }, reviews })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch reviews' })
  }
})


router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    if (!isValidUuid(req.params.id)) {
      return res.status(404).json({ message: 'Review not found' })
    }
    const review = await prisma.review.findUnique({ where: { id: req.params.id } })
    if (!review) {
      return res.status(404).json({ message: 'Review not found' })
    }
    if (review.reviewerId !== req.user!.userId) {
      return res.status(403).json({ message: 'Not authorized' })
    }
    await prisma.review.delete({ where: { id: review.id } })
    res.json({ message: 'Review removed' })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to remove review' })
  }
})

export default router