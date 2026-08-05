import { PrismaClient } from '@prisma/client'

function databaseUrl(): string {
  const url = process.env.DATABASE_URL || ''
  if (url.includes('-pooler') && !url.includes('pgbouncer=true')) {
    const sep = url.includes('?') ? '&' : '?'
    return `${url}${sep}pgbouncer=true`
  }
  return url
}

export const prisma = new PrismaClient({
  datasources: { db: { url: databaseUrl() } },
})

function isRetryableConnectionError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return /server has closed the connection|connection.*closed|can't reach database server|P1001|P1002|P1017/i.test(message)
}

const RETRY_BACKOFFS_MS = [150, 400, 1000, 2500, 5000]

/** Retries an operation when Neon drops an idle pooled connection or is waking from autosuspend. */
export async function withPrismaRetry<T>(operation: () => Promise<T>): Promise<T> {
  let lastError: unknown
  for (const delay of RETRY_BACKOFFS_MS) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      if (!isRetryableConnectionError(error)) throw error
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
  throw lastError
}
