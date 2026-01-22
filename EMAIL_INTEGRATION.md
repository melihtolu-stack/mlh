# E-posta Entegrasyonu ve Otomatik Çeviri Dokümantasyonu

## 📋 Genel Bakış

Bu dokümantasyon, CRM sistemine eklenen e-posta entegrasyonu ve otomatik çeviri özelliklerini açıklar.

### Özellikler

1. **E-posta Giriş (Inbound Mail)**
   - Webhook üzerinden gelen e-postaları işleme
   - E-posta içeriğinden otomatik veri çıkarma (ad, telefon, e-posta, mesaj)

2. **Otomatik Dil Algılama**
   - Gelen mesajın dilini otomatik tespit etme
   - ISO 639-1 dil kodları kullanımı

3. **Otomatik Türkçeye Çeviri**
   - Tüm mesajlar otomatik olarak Türkçeye çevrilir
   - Veritabanında hem orijinal hem çevrilmiş içerik saklanır

4. **CRM Konuşma Ekranı**
   - Kullanıcılar sadece Türkçe yazar
   - Backend otomatik olarak müşterinin diline çevirir ve e-posta gönderir

## 🗄️ Veritabanı Değişiklikleri

### Migration

`supabase/migrations/add_translation_fields.sql` dosyasını çalıştırın:

```sql
-- Messages tablosuna yeni alanlar eklendi:
-- - original_content: Orijinal mesaj içeriği
-- - original_language: Dil kodu (ISO 639-1)
-- - translated_content: Türkçe çeviri
```

Migration'ı Supabase'de çalıştırmak için:

1. Supabase Dashboard → SQL Editor
2. `supabase/migrations/add_translation_fields.sql` dosyasının içeriğini yapıştırın
3. Çalıştırın

## 🔧 Backend Kurulumu

### 1. Gerekli Paketleri Yükleyin

```bash
cd backend
pip install -r requirements.txt
```

Yeni eklenen paketler:
- `googletrans==4.0.0rc1` - Dil algılama ve çeviri
- `beautifulsoup4` - HTML e-posta parsing
- `lxml` - HTML parsing için
- `email-validator` - E-posta doğrulama
- `aiohttp` - Async HTTP istekleri

### 2. Environment Değişkenleri

`backend/.env` dosyasına şu değişkenleri ekleyin:

```env
# Mevcut Supabase ayarları
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# E-posta gönderme ayarları (SMTP)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password
FROM_EMAIL=your_email@gmail.com
FROM_NAME=CRM System
```

**Not:** Gmail kullanıyorsanız, "App Password" oluşturmanız gerekir:
1. Google Account → Security → 2-Step Verification
2. App Passwords → Generate
3. Oluşturulan şifreyi `SMTP_PASSWORD` olarak kullanın

### 3. Backend Server'ı Başlatın

```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## 🌐 Frontend Kurulumu

### Environment Değişkenleri

`.env.local` dosyasına backend URL'ini ekleyin:

```env
# Mevcut Supabase ayarları
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Backend API URL
BACKEND_URL=http://localhost:8000
```

## 📡 API Endpoint'leri

### 1. E-posta Giriş Webhook

**Endpoint:** `POST /api/emails/incoming`

**Request Body:**
```json
{
  "from_email": "customer@example.com",
  "from_name": "John Doe",
  "subject": "Inquiry about products",
  "body": "Hello, I'm interested in your products. My phone is +1234567890.",
  "html_body": "<p>Hello, I'm interested...</p>",
  "headers": {}
}
```

**Response:**
```json
{
  "success": true,
  "message_id": "uuid",
  "conversation_id": "uuid",
  "customer_id": "uuid",
  "detected_language": "en",
  "translated_content": "Merhaba, ürünlerinizle ilgileniyorum..."
}
```

### 2. Mesaj Gönderme

**Endpoint:** `POST /api/messages/send`

**Request Body:**
```json
{
  "conversation_id": "uuid",
  "content": "Merhaba, size nasıl yardımcı olabilirim?"
}
```

**Response:**
```json
{
  "success": true,
  "message_id": "uuid"
}
```

**Not:** Backend otomatik olarak:
1. Mesajı veritabanına Türkçe olarak kaydeder
2. Müşterinin dilini tespit eder
3. Mesajı müşterinin diline çevirir
4. Çevrilen mesajı e-posta olarak gönderir

## 🔌 E-posta Webhook Kurulumu

### Seçenek 1: SendGrid Inbound Parse

1. SendGrid Dashboard → Settings → Inbound Parse
2. Webhook URL: `https://your-backend-url.com/api/emails/incoming`
3. Parse Address: `incoming@yourdomain.com`

