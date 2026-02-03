# ☁️ Coolify - WhatsApp Service Setup

## 🎯 Özet

Bu guide Coolify'da 2 ayrı servis olarak WhatsApp entegrasyonunu kurar:
1. **backend-mlh** (Python FastAPI)
2. **whatsapp-service** (Node.js)

---

## 📦 Servis 1: Backend (Önce bu deploy edilmeli)

### Temel Ayarlar

```yaml
Service Name: backend-mlh
Repository: melihtolu-stack/mlh
Branch: master
Build Pack: Docker
Port: 8000
```

### Build Command

⚠️ **CRITICAL:** Coolify'da Dockerfile path bug'ı var, Build Command kullanın:

```bash
cd backend && docker build -f Dockerfile -t $IMAGE_NAME .
```

### Environment Variables

```env
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# WhatsApp Service (internal network - önerilen)
WHATSAPP_SERVICE_URL=http://whatsapp-service:3001

# VEYA WhatsApp Service (public URL - fallback)
# WHATSAPP_SERVICE_URL=https://whatsapp-mlh.heni.com.tr

# Webhook Security (önerilen)
WEBHOOK_TOKEN=your_secure_random_token_here_change_this

# Python
PYTHONUNBUFFERED=1

# SMTP (opsiyonel - email için)
SMTP_SERVER=smtp.hostinger.com
SMTP_PORT=465
SMTP_USERNAME=info@heni.com.tr
SMTP_PASSWORD=your_smtp_password
FROM_EMAIL=info@heni.com.tr
FROM_NAME=Heni
```

### Domain

```
backend-mlh.heni.com.tr
```

### Health Check

```yaml
Enabled: Yes
Endpoint: /api/health
Interval: 30s
Timeout: 10s
Start Period: 40s
```

---

## 📦 Servis 2: WhatsApp Service

### Temel Ayarlar

```yaml
Service Name: whatsapp-service
Repository: melihtolu-stack/mlh
Branch: master
Build Pack: Docker
Dockerfile Path: whatsapp-service/Dockerfile
Build Context: whatsapp-service
Port: 3001
```

⚠️ **NOT:** Eğer Dockerfile Path çalışmazsa, Build Command kullanın:

```bash
cd whatsapp-service && docker build -f Dockerfile -t $IMAGE_NAME .
```

### Environment Variables

**Seçenek A: Internal Network (Önerilen)**

```env
PORT=3001
NODE_ENV=production

# Backend internal URL (same network)
BACKEND_URL=http://backend-mlh:8000
WEBHOOK_URL=http://backend-mlh:8000/api/whatsapp/incoming

# Webhook Security
WEBHOOK_TOKEN=your_secure_random_token_here_change_this
```

**Seçenek B: Public URLs (Fallback)**

```env
PORT=3001
NODE_ENV=production

# Backend public URL
BACKEND_URL=https://backend-mlh.heni.com.tr
WEBHOOK_URL=https://backend-mlh.heni.com.tr/api/whatsapp/incoming

# Webhook Security
WEBHOOK_TOKEN=your_secure_random_token_here_change_this
```

### ⚠️ CRITICAL: Persistent Storage

**Volume Mount (MUTLAKA EKLE!):**

```yaml
Volume Name: whatsapp-session
Mount Path: /app/data
```

Bu olmadan her restart'ta QR kod okutmanız gerekir!

### Domain

```
whatsapp-mlh.heni.com.tr
```

### Health Check

```yaml
Enabled: Yes
Endpoint: /health
Interval: 30s
Timeout: 10s
Start Period: 60s
Retries: 3
```

---

## 🔗 Network Konfigürasyonu

### Internal Network (Önerilen)

Coolify'da her iki servisi de **aynı project/network**'te oluşturun.

**Avantajlar:**
- Daha hızlı (internal network)
- Daha güvenli
- Public internet'e çıkmaz

