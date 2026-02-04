const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');
const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';
const WEBHOOK_URL = process.env.WEBHOOK_URL || `${BACKEND_URL}/api/whatsapp/incoming`;
const WEBHOOK_TOKEN = process.env.WEBHOOK_TOKEN || '';

// State
let sock = null;
let qrCodeData = null;
let isConnected = false;
let connectionState = 'disconnected';

// Pino logger - simple JSON output for production
const logger = pino({ 
  level: process.env.LOG_LEVEL || 'error' // Only log errors by default
});

// Connect to WhatsApp
async function connectToWhatsApp() {
  try {
    console.log('🔄 Starting Baileys WhatsApp client...');
    
    const { state, saveCreds } = await useMultiFileAuthState('./baileys-auth');
    const { version, isLatest } = await fetchLatestBaileysVersion();
    
    console.log(`📱 Using WA version: ${version.join('.')}, isLatest: ${isLatest}`);
    
    sock = makeWASocket({
      version,
      logger: logger.child({ level: 'error' }), // Only show errors
      printQRInTerminal: false, // We'll handle QR manually
      auth: state,
      browser: ['MLH CRM', 'Chrome', '121.0.0'],
      defaultQueryTimeoutMs: 60000,
    });
    
    // Connection updates
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      if (qr) {
        qrCodeData = qr;
        const timestamp = new Date().toLocaleString('tr-TR');
        console.log(`\n📱 [${timestamp}] QR CODE GENERATED`);
        console.log('⏰ Scan within 2 minutes\n');
        qrcode.generate(qr, { small: true });
      }
      
      if (connection === 'close') {
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        const reason = lastDisconnect?.error?.output?.statusCode || 'unknown';
        
        console.log(`📴 Connection closed. Reason: ${reason}`);
        console.log(`🔄 Reconnecting: ${shouldReconnect}`);
        
        isConnected = false;
        connectionState = 'disconnected';
        qrCodeData = null;
        
        if (shouldReconnect) {
          // Wait a bit before reconnecting
          setTimeout(() => connectToWhatsApp(), 3000);
        }
      } else if (connection === 'open') {
        const timestamp = new Date().toLocaleString('tr-TR');
        console.log(`✅ WhatsApp connected successfully! [${timestamp}]`);
        console.log('🎉 You can now send and receive messages!');
        
        isConnected = true;
        connectionState = 'connected';
        qrCodeData = null;
      } else if (connection === 'connecting') {
        console.log('⏳ Connecting to WhatsApp...');
        connectionState = 'connecting';
      }
    });
    
    // Save credentials
    sock.ev.on('creds.update', saveCreds);
    
    // Message handler
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      try {
        if (type !== 'notify') return; // Only handle new messages
        
        for (const message of messages) {
          // Skip if not a message (e.g., status updates)
          if (!message.message) continue;
          
          // Skip if from me
          if (message.key.fromMe) continue;
          
          // Extract message content
          const messageText = message.message.conversation || 
                             message.message.extendedTextMessage?.text || 
                             '';
          
          if (!messageText.trim()) continue;
          
          // Extract sender info
          const from = message.key.remoteJid;
          const isGroup = from.endsWith('@g.us');
          
          // Skip group messages
          if (isGroup) continue;
          
          // Clean phone number (remove all WhatsApp suffixes)
          const phoneNumber = from.replace(/@s\.whatsapp\.net|@c\.us|@lid|@g\.us/g, '');
          
          // Get sender name (if available)
          const pushName = message.pushName || null;
          
          // DEBUG: Log incoming message details
          console.log('📱 INCOMING MESSAGE DEBUG:');
          console.log('   Raw remoteJid:', from);
          console.log('   Cleaned phone:', phoneNumber);
          console.log('   Push name:', pushName);
          console.log('   Message:', messageText.substring(0, 50));
          
          // Prepare webhook payload
          const payload = {
            channel: 'whatsapp',
            from_phone: phoneNumber,
            from_name: pushName,
            content: messageText,
            message_id: message.key.id,
            timestamp: message.messageTimestamp
          };
          
          console.log('📩 Message →', phoneNumber);
          
          // Send to backend
          const headers = { 'Content-Type': 'application/json' };
          if (WEBHOOK_TOKEN) {
            headers['Authorization'] = `Bearer ${WEBHOOK_TOKEN}`;
          }
          
          const response = await axios.post(WEBHOOK_URL, payload, {
            headers,
            timeout: 10000
          });
          
          console.log(`✅ Delivered (${response.status})`);
        }
      } catch (error) {
        if (error.response) {
          console.error('❌ Webhook error:', error.response.status, error.response.data);
        } else {
          console.error('❌ Webhook failed:', error.message);
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Failed to connect:', error.message);
    console.error('🔄 Retrying in 5 seconds...');
    setTimeout(() => connectToWhatsApp(), 5000);
  }
}

