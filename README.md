# MLH - WhatsApp-Style CRM

Modern bir WhatsApp tarzı CRM uygulaması. Next.js ve Supabase ile geliştirilmiştir.

## 🚀 Özellikler

- WhatsApp benzeri mesajlaşma arayüzü
- Gerçek zamanlı mesaj güncellemeleri (Supabase Realtime)
- Müşteri yönetimi
- Konuşma geçmişi
- E-posta entegrasyonu
- Çoklu dil desteği

## 📋 Gereksinimler

- Node.js 18+ 
- Supabase hesabı
- npm veya yarn

## 🛠️ Yerel Geliştirme Kurulumu

### 1. Bağımlılıkları Yükleyin

```bash
npm install
```

### 2. Environment Variables Ayarlayın

`.env.local` dosyası oluşturun ve `env.example` dosyasındaki şablonu kullanarak değerleri doldurun:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
BACKEND_URL=http://localhost:8000
```

### 3. Geliştirme Sunucusunu Başlatın

```bash
npm run dev
```

Uygulama http://localhost:3000 adresinde çalışacaktır.

Detaylı kurulum için [SETUP.md](./SETUP.md) dosyasına bakın.

## 🐳 Coolify ile Deployment

Bu proje Coolify ile deploy edilmek için hazırlanmıştır.

### Ön Hazırlık

1. **Supabase Projesi Oluşturun**
   - [Supabase Dashboard](https://app.supabase.com) üzerinden yeni proje oluşturun
   - Database şemasını `supabase/schema.sql` dosyasından uygulayın
   - API anahtarlarını alın

2. **Environment Variables Hazırlayın**
   - Coolify'da environment variables olarak şunları ekleyin:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `NODE_ENV=production`
     - `BACKEND_URL` (opsiyonel, backend servisi varsa)

### Coolify'da Deployment

1. **Yeni Uygulama Oluştur**
   - Coolify dashboard'da "New Application" tıklayın
   - Git repository'nizi bağlayın

2. **Build Ayarları**
   - **Build Pack**: Docker
   - **Dockerfile**: Proje root'unda mevcut (otomatik algılanır)
   - **Port**: 3000

3. **Environment Variables Ekle**
   - Coolify'ın environment variables bölümüne yukarıdaki değişkenleri ekleyin

4. **Deploy**
   - "Deploy" butonuna tıklayın
   - Build işlemi tamamlandıktan sonra uygulama çalışır durumda olacaktır

### Health Check

Uygulama `/api/health` endpoint'i ile sağlık kontrolü yapabilir:

```bash
curl https://your-domain.com/api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456,
  "environment": "production",
  "checks": {
    "supabase": {
      "configured": true,
      "url": "configured"
    }
  }
}
```

Coolify bu endpoint'i otomatik olarak kullanarak uygulamanın sağlığını kontrol eder.

## 📁 Proje Yapısı

```
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── api/         # API routes
│   │   │   ├── health/  # Health check endpoint
│   │   │   ├── conversations/
│   │   │   ├── messages/
│   │   │   └── customers/
│   │   ├── chat/        # Chat pages
│   │   └── ...
│   ├── components/      # React components
│   ├── lib/             # Utilities
│   └── styles/          # Global styles
├── supabase/            # Database migrations
├── Dockerfile           # Docker configuration
├── .dockerignore        # Docker ignore rules
├── next.config.mjs      # Next.js configuration
└── package.json         # Dependencies
```

## 🔧 Build Scripts

- `npm run dev` - Geliştirme sunucusunu başlatır
- `npm run build` - Production build oluşturur
- `npm run start` - Production sunucusunu başlatır
- `npm run lint` - ESLint kontrolü yapar

## 🌐 API Endpoints

### Health Check
- `GET /api/health` - Uygulama sağlık durumu

### Conversations
- `GET /api/conversations` - Tüm konuşmaları listeler
- `GET /api/conversations/[id]` - Belirli bir konuşmayı getirir
- `GET /api/conversations/[id]/messages` - Konuşma mesajlarını getirir

### Messages
- `POST /api/messages/incoming` - Gelen mesaj webhook'u
- `POST /api/messages/send` - Mesaj gönder

### Customers
- `GET /api/customers/[id]` - Müşteri bilgilerini getirir

Detaylı API dokümantasyonu için [SETUP.md](./SETUP.md) dosyasına bakın.

## 🐳 Docker

Proje production-ready bir Dockerfile ile gelir:

```bash
# Build image
docker build -t mlh-crm .

# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your_url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key \
  -e SUPABASE_SERVICE_ROLE_KEY=your_key \
  mlh-crm
```

## 📝 Notlar

- Production build'de `standalone` output kullanılır (Docker için optimize)
- Health check endpoint'i deployment platformları tarafından kullanılabilir
- Environment variables production'da mutlaka ayarlanmalıdır
- Supabase Realtime özelliklerinin çalışması için replication ayarlarını kontrol edin

## 📚 Ek Dokümantasyon

- [SETUP.md](./SETUP.md) - Detaylı kurulum rehberi
- [EMAIL_INTEGRATION.md](./EMAIL_INTEGRATION.md) - E-posta entegrasyonu
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Sorun giderme

## 📄 Lisans

Bu proje özel bir projedir.
