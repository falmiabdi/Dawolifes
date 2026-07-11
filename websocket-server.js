const WebSocket = require('ws');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const PORT = 8080;

// Load .env.local manually
function loadEnv() {
  try {
    const envPath = path.join(__dirname, '.env.local');
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach((line) => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        process.env[key] = value;
      }
    });
  } catch (err) {
    console.log('[WebSocket Server] No .env.local found');
  }
}
loadEnv();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || '';

const notificationSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['info', 'success', 'warning', 'error'], default: 'info' },
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ userId: 1, createdAt: -1 });

const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);

async function connectDB() {
  if (!MONGODB_URI) {
    console.log('[WebSocket Server] No MONGODB_URI found, running without database persistence');
    return false;
  }
  try {
    await mongoose.connect(MONGODB_URI, { dbName: 'DelaHarme' });
    console.log('[WebSocket Server] Connected to MongoDB');
    return true;
  } catch (err) {
    console.error('[WebSocket Server] MongoDB connection error:', err.message);
    return false;
  }
}

const wss = new WebSocket.Server({ port: PORT });
const clients = new Map(); // userId -> Set<ws>

console.log(`[WebSocket Server] Running on ws://localhost:${PORT}`);

const mockNotifications = [
  {
    title: 'New Client Inquiry',
    message: 'Almaz Kassa sent you an inquiry about Modern Bole Apartment.',
    type: 'info',
  },
  {
    title: 'Property Listing Approved',
    message: 'Your property "Modern Bole Apartment" has been approved by admin and is now live.',
    type: 'success',
  },
  {
    title: 'Payout Completed',
    message: 'Your monthly commission payment of 4,500 ETB has been processed.',
    type: 'success',
  },
  {
    title: 'Listing Under Review',
    message: 'You posted a new property listing. It is currently under review.',
    type: 'info',
  },
  {
    title: 'Security Alert',
    message: 'A new device logged into your agent account from Addis Ababa.',
    type: 'warning',
  },
];

function formatTime(date) {
  const now = new Date();
  const diff = now - new Date(date);
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

async function sendUnreadCount(userId, ws) {
  if (!mongoose.connection.readyState) return;
  try {
    const count = await Notification.countDocuments({ userId, isRead: false });
    ws.send(JSON.stringify({ event: 'unread_count', count }));
  } catch (err) {
    console.error('[WebSocket Server] Error counting unread:', err.message);
  }
}

async function persistAndBroadcast(userId, title, message, type) {
  if (!mongoose.connection.readyState) {
    broadcastToUser(userId, {
      event: 'notification',
      notification: {
        id: 'ws-' + Math.random().toString(36).substr(2, 9),
        title,
        description: message,
        type,
        isRead: false,
        time: 'Just now',
      },
    });
    return;
  }

  try {
    const doc = await Notification.create({ userId, title, message, type });
    broadcastToUser(userId, {
      event: 'notification',
      notification: {
        id: doc._id.toString(),
        title: doc.title,
        description: doc.message,
        type: doc.type,
        isRead: false,
        time: 'Just now',
      },
    });
    sendUnreadCount(userId, null); // broadcast count to all connected clients for this user
  } catch (err) {
    console.error('[WebSocket Server] Error persisting notification:', err.message);
  }
}

function broadcastToUser(userId, data) {
  const userClients = clients.get(userId);
  if (!userClients) return;
  const payload = JSON.stringify(data);
  userClients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  });
}

// Send unread count to all connections of a user
async function sendUnreadCountToUser(userId) {
  if (!mongoose.connection.readyState) return;
  try {
    const count = await Notification.countDocuments({ userId, isRead: false });
    const data = JSON.stringify({ event: 'unread_count', count });
    const userClients = clients.get(userId);
    if (!userClients) return;
    userClients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });
  } catch (err) {
    console.error('[WebSocket Server] Error broadcasting unread count:', err.message);
  }
}

wss.on('connection', async (ws, req) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const userId = url.searchParams.get('userId') || 'anonymous';

  console.log(`[WebSocket Server] Client connected: ${userId}`);

  // Track this client
  if (!clients.has(userId)) {
    clients.set(userId, new Set());
  }
  clients.get(userId).add(ws);

  // Send unread count on connect
  await sendUnreadCount(userId, ws);

  // Send welcome notification (ephemeral, not persisted)
  ws.send(JSON.stringify({
    event: 'notification',
    notification: {
      id: 'ws-welcome',
      title: 'Real-Time Updates Connected',
      description: 'You are now connected to DelaHarme real-time notification stream.',
      type: 'success',
      isRead: false,
      time: 'Just now',
    },
  }));

  // Mock notifications for demo (only for anonymous or when DB is off)
  let interval = null;
  if (userId === 'anonymous' || !mongoose.connection.readyState) {
    interval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        const randomNotif = mockNotifications[Math.floor(Math.random() * mockNotifications.length)];
        ws.send(JSON.stringify({
          event: 'notification',
          notification: {
            id: 'ws-' + Math.random().toString(36).substr(2, 9),
            title: randomNotif.title,
            description: randomNotif.message,
            type: randomNotif.type,
            isRead: false,
            time: 'Just now',
          },
        }));
      }
    }, 25000);
  }

  // Handle incoming messages (e.g., marking as read, or admin broadcasting)
  ws.on('message', async (raw) => {
    try {
      const data = JSON.parse(raw.toString());

      if (data.event === 'mark_read') {
        if (mongoose.connection.readyState) {
          await Notification.updateMany(
            { userId, isRead: false },
            { isRead: true },
          );
          sendUnreadCountToUser(userId);
        }
      }

      if (data.event === 'mark_single_read' && data.notificationId) {
        if (mongoose.connection.readyState) {
          await Notification.findOneAndUpdate(
            { _id: data.notificationId, userId },
            { isRead: true },
          );
          sendUnreadCountToUser(userId);
        }
      }

      // Admin: broadcast notification to a specific user
      if (data.event === 'send_notification' && data.targetUserId && data.title && data.message) {
        await persistAndBroadcast(data.targetUserId, data.title, data.message, data.type || 'info');
      }
    } catch (err) {
      console.error('[WebSocket Server] Error handling message:', err.message);
    }
  });

  ws.on('close', () => {
    console.log(`[WebSocket Server] Client disconnected: ${userId}`);
    if (interval) clearInterval(interval);
    const userClients = clients.get(userId);
    if (userClients) {
      userClients.delete(ws);
      if (userClients.size === 0) {
        clients.delete(userId);
      }
    }
  });
});

// Start server after DB connection
connectDB().then(() => {
  console.log(`[WebSocket Server] Ready on ws://localhost:${PORT}`);
});
