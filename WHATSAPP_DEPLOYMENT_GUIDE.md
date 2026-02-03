# 📱 WhatsApp Service Deployment Guide

## 🎯 Amaç

WhatsApp Web API entegrasyonu ile gelen mesajları CRM panelinde yönetmek.

---

## 🚀 Hızlı Başlangıç (Lokal Test)

### 1. Environment Variables Hazırlama

```bash
# Ana dizinde .env.local oluştur
cp .env.local.example .env.local

# Supabase bilgilerini doldur
# Supabase Dashboard → Settings → API
```

### 2. Docker Compose ile Çalıştırma

```bash
cd c:\Users\DELL\Desktop\mlh

# Servisleri başlat
docker-compose up -d

# Logları izle
docker-compose logs -f whatsapp-service
```

### 3. WhatsApp QR Kod Okutma

```bash
# QR kodunu al
curl http://localhost:3001/qr

# Veya browser'da aç
# http://localhost:3001/qr

# WhatsApp uygulamasında Linked Devices → Link a Device
# QR kodu tara
```

### 4. Test Etme

```bash
# Health check
curl http://localhost:3001/health

# Status kontrol
curl http://localhost:3001/status

# Backend webhook kontrol
curl http://localhost:8000/api/whatsapp/health
```

---

## ☁️ Coolify Deployment

### Servis 1: Backend (Python FastAPI)

**Ayarlar:**
```yaml
Service Name: backend-mlh
Repository: melihtolu-stack/mlh
Branch: master
Build Pack: Docker
Build Command: cd backend && docker build -f Dockerfile -t $IMAGE_NAME .
Port: 8000
```

**Environment Variables:**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
WHATSAPP_SERVICE_URL=http://whatsapp-service:3001
PYTHONUNBUFFERED=1
```

**Health Check:**
- Endpoint: `/api/health`
- Interval: 30s

---

### Servis 2: WhatsApp Service (Node.js)

**Ayarlar:**
```yaml
Service Name: whatsapp-service
Repository: melihtolu-stack/mlh
Branch: master
Build Pack: Docker
Dockerfile Path: whatsapp-service/Dockerfile
Build Context: whatsapp-service
Port: 3001
```

**Environment Variables:**
```env
PORT=3001
BACKEND_URL=http://backend-mlh:8000
WEBHOOK_URL=http://backend-mlh:8000/api/whatsapp/incoming
NODE_ENV=production
```

**⚠️ CRITICAL - Persistent Volume:**
```yaml
Volumes:
  - /app/data
```

**Health Check:**
- Endpoint: `/health`
- Interval: 30s
- Start Period: 60s

---

### Servis 3: Frontend (Next.js)

Frontend'i ayrı bir servis olarak deploy edebilirsiniz (mevcut deployment'ınız).

**Environment Variables (eklenmesi gerekenler):**
```env
BACKEND_URL=https://backend-mlh.heni.com.tr
```

---

## 🔗 Network Konfigürasyonu

Coolify'da servisler arasında iletişim için **internal network** kullanın:

### Seçenek 1: Internal Network (Önerilen)

```env
# Backend → WhatsApp Service
WHATSAPP_SERVICE_URL=http://whatsapp-service:3001

# WhatsApp Service → Backend
BACKEND_URL=http://backend-mlh:8000
WEBHOOK_URL=http://backend-mlh:8000/api/whatsapp/incoming
```

**Avantajlar:**
- Daha hızlı (internal network)
- Daha güvenli (public internet'e çıkmaz)

### Seçenek 2: Public URLs

```env
# WhatsApp Service → Backend
BACKEND_URL=https://backend-mlh.heni.com.tr
WEBHOOK_URL=https://backend-mlh.heni.com.tr/api/whatsapp/incoming
```

**Ne zaman kullanılır:**
- Internal network çalışmıyorsa
- Servisler farklı server'larda ise

---

## 📱 WhatsApp QR Kod Okutma (Production)

### 1. QR Endpoint'i Oluşturma

Backend'e QR kod endpoint'i ekleyeceğiz (güvenli, sadece admin).

### 2. QR Kodu Alma

**Option A: Browser'da**
```
https://whatsapp-mlh.heni.com.tr/qr
```

**Option B: Terminal'de**
```bash
# Coolify logs açın, QR kodu göreceksiniz
# WhatsApp Service → Logs
```

**Option C: API ile**
```bash
curl https://whatsapp-mlh.heni.com.tr/qr
```

### 3. WhatsApp'ta QR Okutma

1. WhatsApp uygulamasını aç
2. Ayarlar → Linked Devices
3. "Link a Device" tıkla
4. QR kodu tara

### 4. Doğrulama

```bash
curl https://whatsapp-mlh.heni.com.tr/status

