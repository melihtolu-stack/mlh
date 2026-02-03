# 🚀 WhatsApp CRM - BAŞLANGIÇ REHBERİ

## 📌 Önemli!

WhatsApp servisi için gerekli tüm konfigürasyonlar hazırlandı. Şimdi ne yapmanız gerektiğini adım adım anlatıyorum.

---

## 🎯 Seçenekler

### Seçenek 1: Lokal Test (Önerilen - Önce Bunu Dene!)

Coolify'a deploy etmeden önce lokal'de test edin:

```bash
cd c:\Users\DELL\Desktop\mlh
```

**Adımlar:**
1. [WHATSAPP_QUICKSTART.md](./WHATSAPP_QUICKSTART.md) dosyasını aç
2. Adım adım takip et (3 adım, 5 dakika)
3. WhatsApp bağlan, test et
4. Sorun yoksa Coolify'a geç

### Seçenek 2: Doğrudan Coolify'a Deploy

Eğer lokal test yapmak istemiyorsan:

```bash
# Önce kodları GitHub'a push et
git add .
git commit -m "feat: WhatsApp service complete setup"
git push origin master
```

**Adımlar:**
1. [COOLIFY_WHATSAPP_SETUP.md](./COOLIFY_WHATSAPP_SETUP.md) dosyasını aç
2. Backend'i deploy et (önce!)
3. WhatsApp service'i deploy et
4. QR kodu oku, test et

---

## 📂 Yeni Eklenen Dosyalar

### Ana Konfigürasyon

- ✅ `docker-compose.yml` - Lokal development için
- ✅ `.env.local.example` - Environment variables template
- ✅ `whatsapp-service/.env` - WhatsApp service env

### Dokümantasyon

- ✅ `WHATSAPP_QUICKSTART.md` - 3 adımda başlat
- ✅ `WHATSAPP_DEPLOYMENT_GUIDE.md` - Detaylı guide (300+ satır)
- ✅ `COOLIFY_WHATSAPP_SETUP.md` - Coolify özel guide
- ✅ `README_WHATSAPP.md` - Genel bakış ve teknik detaylar
- ✅ `START_HERE.md` - Bu dosya (nereden başlayacağını anlat)

### Test Script'leri (Linux/Mac)

- ✅ `scripts/test-whatsapp.sh` - Tüm servisleri test et
- ✅ `scripts/get-whatsapp-qr.sh` - QR kod al ve bağlan
- ✅ `scripts/send-test-message.sh` - Test mesajı gönder

### Backend Güncellemeleri

- ✅ `backend/routers/qr_admin.py` - Admin QR endpoint (güvenli)
- ✅ `backend/main.py` - QR admin router eklendi
- ✅ `whatsapp-service/index.js` - Webhook authentication eklendi

---

## ⚡ Hızlı Başlangıç (5 Dakika)

### Windows (PowerShell)

```powershell
# 1. Environment variables
cd c:\Users\DELL\Desktop\mlh
Copy-Item .env.local.example .env.local

# 2. .env.local dosyasını düzenle
notepad .env.local
# Supabase bilgilerini ekle

# 3. Docker Compose başlat
docker-compose up -d

# 4. QR kodu al
curl http://localhost:3001/qr | ConvertFrom-Json

# 5. WhatsApp'ta QR'u tara
# Settings → Linked Devices → Link a Device

# 6. Test et
curl http://localhost:3001/status
curl http://localhost:8000/api/whatsapp/health
```

---

## 🔑 Environment Variables (Gerekli!)

`.env.local` dosyasında bunları doldur:

```env
# Supabase (Mutlaka!)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI...
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI...

# Güvenlik (Opsiyonel ama önerilen)
WEBHOOK_TOKEN=change_this_to_random_secure_token
ADMIN_TOKEN=change_this_to_another_random_token
```

**Supabase bilgilerini nereden alacağım?**
1. https://supabase.com/dashboard
2. Projenizi seçin
3. Settings → API
4. Oradaki URL ve Key'leri kopyalayın

---

## ✅ Çalıştığını Nasıl Anlarım?

