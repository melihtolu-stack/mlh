# WhatsApp Service

Node.js service for WhatsApp Web API integration with CRM.

## 🚀 Quick Start

### Using Docker Compose (Recommended)

```bash
# From project root
docker-compose up -d whatsapp-service

# Get QR code
curl http://localhost:3001/qr

# Check status
curl http://localhost:3001/status
```

### Standalone Docker

```bash
# Build
docker build -t whatsapp-service .

# Run
docker run -d \
  -p 3001:3001 \
  -e BACKEND_URL=http://backend:8000 \
  -e WEBHOOK_URL=http://backend:8000/api/whatsapp/incoming \
  -v whatsapp-session:/app/data \
  --name whatsapp-service \
  whatsapp-service
```

## 📋 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Service port |
| `BACKEND_URL` | `http://localhost:8000` | Backend API URL |
| `WEBHOOK_URL` | `${BACKEND_URL}/api/whatsapp/incoming` | Webhook endpoint |
| `WEBHOOK_TOKEN` | _(empty)_ | Authentication token (optional) |
| `NODE_ENV` | `development` | Environment |

## 🔌 API Endpoints

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "whatsapp": {
    "ready": true,
    "hasQR": false
  },
  "timestamp": "2026-02-03T11:00:00.000Z"
}
```

### GET /status
WhatsApp connection status.

**Response:**
```json
{
  "connected": true,
  "hasQR": false,
  "timestamp": "2026-02-03T11:00:00.000Z"
}
```

### GET /qr
Get QR code for authentication.

**Response (if pending):**
```json
{
  "status": "pending",
  "qr": "2@xxxxxxxxxxxxx...",
  "expiresIn": "120s"
}
```

**Response (if connected):**
```json
{
  "status": "connected",
  "authenticated": true
}
```

### GET /qr-display
HTML page displaying QR code (auto-refresh).

Open in browser: `http://localhost:3001/qr-display`

### POST /send
Send WhatsApp message.

**Request:**
```json
{
  "to": "905551234567",
  "message": "Hello World!",
  "type": "text"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "xxxxx",
  "timestamp": 1234567890
}
```

## 🔄 Message Flow

```
WhatsApp → whatsapp-web.js → Webhook → Backend → Supabase → CRM
```

## 🐛 Troubleshooting

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues and solutions.

### Quick Fixes

**Service won't start:**
```bash
# Check logs
docker logs whatsapp-service -f

# Restart with cleanup
docker-compose restart whatsapp-service
```

**Chromium lock error:**
```bash
# Stop and remove volume
docker-compose down
docker volume rm whatsapp-session

# Restart (will require QR re-scan)
docker-compose up -d
```

## 🔐 Security

### Webhook Authentication (Optional)

Set `WEBHOOK_TOKEN` in both services:

```env
# whatsapp-service
WEBHOOK_TOKEN=your_secure_token

# backend
WEBHOOK_TOKEN=your_secure_token
```

Service will send:
```
Authorization: Bearer your_secure_token
```

Backend should verify this token.

## 📊 Resource Requirements

- **CPU:** 0.5-1 core
- **RAM:** 512MB-1GB
- **Disk:** ~500MB (image) + ~100MB (session)
- **Network:** Minimal (webhook calls)

## 🏗️ Architecture

### Dependencies

- `whatsapp-web.js@1.23.0` - WhatsApp Web API client
- `puppeteer` - Headless Chrome automation
- `express@4.18.2` - HTTP server
- `axios@1.6.7` - HTTP client

### Storage

- **Session data:** `/app/data` (must be persistent!)
- **Chromium profile:** `/app/data/chromium-profile` (auto-managed)

### How It Works

1. **Initialization:**
   - Cleans up old Chromium processes and locks
   - Launches headless Chromium
   - Connects to WhatsApp Web

2. **Authentication:**
   - Generates QR code
   - Waits for user to scan (2 min timeout)
   - Saves session to disk

3. **Message Handling:**
   - Listens for incoming messages
   - Filters (no groups, no empty)
   - Sends to backend webhook

4. **Graceful Shutdown:**
   - Closes WhatsApp client
   - Cleans up Chromium
   - Exits cleanly

## 🚀 Production Deployment

See parent directory docs:
- `COOLIFY_WHATSAPP_SETUP.md` - Coolify deployment
- `WHATSAPP_DEPLOYMENT_GUIDE.md` - General deployment guide

### Important for Production

1. **Use persistent volume** for `/app/data`
2. **Set proper memory limits** (min 512MB)
3. **Enable health checks** (endpoint: `/health`)
4. **Use internal network** for backend communication
5. **Set `WEBHOOK_TOKEN`** for security
6. **Monitor logs** for errors

## 📝 Changelog

### v2.0.0 (2026-02-03)
- ✅ Aggressive Chromium cleanup on startup
- ✅ Automatic lock file removal (recursive)
- ✅ Graceful shutdown with proper cleanup
- ✅ Retry logic on initialization failure
- ✅ Better error handling
- ✅ Webhook token authentication support
- ✅ HTML QR display page

### v1.0.0 (Initial)
- Basic WhatsApp Web integration
- QR authentication
- Message sending/receiving
- Webhook support

## 📄 License

Internal use only. See main project LICENSE.