# Response:
{
  "connected": true,
  "hasQR": false,
  "timestamp": "..."
}
```

---

## 🔄 Mesaj Akışı

```
WhatsApp → WhatsApp Service → Backend Webhook → Supabase → CRM Panel
```

**Detaylı Akış:**

1. **Kullanıcı mesaj gönderir** (WhatsApp'tan)
2. **WhatsApp Service alır** (`index.js` - `message` event)
3. **Backend webhook'a POST eder** (`/api/whatsapp/incoming`)
4. **Backend işler:**
   - Dil algılama
   - Türkçe'ye çeviri (gerekirse)
   - Customer/Conversation/Message oluşturma
   - Supabase'e kaydetme
5. **CRM Panel'de görünür** (real-time Supabase subscription)

---

## 🐛 Sorun Giderme

### Hata 1: "WhatsApp client is not ready"

**Sebep:** QR kod okutulmamış

**Çözüm:**
```bash
# QR'u tekrar al
curl https://whatsapp-mlh.heni.com.tr/qr

# QR'u okut
# Status kontrol
curl https://whatsapp-mlh.heni.com.tr/status
```

---

### Hata 2: "Failed to launch browser"

**Sebep:** Chromium dependencies eksik

**Çözüm:**
```bash
# Container'a bağlan
docker exec -it mlh-whatsapp bash

# Chromium kontrol
chromium --version

# Yoksa Dockerfile'ı kontrol et
```

---

### Hata 3: "Webhook timeout" / "ECONNREFUSED"

**Sebep:** Backend'e erişilemiyor

**Çözüm:**

**A. Internal network kontrol:**
```bash
# WhatsApp container içinden
docker exec -it mlh-whatsapp bash
curl http://backend:8000/api/health
```

**B. Environment variable kontrol:**
```bash
docker exec -it mlh-whatsapp env | grep BACKEND
```

**C. Coolify'da same network'te mi?**
- Her iki servis de aynı project/network'te olmalı

---

### Hata 4: Session kayboluyor (QR sürekli sorulur)

**Sebep:** Persistent volume yok

**Çözüm:**

**Coolify'da Volume tanımla:**
```yaml
Volumes:
  - /app/data
```

**Docker Compose'da:**
```yaml
volumes:
  - whatsapp-session:/app/data
```

---

### Hata 5: Mesajlar CRM'de görünmüyor

**Kontroller:**

**1. WhatsApp Service → Backend bağlantı:**
```bash
# WhatsApp service logs
docker logs mlh-whatsapp -f

# Şunu görmelisin:
# ✅ Webhook delivered (200)
```

**2. Backend logs:**
```bash
docker logs mlh-backend -f

# Şunu görmelisin:
# INFO: Processed WhatsApp message from 905xxxxxxxx
```

**3. Supabase kontrol:**
```sql
-- Customers tablosunda var mı?
SELECT * FROM customers WHERE phone = '905xxxxxxxx';

-- Conversations tablosunda var mı?
SELECT * FROM conversations WHERE channel = 'whatsapp';

-- Messages tablosunda var mı?
SELECT * FROM messages ORDER BY sent_at DESC LIMIT 10;
```

**4. Frontend logs:**
- Browser Console'da hata var mı?
- Network tab'da API çağrıları başarılı mı?

---

## 📊 Monitoring & Health Checks

### WhatsApp Service Health

```bash
curl https://whatsapp-mlh.heni.com.tr/health

# Response:
{
  "status": "ok",
  "whatsapp": {
    "ready": true,
    "hasQR": false
  },
  "timestamp": "2026-02-01T..."
}
```

### Backend WhatsApp Health

```bash
curl https://backend-mlh.heni.com.tr/api/whatsapp/health

