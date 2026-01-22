# 📧 E-posta Entegrasyonu ve Otomatik Çeviri - Hızlı Başlangıç

## ✅ Tamamlanan Özellikler

### 1. E-posta Giriş (Inbound Mail) ✅
- ✅ Webhook endpoint: `POST /api/emails/incoming`
- ✅ E-posta içeriğinden otomatik veri çıkarma (ad, telefon, e-posta, mesaj)
- ✅ HTML ve plain text e-posta desteği

### 2. Otomatik Dil Algılama ✅
- ✅ Google Translate API ile dil algılama
- ✅ ISO 639-1 dil kodları (en, tr, de, fr, es, vb.)
- ✅ Merkezi servis katmanı (`language_detection.py`)

### 3. Otomatik Türkçeye Çeviri ✅
- ✅ Tüm gelen mesajlar otomatik Türkçeye çevrilir
- ✅ Veritabanında orijinal ve çevrilmiş içerik saklanır
- ✅ Soyutlanmış çeviri servisi (ileride DeepL, OpenAI eklenebilir)

### 4. CRM Konuşma Ekranı ✅
- ✅ Kullanıcılar sadece Türkçe yazar
- ✅ Backend otomatik olarak müşterinin diline çevirir
- ✅ Çevrilen mesaj otomatik e-posta olarak gönderilir

## 🚀 Hızlı Kurulum

### 1. Database Migration

```bash
# Supabase Dashboard → SQL Editor
# supabase/migrations/add_translation_fields.sql dosyasını çalıştırın
```

### 2. Backend Kurulumu

```bash
cd backend
pip install -r requirements.txt
```

`.env` dosyasına ekleyin:
```env
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password
FROM_EMAIL=your_email@gmail.com
FROM_NAME=CRM System
```

### 3. Frontend Kurulumu

`.env.local` dosyasına ekleyin:
```env
BACKEND_URL=http://localhost:8000
```

### 4. Server'ları Başlatın

```bash
# Terminal 1: Backend
cd backend
uvicorn main:app --reload

# Terminal 2: Frontend
npm run dev
```

## 📡 API Kullanımı

### E-posta Webhook Testi

```bash
curl -X POST http://localhost:8000/api/emails/incoming \
  -H "Content-Type: application/json" \
  -d '{
    "from_email": "customer@example.com",
    "from_name": "John Doe",
    "subject": "Test",
    "body": "Hello, I need help. My phone is +1234567890."
  }'
```

### Mesaj Gönderme

Frontend'den otomatik çalışır. Kullanıcı Türkçe yazar, backend çevirir ve e-posta gönderir.

## 📁 Oluşturulan Dosyalar

### Backend Servisleri
- `backend/services/language_detection.py` - Dil algılama
- `backend/services/translation_service.py` - Çeviri servisi
- `backend/services/email_parser.py` - E-posta parsing
- `backend/services/email_service.py` - E-posta gönderme
- `backend/services/message_service.py` - Mesaj yönetimi

### Backend Router'ları
- `backend/routers/emails.py` - E-posta webhook
- `backend/routers/messages.py` - Mesaj gönderme

### Frontend
- `src/app/api/messages/send/route.ts` - Backend'e yönlendirme

### Dokümantasyon
- `EMAIL_INTEGRATION.md` - Detaylı dokümantasyon
- `backend/test_email_webhook.py` - Test scripti

## 🔄 Veri Akışı

### Gelen E-posta
1. E-posta → Webhook (`/api/emails/incoming`)
2. Parse → Ad, telefon, e-posta, mesaj çıkarılır
3. Dil algılama → "en", "de", "fr" vb.
4. Çeviri → Türkçeye çevrilir
5. Veritabanı → Orijinal + çeviri kaydedilir
6. Frontend → Sadece Türkçe gösterilir

### Giden Mesaj
1. Kullanıcı → Türkçe yazar
2. Backend → Müşterinin dilini tespit eder
3. Çeviri → Müşterinin diline çevirir
4. E-posta → Çevrilen mesaj gönderilir
5. Veritabanı → Türkçe mesaj kaydedilir

## 🎯 Önemli Notlar

1. **Frontend'de sadece Türkçe gösterilir** - `content` alanı kullanılır (zaten Türkçe)
2. **Kullanıcı sadece Türkçe yazar** - Çeviri backend'de otomatik
3. **E-posta kanalı** - Yeni konuşmalar `channel: "email"` ile oluşturulur
4. **Orijinal dil saklanır** - `original_language` ve `original_content` alanlarında

## 🧪 Test

```bash
# Test scripti çalıştır
cd backend
python test_email_webhook.py
```

## 📚 Detaylı Dokümantasyon

Tam dokümantasyon için: `EMAIL_INTEGRATION.md`

## 🔧 Sorun Giderme

- **Çeviri çalışmıyor?** → İnternet bağlantısını kontrol edin
- **E-posta gönderilmiyor?** → SMTP ayarlarını kontrol edin
- **Dil algılanmıyor?** → Mesaj yeterince uzun mu?

Detaylar için `EMAIL_INTEGRATION.md` dosyasına bakın.