**Test:**
```bash
# Backend container'dan WhatsApp'a
docker exec -it <backend-container> curl http://whatsapp-service:3001/health

# WhatsApp container'dan Backend'e
docker exec -it <whatsapp-container> curl http://backend-mlh:8000/api/health
```

### Public URLs (Fallback)

Internal network çalışmazsa public URL'leri kullanın.

---

## 📱 WhatsApp'ı Bağlama

### Yöntem 1: Terminal Logs (En Kolay)

1. Coolify → whatsapp-service → **Logs**
2. QR kodu göreceksiniz (ASCII art)
3. WhatsApp'ta tara

### Yöntem 2: API Endpoint

```bash
curl https://whatsapp-mlh.heni.com.tr/qr
```

Response:
```json
{
  "status": "pending",
  "qr": "2@xxxxxxxxxxxxxxxxxxxxx..."
}
```

Bu QR string'i bir QR generator ile görselleştirin veya terminal'de `qrencode` kullanın.

### Yöntem 3: Browser (Geliştirilecek)

Gelecekte admin panel'e QR gösterimi eklenebilir.

---

## ✅ Deployment Checklist

### Pre-deployment

- [ ] Supabase projesi hazır
- [ ] GitHub repo push'landı (`master` branch)
- [ ] WhatsApp telefonu hazır

### Backend Deployment

- [ ] Coolify'da backend servisi oluşturuldu
- [ ] Build Command ayarlandı
- [ ] Environment variables tanımlandı
- [ ] Domain atandı (backend-mlh.heni.com.tr)
- [ ] Build başarılı (logs kontrol)
- [ ] Health check: `curl https://backend-mlh.heni.com.tr/api/health`
- [ ] Response: `{"status":"healthy",...}`

### WhatsApp Service Deployment

- [ ] Coolify'da whatsapp-service oluşturuldu
- [ ] Build Context: `whatsapp-service` ayarlandı
- [ ] Environment variables tanımlandı
- [ ] **Volume mount ayarlandı** (`/app/data`)
- [ ] Domain atandı (whatsapp-mlh.heni.com.tr)
- [ ] Build başarılı (logs kontrol)
- [ ] Health check: `curl https://whatsapp-mlh.heni.com.tr/health`

### WhatsApp Connection

- [ ] QR kodu alındı (logs veya `/qr` endpoint)
- [ ] QR kodu WhatsApp'ta tarandı
- [ ] Status check: `curl https://whatsapp-mlh.heni.com.tr/status`
- [ ] Response: `{"connected": true, ...}`

### Integration Test

- [ ] Backend → WhatsApp: `curl https://backend-mlh.heni.com.tr/api/whatsapp/health`
- [ ] Response: `{"whatsapp_ready": true, ...}`
- [ ] WhatsApp'tan test mesajı gönderildi
- [ ] Mesaj CRM'de göründü

---

## 🧪 Test Script

```bash
#!/bin/bash

BACKEND="https://backend-mlh.heni.com.tr"
WHATSAPP="https://whatsapp-mlh.heni.com.tr"

echo "🧪 Testing Coolify Deployment"
echo ""

# Backend health
echo "1. Backend Health..."
curl -s "$BACKEND/api/health" | jq .

# WhatsApp health
echo ""
echo "2. WhatsApp Service Health..."
curl -s "$WHATSAPP/health" | jq .

# WhatsApp status
echo ""
echo "3. WhatsApp Connection Status..."
curl -s "$WHATSAPP/status" | jq .

# Backend ↔ WhatsApp integration
echo ""
echo "4. Backend WhatsApp Integration..."
curl -s "$BACKEND/api/whatsapp/health" | jq .

echo ""
echo "✅ Test completed!"
```

---

## 🐛 Troubleshooting

### Problem 1: Build Failed

**Logs'ta:** `Error: Cannot find module`

