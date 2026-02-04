# 🔄 Reset WhatsApp Session

## When to Reset

Reset session if you experience:
- ❌ Connection loop (OPENING → PAIRING → CONNECTED → repeat)
- ❌ Client never reaches "ready" state
- ❌ "CONFLICT" disconnections
- ❌ "Session expired" errors
- ❌ Messages not being received

## 🚀 Reset Procedure

### For Coolify Deployment

1. **Stop the Service**
   - Go to: Coolify → whatsapp-service
   - Click: **Stop**
   - Wait for service to fully stop

2. **Delete the Volume**
   - Go to: Storage or Volumes section
   - Find: `whatsapp-session` volume
   - Click: **Delete** or **Remove**
   - Confirm deletion

3. **Start the Service**
   - Click: **Start**
   - Wait for service to initialize (30-60s)

4. **Get QR Code**
   - Browser: `http://whatsapp-service.heni.com.tr/qr-display`
   - Or check Coolify logs (ASCII QR code)

5. **Scan QR Code**
   - WhatsApp app → Settings → Linked Devices
   - Link a Device → Scan QR
   - **Complete within 3 minutes!**

6. **Verify Connection**
   ```bash
   curl http://whatsapp-service.heni.com.tr/status
   # Should return: "connected": true
   ```

### For Docker Compose

```bash
# Stop service
docker-compose stop whatsapp-service

# Remove volume
docker volume rm mlh_whatsapp-session

# Start service
docker-compose up -d whatsapp-service

# Get QR code
curl http://localhost:3001/qr-display
# Or: docker-compose logs whatsapp-service
```

### For Standalone Docker

```bash
# Stop and remove container
docker stop whatsapp-service
docker rm whatsapp-service

# Remove volume
docker volume rm whatsapp-session

# Run container again
docker run -d \
  -p 3001:3001 \
  -v whatsapp-session:/app/data \
  --name whatsapp-service \
  whatsapp-service

# Check logs for QR
docker logs whatsapp-service -f
```

## ⚠️ Important Notes

1. **Volume Deletion = Lost Session**
   - You will need to scan QR code again
   - Previous session cannot be recovered
   - This is expected and necessary

2. **Timing**
   - QR code expires in **3 minutes**
   - Scan immediately when it appears
   - If missed, wait for retry (auto-generates new QR)

3. **Multiple Devices**
   - Only one WhatsApp Web session allowed per number
   - Close other WhatsApp Web/Desktop instances first
   - Mobile app must have internet connection

## ✅ Success Indicators

After reset, you should see in logs:

```
🧹 Cleaning up Chromium processes and locks...
✅ Cleanup completed!
🔄 Initializing WhatsApp client...
📱 QR CODE GENERATED
⏰ Scan within 3 minutes

[QR CODE ASCII ART]

🔐 Authenticated successfully
⏳ Loading: 20% - Syncing...
⏳ Loading: 60% - Loading contacts...
✅ WhatsApp client is ready!
🎉 You can now send and receive messages!
```

Status check:
```bash
curl http://whatsapp-service.heni.com.tr/status
# {"connected": true, "hasQR": false}
```

## 🐛 If Problems Persist

### 1. Check Coolify Logs
Look for specific error messages.

### 2. Verify Environment Variables
```env
BACKEND_URL=https://backend-mlh.heni.com.tr
WEBHOOK_URL=https://backend-mlh.heni.com.tr/api/whatsapp/incoming
```

### 3. Check Memory
Container needs at least **512MB RAM**.

### 4. Network Connectivity
Test if container can reach WhatsApp servers:
```bash
docker exec whatsapp-service ping -c 3 web.whatsapp.com
```

### 5. Update whatsapp-web.js
If using old version, update:
```bash
# In whatsapp-service directory
npm install whatsapp-web.js@latest
# Rebuild Docker image
```

## 📞 Emergency: Manual Cleanup

If volume deletion doesn't work:

```bash
# Access the volume
docker run --rm -it -v whatsapp-session:/data alpine sh

# Inside container:
rm -rf /data/*
exit

# Restart service
docker-compose restart whatsapp-service
```

## 🔄 Prevention

To avoid frequent resets:

1. ✅ Use persistent volume (don't delete casually)
2. ✅ Allocate sufficient memory (512MB-1GB)
3. ✅ Keep whatsapp-web.js updated
4. ✅ Monitor logs for early warnings
5. ✅ Don't run multiple WhatsApp Web instances
6. ✅ Keep mobile app online and updated

## 📊 Reset Frequency

- **Normal:** Never or very rarely
- **After updates:** May need 1 reset
- **Daily/weekly:** Indicates underlying problem (check logs, memory, network)