### 1. Health Checks

```bash
# WhatsApp Service
curl http://localhost:3001/health
# Beklenen: {"status": "ok", "whatsapp": {"ready": true, ...}}

# Backend
curl http://localhost:8000/api/health
# Beklenen: {"status": "healthy", ...}
```

### 2. WhatsApp Status

```bash
curl http://localhost:3001/status
# Beklenen: {"connected": true, "hasQR": false}
```

### 3. Test Mesajı

WhatsApp'tan kendi numaranıza mesaj gönderin.
CRM panel'de görünmeli!

---

## 🐛 Sorun mu Var?

### "Cannot connect to Docker daemon"

Docker Desktop çalışıyor mu?

```bash
# Docker'ı başlat
# Windows: Docker Desktop'ı aç
# Sonra tekrar dene
docker-compose up -d
```

### "Supabase connection failed"

`.env.local` dosyasında Supabase bilgileri doğru mu?

```bash
# Test et
docker-compose logs backend | grep -i supabase
```

### "WhatsApp not ready"

QR kod okuttun mu?

```bash
# QR'u tekrar al
curl http://localhost:3001/qr

# Status kontrol
curl http://localhost:3001/status
```

### Mesajlar CRM'de görünmüyor

```bash
# Logs kontrol
docker-compose logs -f whatsapp-service
docker-compose logs -f backend

# Şunları görmelisin:
# ✅ Webhook delivered (200)
# INFO: Processed WhatsApp message
```

---

## 📚 Detaylı Dokümantasyon

Sıkıştıysan bu dosyaları oku:

1. **İlk Kez:** `WHATSAPP_QUICKSTART.md`
2. **Lokal Test:** `WHATSAPP_DEPLOYMENT_GUIDE.md`
3. **Coolify Deploy:** `COOLIFY_WHATSAPP_SETUP.md`
4. **Sorun Giderme:** `WHATSAPP_DEPLOYMENT_GUIDE.md` → Troubleshooting
5. **Teknik Detay:** `README_WHATSAPP.md`

---

## 🎯 Sonraki Adımlar

### Lokal Test Başarılı Olduysa:

1. ✅ Lokal test tamam
2. ⬜ Kodları GitHub'a push et
3. ⬜ Coolify'da backend deploy et
4. ⬜ Coolify'da whatsapp-service deploy et
5. ⬜ Production'da test et

### Coolify Deployment:

```bash
# 1. Push to GitHub
git add .
git commit -m "feat: WhatsApp service ready for production"
git push origin master

# 2. Coolify'da deploy et
# COOLIFY_WHATSAPP_SETUP.md dosyasını takip et
```

---

## 🎉 Başarı Kriterleri

Şunları görüyorsan tamamdır:

✅ Docker containers çalışıyor (`docker-compose ps`)
✅ WhatsApp bağlı (`curl localhost:3001/status → "connected": true`)
✅ Health checks yeşil
✅ WhatsApp'tan mesaj gönderdim, CRM'de göründü
✅ Backend logs'ta "Processed WhatsApp message" var

---

## 💡 İpuçları

1. **Her zaman lokal'de test et** - Coolify'da debug zor
2. **Logs'a bak** - Çoğu sorun logs'ta görünür
3. **Persistent volume unut** - Session kaybedilir
4. **Environment variables double-check** - En çok hata buradan
5. **QR 5 dakika geçerli** - Hızlı tara!

---

## 📞 Yardım

Sorun devam ediyorsa:

1. Logları kontrol et (`docker-compose logs -f`)
2. Dokümantasyonu oku (yukarıdaki linkler)
3. Health endpoint'leri test et
4. Environment variables kontrol et

---

## 🚀 Hadi Başla!

Şimdi şunu aç:

**Lokal test için:** [WHATSAPP_QUICKSTART.md](./WHATSAPP_QUICKSTART.md)

**Coolify deploy için:** [COOLIFY_WHATSAPP_SETUP.md](./COOLIFY_WHATSAPP_SETUP.md)

Başarılar! 🎉