**Çözüm:**
- `package.json` ve `requirements.txt` doğru mu?
- Build Command doğru directory'de mi çalışıyor?

---

### Problem 2: Health Check Failed

**Logs'ta:** `Failed to launch browser` veya `chromium not found`

**Çözüm:**
- `whatsapp-service/Dockerfile` içinde Chromium dependencies var mı?
- Build logs'u kontrol et, apt-get install başarılı mı?

---

### Problem 3: WhatsApp ↔ Backend Connection Failed

**Logs'ta:** `ECONNREFUSED` veya `Webhook timeout`

**Test:**
```bash
# WhatsApp container'dan
docker exec -it <whatsapp-container-id> sh
curl http://backend-mlh:8000/api/health
```

**Çözüm:**
- Environment variable kontrolü: `BACKEND_URL` doğru mu?
- Network: Aynı Coolify project/network'te mi?
- Fallback: Public URL dene (`https://backend-mlh.heni.com.tr`)

---

### Problem 4: Session Lost (QR Sürekli Soruluyor)

**Sebep:** Volume mount yok

**Çözüm:**
1. Coolify → whatsapp-service → **Storage**
2. Volume ekle:
   - Name: `whatsapp-session`
   - Mount Path: `/app/data`
3. Redeploy

---

### Problem 5: Mesajlar CRM'de Görünmüyor

**Debug:**

1. **WhatsApp logs:**
   ```
   Coolify → whatsapp-service → Logs
   ```
   Şunu arıyoruz: `✅ Webhook delivered (200)`

2. **Backend logs:**
   ```
   Coolify → backend-mlh → Logs
   ```
   Şunu arıyoruz: `INFO: Processed WhatsApp message`

3. **Supabase kontrol:**
   ```sql
   SELECT * FROM customers WHERE phone LIKE '%905%';
   SELECT * FROM conversations WHERE channel = 'whatsapp';
   SELECT * FROM messages ORDER BY sent_at DESC LIMIT 10;
   ```

---

## 🔐 Güvenlik İyileştirmeleri (Opsiyonel)

### 1. Webhook Token Authentication

Backend ve WhatsApp Service'de aynı `WEBHOOK_TOKEN` kullanın.

### 2. QR Endpoint Güvenliği

Production'da `/qr` endpoint'ini disable edin veya admin authentication ekleyin.

### 3. Rate Limiting

Backend'de rate limiting middleware ekleyin.

---

## 📊 Monitoring

### Metrics to Monitor

- **Health checks:** Her iki servis de yeşil mi?
- **Logs:** Error/warning var mı?
- **WhatsApp status:** `connected: true` mi?
- **Message flow:** Webhook 200 dönüyor mu?

### Coolify Monitoring

1. **Dashboard** → Her iki servisin durumunu görün
2. **Logs** → Real-time log stream
3. **Metrics** → CPU, memory, network kullanımı

---

## 🎉 Başarılı Deployment!

Tebrikler! WhatsApp CRM entegrasyonu hazır:

✅ Backend API çalışıyor
✅ WhatsApp Service bağlı
✅ Mesajlar CRM'de görünüyor
✅ Session persist ediliyor

**Artık yapabilirsiniz:**
- WhatsApp'tan mesaj alın → CRM'de görün
- CRM'den mesaj gönderin (gelecek özellik)
- Çoklu dil desteği (otomatik çeviri)
- Lead/contact yönetimi

---

## 📞 Destek

Sorun devam ederse:

1. **Logs kontrol edin** (her iki serviste)
2. **Health endpoint'leri test edin**
3. **Network connectivity kontrol edin**
4. Bu guide'ı baştan gözden geçirin

---

## 📝 Next Steps

- [ ] Admin panel'e QR gösterimi ekle
- [ ] CRM'den WhatsApp mesajı gönderme
- [ ] Mesaj template'leri
- [ ] Webhook retry mechanism
- [ ] Message queue (RabbitMQ/Redis)
