import { Server as HTTPServer } from 'http'
import { Server as WSServer } from 'ws'
import { NotificationModel } from '../models/index.js'

interface WSClient {
  userId: string
  ws: any
  isAlive: boolean
}

const clients = new Map<string, WSClient[]>()

export function setupWebSocket(server: HTTPServer) {
  const wss = new WSServer({ server, path: '/ws' })

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url || '/', `http://${req.headers.host}`)
    const userId = url.searchParams.get('userId')

    if (!userId) {
      ws.close(4001, 'userId required')
      return
    }

    const client: WSClient = { userId, ws, isAlive: true }

    if (!clients.has(userId)) {
      clients.set(userId, [])
    }
    clients.get(userId)!.push(client)

    console.log(`WebSocket client connected: ${userId}`)

    ws.on('message', async (data: string) => {
      try {
        const message = JSON.parse(data.toString())

        switch (message.type) {
          case 'mark_read':
            await NotificationModel.update(
              { read: true },
              { where: { userId, read: false } }
            )
            broadcastToUser(userId, { type: 'mark_read_ack', timestamp: Date.now() })
            break

          case 'mark_single_read':
            if (message.notificationId) {
              await NotificationModel.update(
                { read: true },
                { where: { id: message.notificationId } }
              )
              broadcastToUser(userId, { type: 'mark_single_read_ack', notificationId: message.notificationId })
            }
            break

          case 'send_notification':
            if (message.targetUserId && message.title && message.body) {
              const notification = await NotificationModel.create({
                userId: message.targetUserId,
                title: message.title,
                body: message.body,
                type: message.type || 'general',
                data: message.data,
              } as any)
              broadcastToUser(message.targetUserId, {
                type: 'notification',
                notification,
              })
            }
            break

          case 'unread_count':
            const unreadCount = await NotificationModel.count({ where: { userId, read: false } })
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
        const index = userClients.indexOf(client)
        if (index > -1) {
          userClients.splice(index, 1)
        }
        if (userClients.length === 0) {
          clients.delete(userId)
        }
      }
      console.log(`WebSocket client disconnected: ${userId}`)
    })

    ws.on('pong', () => {
      client.isAlive = true
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
  if (userClients) {
    const message = JSON.stringify(data)
    userClients.forEach((client) => {
      if (client.ws.readyState === 1) {
        client.ws.send(message)
      }
    })
  }
}
