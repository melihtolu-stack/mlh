const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');
const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';
const WEBHOOK_URL = process.env.WEBHOOK_URL || `${BACKEND_URL}/api/messages/incoming`;

let clientReady = false;
let qrCode = null;

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
      '--disable-gpu'
    ]
  },
  authTimeoutMs: 120000, // 2 dakika QR okutma süresi
  qrMaxRetries: 5,
  restartOnAuthFail: true,
  takeoverOnConflict: true,
  takeoverTimeoutMs: 60000
});

// QR Code event - display in terminal
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
});

// Disconnected event
client.on('disconnected', (reason) => {
  console.log('📴 WhatsApp disconnected:', reason);
  clientReady = false;
});

// Incoming message handler
client.on('message', async (message) => {
  try {
    // Skip group messages
    if (message.isGroupMsg) return;

    // Skip empty messages
    if (!message.body || message.body.trim() === '') return;

    const contact = await message.getContact();

    // Normalize phone number
    const fromPhoneRaw = message.from.replace('@c.us', '');
    const fromPhone = fromPhoneRaw.replace(/[^0-9]/g, '');

    // Prepare payload for backend
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
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log(`✅ Webhook delivered (${response.status})`);
  } catch (error) {
    if (error.response) {
      console.error(
        '❌ Webhook error:',
        error.response.status,
        error.response.data
      );
    } else {
      console.error('❌ Webhook failed:', error.message);
    }
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    whatsapp: {
      ready: clientReady,
      hasQR: !!qrCode
    },
    timestamp: new Date().toISOString()
  });
});

// Get QR code endpoint (JSON)
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

// QR code display endpoint (HTML)
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
            <p style="color: #999; font-size: 12px;">Last updated: ${new Date().toLocaleString('tr-TR')}</p>
          </body>
        </html>
      `);
    } catch (error) {
      return res.status(500).send(`
        <html>
          <body style="font-family: Arial; text-align: center; padding: 50px;">
            <h1 style="color: red;">❌ Error generating QR code</h1>
            <p>${error.message}</p>
          </body>
        </html>
      `);
    }
  }
  
  res.send(`
    <html>
      <head>
        <meta http-equiv="refresh" content="3">
        <title>WhatsApp - Initializing</title>
      </head>
      <body style="font-family: Arial; text-align: center; padding: 50px;">
        <h1>⏳ Initializing WhatsApp Client...</h1>
        <p>QR code will appear here shortly. This page refreshes every 3 seconds.</p>
        <div style="margin-top: 30px;">
          <div class="spinner" style="border: 4px solid #f3f3f3; border-top: 4px solid #25D366; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto;"></div>
        </div>
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
        <p style="color: #999; font-size: 12px; margin-top: 20px;">Last checked: ${new Date().toLocaleString('tr-TR')}</p>
      </body>
    </html>
  `);
});

// Get connection status
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
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, message'
      });
    }

    if (!clientReady) {
      return res.status(503).json({
        success: false,
        error: 'WhatsApp client is not ready'
      });
    }

    // Format phone number (add @c.us suffix if not present)
    const chatId = to.includes('@') ? to : `${to.replace(/[^0-9]/g, '')}@c.us`;

    let result;
    
    if (type === 'text') {
      result = await client.sendMessage(chatId, message);
    } else {
      // Support for other message types can be added here
      result = await client.sendMessage(chatId, message);
    }

    console.log(`📤 Message sent to ${chatId}: ${message.substring(0, 50)}...`);

    res.json({
      success: true,
      messageId: result.id._serialized,
      timestamp: result.timestamp
    });
  } catch (error) {
    console.error('❌ Failed to send message:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start Express server
app.listen(PORT, () => {
  console.log(`🚀 WhatsApp service running on port ${PORT}`);
  console.log(`📡 Webhook URL: ${WEBHOOK_URL}`);
});

// Initialize WhatsApp client
console.log('🔄 Initializing WhatsApp client...');
client.initialize();

// Session status monitoring (her dakika)
setInterval(() => {
  if (clientReady) {
    console.log('📊 WhatsApp Status: CONNECTED ✅');
  } else if (qrCode) {
    console.log('📊 WhatsApp Status: WAITING FOR QR SCAN ⏳');
  } else {
    console.log('📊 WhatsApp Status: INITIALIZING 🔄');
  }
}, 60000);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down...');
  await client.destroy();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down...');
  await client.destroy();
  process.exit(0);
});