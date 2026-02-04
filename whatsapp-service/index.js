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
    execSync('pkill -9 chrome || true', { stdio: 'ignore' });
    console.log('  ✓ Killed existing Chromium processes');
  } catch (e) {
    // Ignore errors
  }
  
  // Tüm lock dosyalarını bul ve temizle (recursive)
  const findAndRemoveLocks = (dir) => {
    if (!fs.existsSync(dir)) return;
    
    try {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      
      items.forEach(item => {
        const fullPath = `${dir}/${item.name}`;
        
        if (item.isDirectory()) {
          findAndRemoveLocks(fullPath);
        } else if (
          item.name === 'SingletonLock' ||
          item.name === 'SingletonSocket' ||
          item.name === 'SingletonCookie' ||
          item.name === 'lockfile' ||
          item.name.includes('lock')
        ) {
          try {
            fs.unlinkSync(fullPath);
            console.log(`  ✓ Removed: ${fullPath}`);
          } catch (err) {
            console.warn(`  ⚠ Could not remove ${fullPath}:`, err.message);
          }
        }
      });
    } catch (err) {
      console.warn(`  ⚠ Error scanning ${dir}:`, err.message);
    }
  };
  
  // Data klasörünü oluştur
  if (!fs.existsSync('./data')) {
    fs.mkdirSync('./data', { recursive: true });
    console.log('  ✓ Created data directory');
  }
  
  // Tüm lock dosyalarını temizle
  findAndRemoveLocks('./data');
  
  console.log('✅ Cleanup completed!');
};

// Force cleanup on startup (with delay)
const forceCleanupOnStartup = () => {
  console.log('🔄 Starting force cleanup...');
  cleanupChromium();
  
  // Wait a bit before initializing client
  return new Promise(resolve => {
    setTimeout(() => {
      console.log('✅ Ready to initialize client');
      resolve();
    }, 2000);
  });
};

// Initialize WhatsApp client
const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: './data',
    clientId: 'mlh-crm-client' // Unique client ID
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
      '--disable-sync',
      '--disable-session-crashed-bubble',
      '--disable-infobars',
      '--disable-blink-features=AutomationControlled'
    ],
    timeout: 60000 // 60 seconds for puppeteer launch
  },
  authTimeoutMs: 180000, // 3 minutes (increased from 2)
  qrMaxRetries: 10, // More retries
  restartOnAuthFail: true,
  takeoverOnConflict: true,
  takeoverTimeoutMs: 120000 // 2 minutes (increased from 1)
});

// Events
client.on('qr', (qr) => {
  qrCode = qr;
  const timestamp = new Date().toLocaleString('tr-TR');
  console.log(`\n📱 [${timestamp}] QR CODE GENERATED`);
  console.log('⏰ Scan within 3 minutes\n');
  qrcode.generate(qr, { small: true });
});

client.on('loading_screen', (percent, message) => {
  console.log(`⏳ Loading: ${percent}% - ${message}`);
});

// Track state changes to detect loops
let stateChanges = [];
let lastStateChangeTime = Date.now();

client.on('change_state', (state) => {
  const now = Date.now();
  const timeSinceLastChange = now - lastStateChangeTime;
  lastStateChangeTime = now;
  
  console.log(`🔄 State changed to: ${state} (after ${timeSinceLastChange}ms)`);
  
  // Track last 10 state changes
  stateChanges.push({ state, time: now });
  if (stateChanges.length > 10) {
    stateChanges.shift();
  }
  
  // Detect connection loop (same states repeating quickly)
  if (stateChanges.length >= 6) {
    const recentStates = stateChanges.slice(-6).map(s => s.state);
    const firstThree = recentStates.slice(0, 3).join(',');
    const lastThree = recentStates.slice(3, 6).join(',');
    
    if (firstThree === lastThree) {
      console.error('⚠️ CONNECTION LOOP DETECTED!');
      console.error('🔄 States repeating:', firstThree);
      console.error('💡 Possible causes:');
      console.error('   1. Session corruption - Delete volume and rescan QR');
      console.error('   2. Network issue - Check connectivity');
      console.error('   3. WhatsApp conflict - Another device using same number');
      console.error('   4. Memory issue - Increase container memory');
      console.error('');
      console.error('🛠️ Recommended action: Stop service, delete volume, restart, rescan QR');
      
      // Clear state tracking to avoid spam
      stateChanges = [];
    }
  }
});