# Response:
{
  "status": "ok",
  "whatsapp_service": "connected",
  "whatsapp_ready": true,
  "has_qr": false
}
```

---

## 🔐 Güvenlik Önerileri

### 1. QR Endpoint Güvenliği

QR endpoint'ini sadece admin kullanıcılar görmeli:

**Backend'e ekleyin:**
```python
@router.get("/qr")
async def get_qr_code(current_user: User = Depends(get_admin_user)):
    """Get WhatsApp QR code (admin only)"""
    whatsapp_service = get_whatsapp_service()
    qr = await whatsapp_service.get_qr_code()
    return {"qr": qr}
```

### 2. Webhook Authentication

Webhook endpoint'ine token ekleyin:

**WhatsApp Service:**
```javascript
const WEBHOOK_TOKEN = process.env.WEBHOOK_TOKEN;

const response = await axios.post(WEBHOOK_URL, payload, {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${WEBHOOK_TOKEN}`
  }
});
```

**Backend:**
```python
@router.post("/incoming")
async def handle_incoming_whatsapp(
    request: WhatsAppIncomingRequest,
    authorization: str = Header(None)
):
    # Verify token
    if authorization != f"Bearer {WEBHOOK_TOKEN}":
        raise HTTPException(401, "Unauthorized")
    # ...
```

### 3. Rate Limiting

Backend'e rate limiting ekleyin (brute force koruması).

---

## 📝 Deployment Checklist

### Backend Deployment:

- [ ] Coolify'da backend servisi oluşturuldu
- [ ] Environment variables tanımlandı (Supabase, WHATSAPP_SERVICE_URL)
- [ ] Build başarılı (cache'siz)
- [ ] Health check 200 dönüyor
- [ ] `/api/whatsapp/incoming` endpoint erişilebilir

### WhatsApp Service Deployment:

- [ ] Coolify'da whatsapp-service oluşturuldu
- [ ] Dockerfile path doğru (whatsapp-service/Dockerfile)
- [ ] Environment variables tanımlandı (BACKEND_URL, WEBHOOK_URL)
- [ ] **Persistent volume tanımlandı** (`/app/data`)
- [ ] Build başarılı
- [ ] Health check 200 dönüyor
- [ ] QR endpoint erişilebilir

### Network & Integration:

- [ ] Backend ↔ WhatsApp Service iletişimi çalışıyor
- [ ] QR kod okundu, WhatsApp bağlandı
- [ ] Test mesajı gönderildi
- [ ] Mesaj CRM'de görünüyor

---

## 🧪 Test Script

```bash
#!/bin/bash

echo "🧪 WhatsApp Service Test Script"
echo "================================"

# 1. Health checks
echo ""
echo "1️⃣ Health Checks..."
curl -s http://localhost:3001/health | jq .
curl -s http://localhost:8000/api/health | jq .

# 2. WhatsApp status
echo ""
echo "2️⃣ WhatsApp Status..."
curl -s http://localhost:3001/status | jq .

# 3. Backend WhatsApp health
echo ""
echo "3️⃣ Backend WhatsApp Health..."
curl -s http://localhost:8000/api/whatsapp/health | jq .

# 4. Send test message (if connected)
echo ""
echo "4️⃣ Send Test Message..."
curl -X POST http://localhost:3001/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "905551234567",
    "message": "Test mesajı - CRM WhatsApp Integration"
  }' | jq .

echo ""
echo "✅ Test tamamlandı!"
```

---

## 📞 Destek

Sorun devam ederse:

1. **Logs kontrol edin:**
   ```bash
   docker-compose logs -f whatsapp-service
   docker-compose logs -f backend
   ```

2. **Health endpoint'leri kontrol edin**

3. **Network connectivity test edin:**
   ```bash
   docker exec -it mlh-whatsapp curl http://backend:8000/api/health
   ```

4. **Supabase bağlantısını test edin**

---

## 🎉 Başarılı Deployment Göstergeleri

✅ WhatsApp Service health: `"ready": true`
✅ Backend WhatsApp health: `"whatsapp_ready": true`
✅ Test mesajı CRM'de göründü
✅ Gelen mesajlar real-time CRM'de gösteriliyor
✅ Dil algılama ve çeviri çalışıyor
✅ Session persist ediliyor (QR tekrar sorulmuyor)
