const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
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
  }
});

// QR Code event - display in terminal
client.on('qr', (qr) => {
  qrCode = qr;
  console.log('\n📱 Scan this QR code with WhatsApp:\n');
  qrcode.generate(qr, { small: true });
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

client.on('message', async (message) => {
  try {
    // ❌ grup mesajlarını alma (CRM için genelde istenmez)
    if (message.isGroupMsg) return;

    // ❌ boş mesaj / medya placeholder koruması
    if (!message.body || message.body.trim() === '') return;

    const contact = await message.getContact();

    // 📞 telefon numarasını normalize et
    const fromPhoneRaw = message.from.replace('@c.us', '');
    const fromPhone = fromPhoneRaw.replace(/[^0-9]/g, '');

    // ✅ BACKEND İLE %100 UYUMLU PAYLOAD
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

// Get QR code endpoint
app.get('/qr', (req, res) => {
  if (clientReady) {
    return res.json({
      status: 'connected',
      message: 'WhatsApp is already connected'
    });
  }
  
  if (qrCode) {
    return res.json({
      status: 'pending',
      qr: qrCode
    });
  }
  
  res.json({
    status: 'initializing',
    message: 'QR code not yet available, please wait...'
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

// Get connection status
app.get('/status', (req, res) => {
  res.json({
    connected: clientReady,
    hasQR: !!qrCode,
    timestamp: new Date().toISOString()
  });
});

// Start Express server
app.listen(PORT, () => {
  console.log(`🚀 WhatsApp service running on port ${PORT}`);
  console.log(`📡 Webhook URL: ${WEBHOOK_URL}`);
});

// Initialize WhatsApp client
console.log('🔄 Initializing WhatsApp client...');
client.initialize();

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