client.on('ready', () => {
  clientReady = true;
  qrCode = null;
  const timestamp = new Date().toLocaleString('tr-TR');
  console.log(`✅ WhatsApp client is ready! [${timestamp}]`);
  console.log('🎉 You can now send and receive messages!');
});

client.on('authenticated', () => {
  const timestamp = new Date().toLocaleString('tr-TR');
  console.log(`🔐 Authenticated successfully [${timestamp}]`);
  console.log('⏳ Waiting for WhatsApp to connect...');
});

client.on('auth_failure', (msg) => {
  const timestamp = new Date().toLocaleString('tr-TR');
  console.error(`❌ Auth failed [${timestamp}]:`, msg);
  console.error('🔄 Will retry with cleanup...');
  clientReady = false;
  setTimeout(() => {
    cleanupChromium();
    console.log('💡 Please scan QR code again when it appears');
  }, 2000);
});

client.on('disconnected', (reason) => {
  const timestamp = new Date().toLocaleString('tr-TR');
  console.log(`📴 Disconnected [${timestamp}]:`, reason);
  clientReady = false;
  
  // Handle different disconnect reasons
  if (reason === 'CONFLICT') {
    console.error('⚠️ CONFLICT: Another WhatsApp Web session detected!');
    console.error('💡 Action: Close other WhatsApp Web/Desktop instances');
    cleanupChromium();
  } else if (reason === 'NAVIGATION') {
    console.error('⚠️ NAVIGATION: Page navigation detected');
    console.error('🔄 Will attempt reconnect after cleanup...');
    cleanupChromium();
  } else if (reason === 'UNPAIRED') {
    console.error('⚠️ UNPAIRED: Session expired or device was unlinked');
    console.error('💡 Action: Need to scan QR code again');
    cleanupChromium();
  } else if (reason === 'LOGOUT') {
    console.error('⚠️ LOGOUT: User logged out from WhatsApp');
    console.error('💡 Action: Need to scan QR code again');
    cleanupChromium();
  } else {
    console.log('🔄 Client will attempt to reconnect...');
    // Don't cleanup for minor disconnects
  }
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

// Start Express server
app.listen(PORT, () => {
  console.log(`🚀 Service running on port ${PORT}`);
  console.log(`📡 Webhook: ${WEBHOOK_URL}`);
});

// Initialize WhatsApp client with cleanup
(async () => {
  try {
    console.log('🔄 Starting initialization sequence...');
    
    // Force cleanup before starting
    await forceCleanupOnStartup();
    
    console.log('🔄 Initializing WhatsApp client...');
    await client.initialize();
    
    console.log('✅ WhatsApp client initialization started successfully');
  } catch (error) {
    console.error('❌ Failed to initialize WhatsApp client:', error);
    console.error('🔄 Attempting recovery...');
    
    // Try cleanup and restart
    await forceCleanupOnStartup();
    
    try {
      await client.initialize();
      console.log('✅ WhatsApp client recovered and initialized');
    } catch (retryError) {
      console.error('❌ Recovery failed:', retryError);
      console.error('🛑 Service will continue running, but WhatsApp client is not available');
      console.error('💡 Try restarting the container');
    }
  }
})();

// Graceful shutdown
let isShuttingDown = false;

const shutdown = async (signal) => {
  if (isShuttingDown) {
    console.log('⚠️ Already shutting down...');
    return;
  }
  
  isShuttingDown = true;
  console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
  
  try {
    // Close WhatsApp client
    if (client) {
      console.log('📴 Closing WhatsApp client...');
      await Promise.race([
        client.destroy(),
        new Promise(resolve => setTimeout(resolve, 5000)) // 5s timeout
      ]);
      console.log('✅ WhatsApp client closed');
    }
  } catch (error) {
    console.error('⚠️ Error closing WhatsApp client:', error.message);
  }
  
  try {
    // Cleanup Chromium
    console.log('🧹 Final cleanup...');
    cleanupChromium();
    console.log('✅ Cleanup completed');
  } catch (error) {
    console.error('⚠️ Error during cleanup:', error.message);
  }
  
  console.log('👋 Goodbye!');
  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGQUIT', () => shutdown('SIGQUIT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  shutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit on unhandled rejection, just log it
});