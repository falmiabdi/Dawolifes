const WebSocket = require('ws');

const PORT = 8080;
const wss = new WebSocket.Server({ port: PORT });

console.log(`[WebSocket Server] Running on ws://localhost:${PORT}`);

const mockNotifications = [
  {
    title: 'New Client Inquiry',
    description: 'Almaz Kassa sent you an inquiry about Modern Bole Apartment.',
    type: 'info',
  },
  {
    title: 'Property Listing Approved',
    description: 'Your property "Modern Bole Apartment" has been approved by admin and is now live.',
    type: 'success',
  },
  {
    title: 'Payout Completed',
    description: 'Your monthly commission payment of 4,500 ETB has been processed.',
    type: 'success',
  },
  {
    title: 'Listing Under Review',
    description: 'You posted a new property listing. It is currently under review.',
    type: 'info',
  },
  {
    title: 'Security Alert',
    description: 'A new device logged into your agent account from Addis Ababa.',
    type: 'warning',
  }
];

wss.on('connection', (ws) => {
  console.log('[WebSocket Server] Client connected');
  
  // Send welcome message
  ws.send(JSON.stringify({
    title: 'Real-Time Updates Connected',
    description: 'You are now connected to DelaHarme real-time notification stream.',
    type: 'success',
    time: 'Just now'
  }));

  // Send periodic mock notifications to simulate real-time updates
  const interval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      const randomNotif = mockNotifications[Math.floor(Math.random() * mockNotifications.length)];
      ws.send(JSON.stringify({
        ...randomNotif,
        id: 'ws-' + Math.random().toString(36).substr(2, 9),
        time: 'Just now'
      }));
    }
  }, 25000); // Send every 25 seconds

  ws.on('close', () => {
    console.log('[WebSocket Server] Client disconnected');
    clearInterval(interval);
  });
});
