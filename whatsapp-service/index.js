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
// Mevcut client tanımını değiştirin:
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
  // ⭐ EKLENECEK SATIRLAR:
  authTimeoutMs: 120000, // 2 dakikaya çıkar (QR okutma için)
  qrMaxRetries: 5,        // 5 kez QR generate etsin
  restartOnAuthFail: true, // Auth fail olursa restart
  takeoverOnConflict: true, // Çakışmalarda devral
  takeoverTimeoutMs: 60000
});

// Get QR code endpoint - İYİLEŞTİRİLMİŞ VERSİYON
app.get('/qr', (req, res) => {
  if (clientReady) {
    return res.json({
      status: 'connected',
      message: 'WhatsApp is already connected',
      authenticated: true
    });
  }
  
  if (qrCode) {
    // QR'ı hem text hem de data URL olarak döndür
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

// ⭐ YENİ ENDPOINT: QR Kodu HTML olarak göster (tarayıcıdan direkt bakabilmek için)
app.get('/qr-display', (req, res) => {
  if (clientReady) {
    return res.send(`
      <html>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1 style="color: green;">✅ WhatsApp Connected!</h1>
          <p>WhatsApp client is ready and authenticated.</p>
        </body>
      </html>
    `);
  }
  
  if (qrCode) {
    const QRCode = require('qrcode');
    QRCode.toDataURL(qrCode, (err, url) => {
      res.send(`
        <html>
          <head>
            <meta http-equiv="refresh" content="5">
          </head>
          <body style="font-family: Arial; text-align: center; padding: 50px;">
            <h1>📱 Scan QR Code with WhatsApp</h1>
            <p>This page will refresh every 5 seconds</p>
            <img src="${url}" style="width: 400px; height: 400px;"/>
            <p><strong>Expires in: 2 minutes</strong></p>
            <p style="color: #666;">Open WhatsApp → Settings → Linked Devices → Link a Device</p>
          </body>
        </html>
      `);
    });
  } else {
    res.send(`
      <html>
        <head>
          <meta http-equiv="refresh" content="3">
        </head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1>⏳ Initializing WhatsApp Client...</h1>
          <p>QR code will appear here shortly. This page refreshes every 3 seconds.</p>
        </body>
      </html>
    `);
  }
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