### Seçenek 2: Mailgun Routes

1. Mailgun Dashboard → Receiving → Routes
2. Route Expression: `match_recipient("incoming@yourdomain.com")`
3. Action: `forward("https://your-backend-url.com/api/emails/incoming")`

### Seçenek 3: N8N Workflow

N8N kullanarak e-posta webhook'u oluşturabilirsiniz:

1. Email Trigger node ekleyin
2. Webhook node ekleyin
3. Backend endpoint'ine POST isteği gönderin

## 🧪 Test Etme

### 1. E-posta Webhook Testi

```bash
curl -X POST http://localhost:8000/api/emails/incoming \
  -H "Content-Type: application/json" \
  -d '{
    "from_email": "test@example.com",
    "from_name": "Test Customer",
    "subject": "Test Email",
    "body": "Hello, this is a test message in English. My phone is +905551234567."
  }'
```

### 2. Mesaj Gönderme Testi

```bash
curl -X POST http://localhost:8000/api/messages/send \
  -H "Content-Type: application/json" \
  -d '{
    "conversation_id": "your-conversation-id",
    "content": "Merhaba, size nasıl yardımcı olabilirim?"
  }'
```

## 📊 Veri Akışı

### Gelen E-posta Akışı

1. E-posta webhook'a gelir (`/api/emails/incoming`)
2. E-posta içeriği parse edilir (ad, telefon, e-posta, mesaj)
3. Dil algılanır (ör: "en", "de", "fr")
4. Mesaj Türkçeye çevrilir
5. Müşteri bulunur veya oluşturulur
6. Konuşma bulunur veya oluşturulur (channel: "email")
7. Mesaj veritabanına kaydedilir:
   - `content`: Türkçe çeviri (gösterim için)
   - `original_content`: Orijinal mesaj
   - `original_language`: Dil kodu
   - `translated_content`: Türkçe çeviri

### Giden Mesaj Akışı

1. Kullanıcı CRM'de Türkçe mesaj yazar
2. Frontend `/api/messages/send` endpoint'ine istek gönderir
3. Backend:
   - Mesajı veritabanına Türkçe olarak kaydeder
   - Müşterinin son mesajının dilini tespit eder
   - Mesajı müşterinin diline çevirir
   - Çevrilen mesajı e-posta olarak gönderir

## 🎨 Frontend Davranışı

- **Mesaj Gösterimi:** Frontend'de sadece `content` alanı gösterilir (Türkçe)
- **Mesaj Yazma:** Kullanıcılar sadece Türkçe yazar
- **Otomatik Çeviri:** Backend tarafında otomatik olarak yapılır, kullanıcı farkında olmaz

## 🔍 Sorun Giderme

### Çeviri Çalışmıyor

1. `googletrans` paketinin yüklü olduğundan emin olun
2. İnternet bağlantısını kontrol edin (Google Translate API kullanır)
3. Log dosyalarını kontrol edin: `backend/services/translation_service.py`

### E-posta Gönderilmiyor

1. SMTP ayarlarını kontrol edin (`.env` dosyası)
2. Gmail kullanıyorsanız App Password kullandığınızdan emin olun
3. SMTP port ve sunucu ayarlarını doğrulayın

### Dil Algılanmıyor

1. Mesaj içeriğinin yeterli uzunlukta olduğundan emin olun
2. `googletrans` paketinin çalıştığını test edin
3. Log dosyalarını kontrol edin

## 📝 Notlar

- **Google Translate API:** Ücretsiz versiyon kullanılıyor, rate limit'ler olabilir
- **Production:** Production ortamında Google Cloud Translate API kullanılması önerilir
- **E-posta Parsing:** Regex tabanlı parsing kullanılıyor, karmaşık e-postalarda manuel düzenleme gerekebilir
- **Dil Desteği:** Google Translate'in desteklediği tüm diller desteklenir

## 🚀 Gelecek Geliştirmeler

- [ ] DeepL API entegrasyonu (daha iyi çeviri kalitesi)
- [ ] OpenAI GPT çeviri desteği
- [ ] E-posta attachment desteği
- [ ] Çoklu dil desteği için cache mekanizması
- [ ] Rate limiting ve error handling iyileştirmeleri
