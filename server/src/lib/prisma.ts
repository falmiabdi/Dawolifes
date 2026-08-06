import { PrismaClient } from '@prisma/client'

function databaseUrl(): string {
  const url = process.env.DATABASE_URL || ''
  try {
    const urlObj = new URL(url)
    urlObj.searchParams.set('connect_timeout', '30')
    if (urlObj.hostname.includes('-pooler') && !urlObj.searchParams.has('pgbouncer')) {
      urlObj.searchParams.set('pgbouncer', 'true')
    }
    return urlObj.toString()
  } catch {
    if (url.includes('-pooler') && !url.includes('pgbouncer=true')) {
      const sep = url.includes('?') ? '&' : '?'
      return `${url}${sep}connect_timeout=30&pgbouncer=true`
    }
    const sep = url.includes('?') ? '&' : '?'
    return url.includes('?') ? `${url}${sep}connect_timeout=30` : `${url}?connect_timeout=30`
  }
}

export const prisma = new PrismaClient({
  datasources: { db: { url: databaseUrl() } },
})

let _dbAvailable = false

export function isDbAvailable(): boolean {
  return _dbAvailable
}

function isRetryableConnectionError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return /server has closed the connection|connection.*closed|can't reach database server|P1001|P1002|P1017/i.test(message)
}

const RETRY_BACKOFFS_MS = [500, 1000, 2000, 4000, 8000, 15000]

/** Retries an operation when Neon drops an idle pooled connection or is waking from autosuspend. */
export async function withPrismaRetry<T>(operation: () => Promise<T>): Promise<T> {
  let lastError: unknown
  for (const delay of RETRY_BACKOFFS_MS) {
    try {
      const result = await operation()
      _dbAvailable = true
      return result
    } catch (error) {
      lastError = error
      if (!isRetryableConnectionError(error)) throw error
      _dbAvailable = false
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
  _dbAvailable = false
  throw lastError
}

const KEEPALIVE_INTERVAL_MS = 4 * 60 * 1000
let keepAliveStarted = false

/** Pings the DB before Neon's autosuspend threshold so pooled connections stay warm. */
export function startKeepAlive() {
  if (keepAliveStarted) return
  keepAliveStarted = true
  const timer = setInterval(() => {
    prisma.$queryRaw`SELECT 1`.then(() => {
      _dbAvailable = true
    }).catch(() => {
      _dbAvailable = false
    })
  }, KEEPALIVE_INTERVAL_MS)
  timer.unref()
}
