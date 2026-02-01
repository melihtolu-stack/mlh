const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');
const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';
const WEBHOOK_URL = process.env.WEBHOOK_URL || `${BACKEND_URL}/api/messages/incoming`;

let clientReady = false;
let qrCode = null;

// ⭐ Chromium lock dosyalarını temizle
const cleanupChromiumLocks = () => {
  const lockFiles = [
    './data/chromium-profile/SingletonLock',
    './data/chromium-profile/SingletonSocket',
    './data/chromium-profile/SingletonCookie'
  ];
  
  lockFiles.forEach(file => {
    try {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
        console.log(`🧹 Cleaned up: ${file}`);
      }
    } catch (err) {
      console.warn(`⚠️ Could not clean ${file}:`, err.message);
    }
  });
};

// ⭐ Data klasörlerini oluştur
const ensureDataDirectories = () => {
  const dirs = ['./data', './data/chromium-profile'];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  });
};

// Başlangıçta temizlik yap
ensureDataDirectories();
cleanupChromiumLocks();

// Initialize WhatsApp client
const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: './data'
  }),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--single-process',
      '--no-default-browser-check',
      '--disable-background-networking',
    ],
    userDataDir: './data/chromium-profile'
  },
  authTimeoutMs: 120000,
  qrMaxRetries: 5,
  restartOnAuthFail: true,
  takeoverOnConflict: true,
  takeoverTimeoutMs: 60000
});

// QR Code event
client.on('qr', (qr) => {
  qrCode = qr;
  const timestamp = new Date().toLocaleString('tr-TR');
  console.log(`\n📱 [${timestamp}] NEW QR CODE GENERATED`);
  console.log('⏰ You have 2 minutes to scan this QR code\n');
  qrcode.generate(qr, { small: true });
  console.log(`🔗 QR Data Length: ${qr.length} characters`);
});

// Ready event
client.on('ready', () => {
  clientReady = true;
  qrCode = null;
  console.log('✅ WhatsApp client is ready!');
});

// Authentication success
client.on('authenticated', () => {
  console.log('🔐 WhatsApp authenticated successfully');
});

// Authentication failure
client.on('auth_failure', (msg) => {
  console.error('❌ Authentication failed:', msg);
  clientReady = false;
  // Temizlik yap ve yeniden başlat
  setTimeout(() => {
    cleanupChromiumLocks();
  }, 2000);
});

// Disconnected event
client.on('disconnected', (reason) => {
  console.log('📴 WhatsApp disconnected:', reason);
  clientReady = false;
  // Temizlik yap
  cleanupChromiumLocks();
});

// Incoming message handler
client.on('message', async (message) => {
  try {
    if (message.isGroupMsg) return;
    if (!message.body || message.body.trim() === '') return;

    const contact = await message.getContact();
    const fromPhoneRaw = message.from.replace('@c.us', '');
    const fromPhone = fromPhoneRaw.replace(/[^0-9]/g, '');

    const payload = {
      channel: "whatsapp",
      from_phone: fromPhone,
      from_name: contact.pushname || contact.name || null,
      content: message.body,
      message_id: message.id._serialized,
      timestamp: message.timestamp
    };

    console.log('📩 WhatsApp → Backend payload:', payload);

    const response = await axios.post(WEBHOOK_URL, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });

    console.log(`✅ Webhook delivered (${response.status})`);
  } catch (error) {
    if (error.response) {
      console.error('❌ Webhook error:', error.response.status, error.response.data);
    } else {
      console.error('❌ Webhook failed:', error.message);
    }
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    whatsapp: { ready: clientReady, hasQR: !!qrCode },
    timestamp: new Date().toISOString()
  });
});

// QR code endpoint (JSON)
app.get('/qr', (req, res) => {
  if (clientReady) {
    return res.json({
      status: 'connected',
      message: 'WhatsApp is already connected',
      authenticated: true
    });
  }
  
  if (qrCode) {
    return res.json({
      status: 'pending',
      qr: qrCode,
      message: 'Please scan this QR code with WhatsApp within 2 minutes',
      expiresIn: '120 seconds'
    });
  }
  
  res.json({
    status: 'initializing',
    message: 'QR code not yet available, please wait and refresh...'
  });
});

// QR display endpoint (HTML)
app.get('/qr-display', async (req, res) => {
  if (clientReady) {
    return res.send(`
      <html>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1 style="color: green;">✅ WhatsApp Connected!</h1>
          <p>WhatsApp client is ready and authenticated.</p>
          <p style="color: #666; margin-top: 20px;">Connected at: ${new Date().toLocaleString('tr-TR')}</p>
        </body>
      </html>
    `);
  }
  
  if (qrCode) {
    try {
      const url = await QRCode.toDataURL(qrCode);
      return res.send(`
        <html>
          <head>
            <meta http-equiv="refresh" content="5">
            <title>WhatsApp QR Code</title>
          </head>
          <body style="font-family: Arial; text-align: center; padding: 50px;">
            <h1>📱 Scan QR Code with WhatsApp</h1>
            <p>This page will refresh every 5 seconds</p>
            <img src="${url}" style="width: 400px; height: 400px; border: 2px solid #ccc; border-radius: 10px;"/>
            <p><strong style="color: #ff6b6b;">⏰ Expires in: 2 minutes</strong></p>
            <p style="color: #666;">Open WhatsApp → Settings → Linked Devices → Link a Device</p>
          </body>
        </html>
      `);
    } catch (error) {
      return res.status(500).send('Error generating QR code');
    }
  }
  
  res.send(`
    <html>
      <head><meta http-equiv="refresh" content="3"></head>
      <body style="font-family: Arial; text-align: center; padding: 50px;">
        <h1>⏳ Initializing WhatsApp Client...</h1>
        <p>QR code will appear shortly...</p>
      </body>
    </html>
  `);
});

// Status endpoint
app.get('/status', (req, res) => {
  res.json({
    connected: clientReady,
    hasQR: !!qrCode,
    timestamp: new Date().toISOString()
  });
});

// Send message endpoint
app.post('/send', async (req, res) => {
  try {
    const { to, message, type = 'text' } = req.body;

    if (!to || !message) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    if (!clientReady) {
      return res.status(503).json({ success: false, error: 'WhatsApp client is not ready' });
    }

    const chatId = to.includes('@') ? to : `${to.replace(/[^0-9]/g, '')}@c.us`;
    const result = await client.sendMessage(chatId, message);

    console.log(`📤 Message sent to ${chatId}`);

    res.json({
      success: true,
      messageId: result.id._serialized,
      timestamp: result.timestamp
    });
  } catch (error) {
    console.error('❌ Failed to send message:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 WhatsApp service running on port ${PORT}`);
  console.log(`📡 Webhook URL: ${WEBHOOK_URL}`);
});

// Initialize client
console.log('🔄 Initializing WhatsApp client...');
client.initialize();

// Graceful shutdown
const shutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}, shutting down...`);
  cleanupChromiumLocks();
  await client.destroy();
  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));