const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');
const express = require('express');
const axios = require('axios');
const fs = require('fs');
const { execSync } = require('child_process');
require('dotenv').config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';
const WEBHOOK_URL = process.env.WEBHOOK_URL || `${BACKEND_URL}/api/whatsapp/incoming`;
const WEBHOOK_TOKEN = process.env.WEBHOOK_TOKEN || '';

let clientReady = false;
let qrCode = null;

// ⭐ CHROMIUM CLEANUP - Agresif temizlik
const cleanupChromium = () => {
  console.log('🧹 Cleaning up Chromium processes and locks...');
  
  try {
    // Eski Chromium process'lerini öldür
    execSync('pkill -9 chromium || true', { stdio: 'ignore' });
  } catch (e) {
    // Ignore errors
  }
  
  // Lock dosyalarını temizle
  const lockPaths = [
    './data/chromium-profile/SingletonLock',
    './data/chromium-profile/SingletonSocket',
    './data/chromium-profile/SingletonCookie',
    './data/chromium-profile/lockfile'
  ];
  
  lockPaths.forEach(path => {
    try {
      if (fs.existsSync(path)) {
        fs.unlinkSync(path);
        console.log(`  ✓ Removed: ${path}`);
      }
    } catch (err) {
      console.warn(`  ⚠ Could not remove ${path}`);
    }
  });
  
  // Data klasörünü oluştur
  if (!fs.existsSync('./data/chromium-profile')) {
    fs.mkdirSync('./data/chromium-profile', { recursive: true });
    console.log('  ✓ Created chromium-profile directory');
  }
  
  console.log('🧹 Cleanup completed!');
};

// Başlangıçta temizlik
cleanupChromium();

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
      '--disable-default-apps',
      '--disable-extensions',
      '--disable-translate',
      '--disable-sync'
    ],
    userDataDir: './data/chromium-profile'
  },
  authTimeoutMs: 120000,
  qrMaxRetries: 5,
  restartOnAuthFail: true,
  takeoverOnConflict: true,
  takeoverTimeoutMs: 60000
});

// Events
client.on('qr', (qr) => {
  qrCode = qr;
  const timestamp = new Date().toLocaleString('tr-TR');
  console.log(`\n📱 [${timestamp}] QR CODE GENERATED`);
  console.log('⏰ Scan within 2 minutes\n');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  clientReady = true;
  qrCode = null;
  console.log('✅ WhatsApp client is ready!');
});

client.on('authenticated', () => {
  console.log('🔐 Authenticated successfully');
});

client.on('auth_failure', (msg) => {
  console.error('❌ Auth failed:', msg);
  clientReady = false;
  setTimeout(cleanupChromium, 2000);
});

client.on('disconnected', (reason) => {
  console.log('📴 Disconnected:', reason);
  clientReady = false;
  cleanupChromium();
});

// Message handler
client.on('message', async (message) => {
  try {
    if (message.isGroupMsg || !message.body?.trim()) return;

    const contact = await message.getContact();
    const fromPhone = message.from.replace('@c.us', '').replace(/[^0-9]/g, '');

    const payload = {
      channel: "whatsapp",
      from_phone: fromPhone,
      from_name: contact.pushname || contact.name || null,
      content: message.body,
      message_id: message.id._serialized,
      timestamp: message.timestamp
    };

    console.log('📩 Message →', fromPhone);
    
    // Prepare headers
    const headers = { 'Content-Type': 'application/json' };
    if (WEBHOOK_TOKEN) {
      headers['Authorization'] = `Bearer ${WEBHOOK_TOKEN}`;
    }
    
    const response = await axios.post(WEBHOOK_URL, payload, {
      headers,
      timeout: 10000
    });
    console.log(`✅ Delivered (${response.status})`);
  } catch (error) {
    console.error('❌ Webhook error:', error.message);
  }
});

// Endpoints (aynı kalacak, sadece kısaltıyorum)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    whatsapp: { ready: clientReady, hasQR: !!qrCode },
    timestamp: new Date().toISOString()
  });
});

app.get('/status', (req, res) => {
  res.json({
    connected: clientReady,
    hasQR: !!qrCode,
    timestamp: new Date().toISOString()
  });
});

app.get('/qr', (req, res) => {
  if (clientReady) return res.json({ status: 'connected', authenticated: true });
  if (qrCode) return res.json({ status: 'pending', qr: qrCode, expiresIn: '120s' });
  res.json({ status: 'initializing' });
});

app.get('/qr-display', async (req, res) => {
  if (clientReady) {
    return res.send(`<html><body style="text-align:center;padding:50px;font-family:Arial">
      <h1 style="color:green">✅ Connected!</h1></body></html>`);
  }
  if (qrCode) {
    const url = await QRCode.toDataURL(qrCode);
    return res.send(`<html><head><meta http-equiv="refresh" content="5"></head>
      <body style="text-align:center;padding:50px;font-family:Arial">
      <h1>📱 Scan QR Code</h1>
      <img src="${url}" style="width:400px;height:400px;border:2px solid #ccc"/>
      <p><strong style="color:#ff6b6b">⏰ 2 minutes</strong></p></body></html>`);
  }
  res.send(`<html><head><meta http-equiv="refresh" content="3"></head>
    <body style="text-align:center;padding:50px"><h1>⏳ Initializing...</h1></body></html>`);
});

app.post('/send', async (req, res) => {
  try {
    const { to, message } = req.body;
    if (!to || !message) return res.status(400).json({ success: false, error: 'Missing fields' });
    if (!clientReady) return res.status(503).json({ success: false, error: 'Not ready' });
    
    const chatId = to.includes('@') ? to : `${to.replace(/[^0-9]/g, '')}@c.us`;
    const result = await client.sendMessage(chatId, message);
    
    res.json({ success: true, messageId: result.id._serialized });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Service running on port ${PORT}`);
  console.log(`📡 Webhook: ${WEBHOOK_URL}`);
});

console.log('🔄 Initializing WhatsApp client...');
client.initialize();

// Shutdown
const shutdown = async () => {
  console.log('\n🛑 Shutting down...');
  cleanupChromium();
  await client.destroy();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);