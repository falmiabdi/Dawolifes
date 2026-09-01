import { getMessaging } from 'firebase-admin/messaging'
import { prisma } from '../lib/prisma.js'
import { initializeFirebaseAdmin } from './firebase.js'

/**
 * Sends an FCM push notification to every device registered to [userId].
 *
 * Failures are intentionally swallowed: push delivery is best-effort on top of
 * the in-app notification (WebSocket + DB). A missing/expired token simply
 * means that device misses this push; stale tokens are removed so the table
 * doesn't accumulate junk. If the Firebase Admin app has no service-account
 * credentials configured, `getMessaging()` throws and we log once and bail.
 */
export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  type: string = 'info',
  data?: any
) {
  try {
    const tokens = await prisma.deviceToken.findMany({
      where: { userId },
      select: { token: true, id: true },
    })
    if (tokens.length === 0) return

    const messaging = getMessaging(initializeFirebaseAdmin())

    const message = {
      tokens: tokens.map((t) => t.token),
      notification: { title, body },
      data: {
        type: type ?? 'info',
        title,
        body,
        ...(data ? { data: JSON.stringify(data) } : {}),
      },
      android: {
        priority: 'high' as const,
        notification: {
          channelId: 'notifications',
        },
      },
    }

    const result = await messaging.sendEachForMulticast(message)

    if (result.failureCount > 0) {
      const staleIds = result.responses
        .map((resp, i) => (resp.success ? null : tokens[i]))
        .filter((t): t is { id: string; token: string } => t != null)
      if (staleIds.length > 0) {
        await prisma.deviceToken.deleteMany({
          where: { id: { in: staleIds.map((t) => t.id) } },
        })
      }
    }
  } catch (err: any) {
    // No credentials / network error / FCM ApiUsageError: don't break the app.
    console.warn(`[FCM] Push send skipped for user ${userId}: ${err.message}`)
  }
}