// Express routes
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    whatsapp: {
      ready: isConnected,
      hasQR: !!qrCodeData,
      connectionState
    },
    timestamp: new Date().toISOString()
  });
});

app.get('/status', (req, res) => {
  res.json({
    connected: isConnected,
    hasQR: !!qrCodeData,
    state: connectionState,
    timestamp: new Date().toISOString()
  });
});

app.get('/qr', (req, res) => {
  if (isConnected) {
    return res.json({
      status: 'connected',
      message: 'WhatsApp is already connected'
    });
  }
  
  if (qrCodeData) {
    return res.json({
      status: 'pending',
      qr: qrCodeData,
      expiresIn: '120s'
    });
  }
  
  res.json({
    status: 'initializing',
    message: 'QR code not yet available, please wait...'
  });
});

app.get('/qr-display', async (req, res) => {
  if (isConnected) {
    return res.send(`
      <html>
        <body style="text-align:center;padding:50px;font-family:Arial">
          <h1 style="color:green">✅ Connected!</h1>
          <p>WhatsApp is connected and ready to receive messages.</p>
        </body>
      </html>
    `);
  }
  
  if (qrCodeData) {
    const qrImage = await QRCode.toDataURL(qrCodeData);
    return res.send(`
      <html>
        <head>
          <meta http-equiv="refresh" content="5">
          <style>
            body { text-align:center; padding:50px; font-family:Arial; }
            img { border: 2px solid #ccc; border-radius: 10px; }
          </style>
        </head>
        <body>
          <h1>📱 Scan QR Code with WhatsApp</h1>
          <img src="${qrImage}" style="width:400px;height:400px"/>
          <p><strong style="color:#ff6b6b">⏰ Scan within 2 minutes!</strong></p>
          <p style="color:#666">Open WhatsApp → Settings → Linked Devices → Link a Device</p>
        </body>
      </html>
    `);
  }
  
  res.send(`
    <html>
      <head>
        <meta http-equiv="refresh" content="3">
      </head>
      <body style="text-align:center;padding:50px;font-family:Arial">
        <h1>⏳ Initializing...</h1>
        <p>QR code will appear here shortly.</p>
      </body>
    </html>
  `);
});

app.post('/send', async (req, res) => {
  try {
    const { to, message } = req.body;
    
    if (!to || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, message'
      });
    }
    
    if (!isConnected || !sock) {
      return res.status(503).json({
        success: false,
        error: 'WhatsApp is not connected'
      });
    }
    
    // Format number: clean first, then add correct suffix
    // Remove any existing WhatsApp suffixes and non-numeric chars (except +)
    const cleanNumber = to.replace(/@s\.whatsapp\.net|@c\.us|@lid|@g\.us/g, '').replace(/[^0-9+]/g, '');
    const jid = `${cleanNumber}@s.whatsapp.net`;
    
    // Send message
    const sent = await sock.sendMessage(jid, { text: message });
    
    console.log(`📤 Message sent to ${to}: ${message.substring(0, 50)}...`);
    
    res.json({
      success: true,
      messageId: sent.key.id,
      timestamp: sent.messageTimestamp
    });
    
  } catch (error) {
    console.error('❌ Failed to send message:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Baileys WhatsApp service running on port ${PORT}`);
  console.log(`📡 Webhook: ${WEBHOOK_URL}`);
  console.log('');
});

// Start WhatsApp connection
connectToWhatsApp();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down...');
  if (sock) {
    await sock.logout();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down...');
  if (sock) {
    await sock.logout();
  }
  process.exit(0);
});
