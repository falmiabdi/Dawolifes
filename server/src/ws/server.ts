import { Server as HTTPServer } from 'http'
import WebSocket, { WebSocketServer } from 'ws'
import { prisma } from '../lib/prisma.js'
import { verifyAccessToken } from '../utils/jwt.js'

interface WSClient {
  userId: string
  isAlive: boolean
}

const clients = new Map<string, Set<WebSocket>>()

export function setupWebSocket(server: HTTPServer) {
  const wss = new WebSocketServer({ server, path: '/ws' })

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url || '/', `http://${req.headers.host}`)
    const token = url.searchParams.get('token')

    if (!token) {
      ws.close(4001, 'token required')
      return
    }

    let userId: string
    try {
      const decoded = verifyAccessToken(token)
      userId = decoded.userId
    } catch {
      ws.close(4001, 'invalid token')
      return
    }

    if (!clients.has(userId)) {
      clients.set(userId, new Set())
    }
    clients.get(userId)!.add(ws)

    // Track liveness on the actual socket so the heartbeat can terminate
    // dead connections instead of killing everyone on the first tick.
    ;(ws as any).isAlive = true
    ws.on('pong', () => {
      ;(ws as any).isAlive = true
    })

    console.log(`WebSocket client connected: ${userId}`)

    ws.on('message', async (data: string) => {
      try {
        const message = JSON.parse(data.toString())

        switch (message.type) {
          case 'mark_read':
            await prisma.notification.updateMany({
              where: { userId, read: false },
              data: { read: true, readAt: new Date() },
            })
            broadcastToUser(userId, { type: 'mark_read_ack', timestamp: Date.now() })
            break

          case 'mark_single_read':
            if (message.notificationId) {
              await prisma.notification.updateMany({
                where: { id: message.notificationId, userId },
                data: { read: true, readAt: new Date() },
              })
              broadcastToUser(userId, { type: 'mark_single_read_ack', notificationId: message.notificationId })
            }
            break

          case 'unread_count':
            const unreadCount = await prisma.notification.count({ where: { userId, read: false } })
            broadcastToUser(userId, { type: 'unread_count', count: unreadCount })
            break
        }
      } catch (err) {
        console.error('WebSocket message error:', err)
      }
    })

    ws.on('close', () => {
      const userClients = clients.get(userId)
      if (userClients) {
        userClients.delete(ws)
        if (userClients.size === 0) {
          clients.delete(userId)
        }
      }
      console.log(`WebSocket client disconnected: ${userId}`)
    })
  })

  const heartbeat = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (!(ws as any).isAlive) {
        ws.terminate()
        return
      }
      ;(ws as any).isAlive = false
      ws.ping()
    })
  }, 30000)

  wss.on('close', () => {
    clearInterval(heartbeat)
  })

  console.log('WebSocket server started on /ws')
}

export function broadcastToUser(userId: string, data: any) {
  const userClients = clients.get(userId)
  if (!userClients) return
  const message = JSON.stringify(data)
  for (const ws of userClients) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message)
    }
  }
}

export function broadcastToAll(data: any) {
  const message = JSON.stringify(data)
  for (const userClients of clients.values()) {
    for (const ws of userClients) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message)
      }
    }
  }
}
