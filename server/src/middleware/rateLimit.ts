import { Request, Response, NextFunction } from 'express'

interface Bucket {
  count: number
  resetAt: number
}

const store = new Map<string, Bucket>()

export function rateLimit(options: { windowMs: number; max: number }) {
  const { windowMs, max } = options

  return (req: Request, res: Response, next: NextFunction) => {
    // Key on the route path (without the query string) so appending ?x=1, ?x=2
    // cannot create a fresh bucket per request and bypass the limit.
    const path = (req.originalUrl || req.url || '/').split('?')[0]
    const key = `${req.ip}:${path}`
    const now = Date.now()

    if (store.size > 5000) {
      for (const [k, bucket] of store) {
        if (bucket.resetAt < now) store.delete(k)
      }
    }

    let bucket = store.get(key)
    if (!bucket || bucket.resetAt < now) {
      bucket = { count: 0, resetAt: now + windowMs }
      store.set(key, bucket)
    }

    bucket.count += 1
    if (bucket.count > max) {
      return res.status(429).json({ message: 'Too many requests, please try again later.' })
    }
    next()
  }
}
