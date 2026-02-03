# 🚀 WhatsApp Service - Hızlı Başlangıç

## 📋 Önkoşullar

- Docker & Docker Compose yüklü
- Supabase projesi aktif
- WhatsApp telefonu hazır (QR kod tarayacak)

---

## ⚡ 3 Adımda Çalıştırma

### 1️⃣ Environment Variables

```bash
cd c:\Users\DELL\Desktop\mlh
cp .env.local.example .env.local
```

`.env.local` dosyasını düzenle ve Supabase bilgilerini ekle:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 2️⃣ Servisleri Başlat

```bash
docker-compose up -d
```

### 3️⃣ WhatsApp'ı Bağla

**Windows (PowerShell):**
```powershell
# QR kodu al
curl http://localhost:3001/qr | ConvertFrom-Json | Select-Object -ExpandProperty qr

# Veya browser'da aç
start http://localhost:3001/qr
```

**Linux/Mac:**
```bash
./scripts/get-whatsapp-qr.sh
```

WhatsApp uygulamanızda:
1. Ayarlar → Linked Devices
2. Link a Device
3. QR'u tara

---

## ✅ Test Etme

```bash
# Health check
curl http://localhost:3001/health

# Status kontrol
curl http://localhost:3001/status

# Test mesajı gönder (WhatsApp bağlandıktan sonra)
curl -X POST http://localhost:3001/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "905551234567",
    "message": "Test mesajı!"
  }'
```

---

## 🔍 Logları İzleme

```bash
# Tüm servisler
docker-compose logs -f

# Sadece WhatsApp
docker-compose logs -f whatsapp-service

# Sadece Backend
docker-compose logs -f backend
```

---

## 🎯 Başarı Göstergeleri

✅ `docker-compose ps` → Tüm servisler "Up" durumda
✅ `curl localhost:3001/status` → `"connected": true`
✅ WhatsApp'a test mesajı gönderildi ve teslim edildi
✅ WhatsApp'tan mesaj geldi ve CRM'de göründü

---

## 🐛 Sorun mu var?

### WhatsApp bağlanmıyor

```bash
# Logs kontrol
docker-compose logs whatsapp-service | tail -50

# Container restart
docker-compose restart whatsapp-service

# QR'u tekrar al
curl http://localhost:3001/qr
```

### Backend'e bağlanamıyor

```bash
# Network kontrol
docker exec -it mlh-whatsapp curl http://backend:8000/api/health

# Environment kontrol
docker exec -it mlh-whatsapp env | grep BACKEND
```

### Mesajlar CRM'de görünmüyor

```bash
# Backend webhook logs
docker-compose logs backend | grep whatsapp

# Supabase kontrol (psql)
docker exec -it mlh-backend bash
# Test Supabase connection
```

---

## 📚 Daha Fazla Bilgi

- Detaylı guide: `WHATSAPP_DEPLOYMENT_GUIDE.md`
- Coolify deployment: `WHATSAPP_DEPLOYMENT_GUIDE.md` → Coolify bölümü
- Troubleshooting: `WHATSAPP_DEPLOYMENT_GUIDE.md` → Sorun Giderme

---

## 🛑 Durdurma

```bash
# Servisleri durdur (verileri koru)
docker-compose stop

# Servisleri durdur ve sil
docker-compose down

# Servisleri durdur, sil ve volume'leri temizle (tüm veriler silinir!)
docker-compose down -v
```

⚠️ **NOT:** `docker-compose down -v` komutu WhatsApp session'ını siler, yeniden QR okutmak gerekir!
