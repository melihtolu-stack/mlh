# PROJE MİMARİSİ RAPORU

**Tarih:** 24 Ocak 2026  
**Proje:** MLH CRM Sistemi

---

## 1. GENEL PROJE YAPISI

### Kök Dizin Yapısı

```
mlh/
├── .cursor/                    # Cursor IDE ayarları
│   └── rules/
├── backend/                    # Python FastAPI backend
│   ├── routers/                # API route'ları
│   ├── services/               # İş mantığı servisleri
│   ├── schemas/                # Pydantic şemaları
│   ├── main.py                 # Ana server dosyası
│   ├── supabase_client.py      # Supabase client
│   ├── requirements.txt        # Python bağımlılıkları
│   ├── Dockerfile              # Backend Docker image
│   └── .env                    # Backend environment variables
├── src/                        # Next.js frontend
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API route handlers
│   │   ├── chat/               # Chat sayfası
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx             # Ana sayfa
│   ├── components/             # React bileşenleri
│   ├── lib/                    # Yardımcı kütüphaneler
│   └── styles/                 # CSS dosyaları
├── supabase/                   # Database şemaları
│   ├── schema.sql              # Ana schema
│   └── migrations/             # Migration dosyaları
├── package.json                # Frontend bağımlılıkları
├── Dockerfile                  # Frontend Docker image
├── next.config.mjs             # Next.js konfigürasyonu
├── tsconfig.json               # TypeScript konfigürasyonu
└── .env.example                # Environment variables şablonu
```

### package.json (Frontend)

```json
{
  "name": "mlh",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.90.1",
    "next": "^16.1.2",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/node": "^20.14.10",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.39",
    "tailwindcss": "^3.4.4",
    "typescript": "^5.5.3"
  }
}
```

### Teknoloji Stack'i

**Frontend:**
- **Framework:** Next.js 16.1.2 (App Router)
- **UI Library:** React 18.3.1
- **Styling:** Tailwind CSS 3.4.4
- **Language:** TypeScript 5.5.3
- **Database Client:** @supabase/supabase-js 2.90.1

**Backend:**
- **Framework:** FastAPI (Python)
- **Python Version:** 3.11
- **ASGI Server:** Uvicorn
- **Database Client:** supabase-py
- **Email:** SMTP (smtplib)
- **Translation:** deep-translator (Google Translator)
- **Language Detection:** langdetect
- **HTML Parsing:** BeautifulSoup4 + lxml

**Database:**
- **Provider:** Supabase (PostgreSQL)
- **ORM:** Supabase REST API + Python client

**Deployment:**
- **Platform:** Coolify
- **Containerization:** Docker
- **Frontend Port:** 3000
- **Backend Port:** 8000

### Monorepo Yapısı

**Hayır, monorepo değil.** Proje tek bir repository içinde hem frontend hem backend içeriyor ancak ayrı klasörlerde organize edilmiş:
- `backend/` - Python FastAPI uygulaması
- `src/` - Next.js frontend uygulaması

Her ikisi de ayrı Dockerfile'lara sahip ve bağımsız olarak deploy edilebilir.

---

## 2. BACKEND DETAYLARI

### Backend Klasör Yapısı

```
backend/
├── __init__.py
├── main.py                      # Ana FastAPI uygulaması
├── supabase_client.py           # Supabase client (eski, kullanılmıyor)
├── requirements.txt             # Python bağımlılıkları
├── Dockerfile                   # Backend Docker image
├── routers/                     # API route'ları
│   ├── __init__.py
│   ├── health.py               # Health check endpoints
│   ├── leads.py                # Lead form endpoints
│   ├── lead_contacts.py        # Lead contact endpoints
│   ├── emails.py               # Email webhook endpoint
│   ├── messages.py             # Message send endpoint
│   └── test_supabase.py         # Supabase test endpoint
├── services/                     # İş mantığı servisleri
│   ├── __init__.py
│   ├── supabase_client.py      # Supabase client (aktif)
│   ├── email_service.py         # SMTP email gönderme
│   ├── email_parser.py          # Email içerik parsing
│   ├── message_service.py       # Mesaj oluşturma ve çeviri
│   ├── translation_service.py   # Dil çevirisi
│   ├── language_detection.py    # Dil tespiti
│   ├── lead_service.py          # Lead işlemleri
│   └── lead_contact_service.py  # Lead contact işlemleri
└── schemas/                      # Pydantic şemaları
    ├── __init__.py
    ├── lead.py                  # Lead şemaları
    ├── lead_contact.py          # Lead contact şemaları
    └── email.py                 # Email şemaları
```

### Ana Server Dosyası: `backend/main.py`

```python
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import lead_contacts, leads, health, test_supabase, emails, messages

import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(name)s - %(message)s",
)

app = FastAPI(
    title="MLH Backend API",
    description="Backend API for MLH project",
    version="1.0.0"
)

# CORS ayarları
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://mlh.heni.com.tr",           # Frontend production
        "https://backend-mlh.heni.com.tr",   # Backend production
        "http://localhost:3000",             # Local development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router)
app.include_router(lead_contacts.router)
app.include_router(leads.router)
app.include_router(test_supabase.router)
app.include_router(emails.router)
app.include_router(messages.router)
```

**Backend PORT:** 8000 (Dockerfile'da expose edilmiş, uvicorn komutu ile başlatılıyor)

### API Route'ları Organizasyonu

Backend route'ları `routers/` klasöründe modüler olarak organize edilmiş:

1. **health.py** - `/api/health` ve `/api/health/email-config`, `/api/health/test-email`
2. **leads.py** - `/api/leads/` (POST, GET)
3. **lead_contacts.py** - `/api/lead-contacts` (POST), `/api/lead-contacts/by-lead/{lead_id}` (GET)
4. **emails.py** - `/api/emails/incoming` (POST)
5. **messages.py** - `/api/messages/send` (POST)
6. **test_supabase.py** - `/api/test/supabase` (GET)

### Middleware'ler

**CORS Middleware:**
- `allow_origins`: Production ve development URL'leri
- `allow_credentials`: True (cookies/auth için)
- `allow_methods`: Tüm HTTP metodları
- `allow_headers`: Tüm header'lar

**Logging Middleware:**
- Tüm istekler ve hatalar loglanıyor
- Format: `%(asctime)s - %(levelname)s - %(name)s - %(message)s`

### Supabase Client Initialization

**Dosya:** `backend/services/supabase_client.py`

```python
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("Supabase env variables missing")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
```

**Not:** `backend/supabase_client.py` dosyası da var ancak aktif olarak `services/supabase_client.py` kullanılıyor.

### Database Bağlantı Kodu

Supabase client üzerinden REST API ile bağlantı yapılıyor. Doğrudan PostgreSQL bağlantısı yok, Supabase'in REST API'si kullanılıyor.

---

## 3. FRONTEND DETAYLARI

### Frontend Klasör Yapısı

```
src/
├── app/                         # Next.js App Router
│   ├── api/                     # API route handlers (Next.js API routes)
│   │   ├── conversations/       # Conversation endpoints
│   │   │   ├── route.ts         # GET /api/conversations
│   │   │   └── [id]/
│   │   │       ├── route.ts     # DELETE /api/conversations/[id]
│   │   │       └── messages/
│   │   │           └── route.ts # GET /api/conversations/[id]/messages
│   │   ├── customers/
│   │   │   └── [id]/
│   │   │       └── route.ts     # GET, PATCH /api/customers/[id]
│   │   ├── emails/
│   │   │   └── incoming/
│   │   │       └── route.ts      # POST /api/emails/incoming
│   │   ├── messages/
│   │   │   ├── incoming/
│   │   │   │   └── route.ts      # POST /api/messages/incoming
│   │   │   └── send/
│   │   │       └── route.ts      # POST /api/messages/send
│   │   ├── health/
│   │   │   └── route.ts          # GET /api/health
│   │   └── debug-env/
│   │       └── route.ts          # Debug endpoint
│   ├── chat/
│   │   └── [id]/
│   │       └── page.tsx         # Chat sayfası
│   ├── finance/
│   │   └── page.tsx              # Finance sayfası
│   ├── profile/
│   │   └── [id]/
│   │       └── page.tsx         # Profile sayfası
│   ├── suppliers/
│   │   └── page.tsx              # Suppliers sayfası
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Ana sayfa (conversations listesi)
├── components/                   # React bileşenleri
│   ├── BottomNav.tsx            # Alt navigasyon
│   ├── bottom-nav/
│   ├── chat/                     # Chat bileşenleri
│   └── sidebar/                  # Sidebar bileşeni
├── lib/
│   └── supabase.ts              # Supabase client initialization
└── styles/
    └── globals.css               # Global CSS
```

### Ana Entry Point

**Next.js App Router** kullanılıyor:
- `src/app/layout.tsx` - Root layout (tüm sayfaları sarmalar)
- `src/app/page.tsx` - Ana sayfa (conversations listesi)

### API Çağrıları

Frontend'de API çağrıları iki şekilde yapılıyor:

1. **Next.js API Routes** (`src/app/api/`): Frontend içinde server-side API handlers
2. **Backend API** (`BACKEND_URL`): Python FastAPI backend'e istekler

**API Base URL:**
- Backend için: `process.env.BACKEND_URL` (varsayılan: `http://localhost:8000`)
- Supabase için: `process.env.NEXT_PUBLIC_SUPABASE_URL`

**Örnek API Çağrısı (Frontend'den Backend'e):**

```typescript
// src/app/api/messages/send/route.ts
const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000'
const response = await fetch(`${backendUrl}/api/messages/send`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ conversation_id, content })
})
```

### Supabase Client Frontend'de

**Dosya:** `src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// Client-side client (anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side client (service role key)
export function createServerClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY. Please add it to .env.local')
  }

  if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co') {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL. Please add it to .env.local')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
```

**Kullanım:**
- Client-side: `supabase` export edilmiş instance kullanılıyor
- Server-side (API routes): `createServerClient()` fonksiyonu kullanılıyor

---

## 4. ENVIRONMENT VARIABLES

### .env.example (Kök Dizin)

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_URL=your_supabase_project_url

# Backend API URL
BACKEND_URL=http://localhost:8000

# E-posta: info@heni.com.tr
EMAIL_INBOX=info@heni.com.tr

# Node Environment
NODE_ENV=production
```

### Backend .env Değişken İsimleri

**Backend klasöründeki `.env` dosyasında bulunan değişken isimleri:**

1. `SUPABASE_URL` - Supabase proje URL'i
2. `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
3. `SMTP_SERVER` - SMTP sunucu adresi
4. `SMTP_PORT` - SMTP port numarası
5. `SMTP_USERNAME` - SMTP kullanıcı adı
6. `SMTP_PASSWORD` - SMTP şifresi
7. `FROM_EMAIL` - Gönderen e-posta adresi
8. `FROM_NAME` - Gönderen adı
9. `APP_ENV` - Uygulama ortamı (development/production)
10. `OPENAI_API_KEY` - OpenAI API anahtarı (kullanılmıyor gibi görünüyor)

### Frontend .env Değişken İsimleri

**Frontend için `.env.local` dosyasında olması gereken değişken isimleri:**

1. `NEXT_PUBLIC_SUPABASE_URL` - Supabase proje URL'i (public)
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key (public)
3. `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-side)
4. `BACKEND_URL` - Backend API URL'i
5. `EMAIL_INBOX` - Gelen e-posta adresi
6. `NODE_ENV` - Node ortamı

### Supabase ile İlgili Değişkenler

- `SUPABASE_URL` (Backend)
- `SUPABASE_SERVICE_ROLE_KEY` (Backend + Frontend server-side)
- `NEXT_PUBLIC_SUPABASE_URL` (Frontend client-side)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Frontend client-side)

### API URL ile İlgili Değişkenler

- `BACKEND_URL` - Backend API'nin base URL'i (hem frontend hem backend'de kullanılıyor)

---

## 5. SUPABASE KONFIGÜRASYONU

### Supabase Bağlantı Kodları

**Backend:** `backend/services/supabase_client.py`
```python
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("Supabase env variables missing")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
```

**Frontend:** `src/lib/supabase.ts`
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export function createServerClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  // ... service role client oluşturma
}
```

### Kullanılan Supabase Özellikleri

1. **Database (PostgreSQL):**
   - REST API üzerinden CRUD işlemleri
   - Tablolar: `customers`, `conversations`, `messages`

2. **Realtime:**
   - `conversations` ve `messages` tabloları için realtime subscription
   - Frontend'de Supabase Realtime kullanılıyor

3. **Row Level Security (RLS):**
   - Tüm tablolarda RLS aktif
   - Şu anda tüm operasyonlara izin veren policy'ler var

### RLS Policies

**Mevcut Policy'ler (schema.sql'den):**

```sql
-- Tüm tablolarda RLS aktif
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Şu anda tüm operasyonlara izin veren policy'ler
CREATE POLICY "Allow all operations on customers" ON customers
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on conversations" ON conversations
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on messages" ON messages
  FOR ALL USING (true) WITH CHECK (true);
```

**Not:** Production'da daha güvenli policy'ler oluşturulmalı.

---

## 6. API ENDPOINT'LERİ

### Backend API Endpoints (Python FastAPI)

#### Health Endpoints
- **GET** `/api/health` - Health check
- **GET** `/api/health/email-config` - Email servis konfigürasyonunu kontrol et
- **POST** `/api/health/test-email` - Email gönderme testi

#### Lead Endpoints
- **POST** `/api/leads/` - Yeni lead oluştur (name, email, message zorunlu; phone opsiyonel)
- **GET** `/api/leads/` - Tüm lead'leri listele

#### Lead Contact Endpoints
- **POST** `/api/lead-contacts` - Lead contact oluştur
- **GET** `/api/lead-contacts/by-lead/{lead_id}` - Belirli bir lead'in contact'larını getir

#### Email Endpoints
- **POST** `/api/emails/incoming` - Gelen e-posta webhook'u
  - E-postayı parse eder
  - Dil tespiti yapar
  - Türkçe'ye çevirir
  - Customer ve conversation oluşturur/günceller
  - Message kaydeder

#### Message Endpoints
- **POST** `/api/messages/send` - Mesaj gönder (agent mesajı)
  - Türkçe mesajı müşterinin diline çevirir
  - E-posta kanalıysa e-posta gönderir
  - Mesajı veritabanına kaydeder

#### Test Endpoints
- **GET** `/api/test/supabase` - Supabase bağlantısını test et

### Frontend API Routes (Next.js)

#### Conversations
- **GET** `/api/conversations` - Tüm konuşmaları listele (customer bilgileriyle birlikte)
- **DELETE** `/api/conversations/[id]` - Konuşmayı sil (mesajlarıyla birlikte)
- **GET** `/api/conversations/[id]/messages` - Konuşmanın mesajlarını getir

#### Customers
- **GET** `/api/customers/[id]` - Müşteri bilgilerini getir
- **PATCH** `/api/customers/[id]` - Müşteri bilgilerini güncelle

#### Emails
- **POST** `/api/emails/incoming` - Gelen e-posta webhook'u (backend'e forward eder)
  - Mailgun ve N8N formatlarını destekler
  - Backend'e `/api/emails/incoming` endpoint'ine forward eder

#### Messages
- **POST** `/api/messages/incoming` - Gelen mesaj webhook'u (N8N'den)
  - Customer ve conversation oluşturur/günceller
  - Message kaydeder
- **POST** `/api/messages/send` - Mesaj gönder (backend'e forward eder)
  - Backend'e `/api/messages/send` endpoint'ine forward eder

#### Health
- **GET** `/api/health` - Frontend health check (Supabase env kontrolü)

### Frontend'de Backend API'ye İstek Örneği

```typescript
// src/app/api/messages/send/route.ts
const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000'
const response = await fetch(`${backendUrl}/api/messages/send`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ conversation_id, content })
})
```

---

## 7. DEPLOYMENT KONFIGÜRASYONU

### Deployment Config Dosyaları

#### Frontend Dockerfile (Kök Dizin)

```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

#### Backend Dockerfile

```dockerfile
FROM python:3.11-slim
WORKDIR /app
RUN apt-get update && apt-get install -y gcc && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Build Script'leri

**Frontend (package.json):**
- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run start` - Production server
- `npm run lint` - Linting

**Backend:**
- Build script yok, Dockerfile içinde `pip install` yapılıyor
- `uvicorn main:app --host 0.0.0.0 --port 8000` ile çalıştırılıyor

### Canlı Ortam Ayarları

**Frontend:**
- `NODE_ENV=production`
- `NEXT_PUBLIC_SUPABASE_URL` - Build-time'da gerekli
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Build-time'da gerekli
- Runtime'da: `SUPABASE_SERVICE_ROLE_KEY`, `BACKEND_URL`, `EMAIL_INBOX`

**Backend:**
- `APP_ENV=development` (şu anda, production'a çevrilmeli)
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- `SMTP_SERVER`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`
- `FROM_EMAIL`, `FROM_NAME`

---

## 8. CORS VE GÜVENLİK AYARLARI

### CORS Konfigürasyonu

**Backend (main.py):**

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://mlh.heni.com.tr",           # Frontend production
        "https://backend-mlh.heni.com.tr",   # Backend production
        "http://localhost:3000",             # Local development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**İzin Verilen Origin'ler:**
- `https://mlh.heni.com.tr` - Production frontend
- `https://backend-mlh.heni.com.tr` - Production backend
- `http://localhost:3000` - Local development

**Not:** `allow_credentials=True` olduğu için wildcard (`*`) kullanılamaz, sadece belirli origin'ler.

### API Key / Token Kontrolü

**Şu anda API key veya token kontrolü yapılmıyor.** Tüm endpoint'ler açık.

**Güvenlik Önerileri:**
1. API key veya JWT token kontrolü eklenmeli
2. Rate limiting eklenmeli
3. RLS policy'leri daha güvenli hale getirilmeli
4. Webhook endpoint'lerinde signature doğrulama yapılmalı

---

## 9. DATABASE SCHEMA

### Supabase Tabloları

#### 1. `customers` Tablosu

```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  profile_photo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Alanlar:**
- `id` - UUID primary key
- `name` - Müşteri adı (zorunlu)
- `email` - E-posta adresi (opsiyonel)
- `phone` - Telefon numarası (zorunlu)
- `profile_photo` - Profil fotoğrafı URL'i (opsiyonel)
- `created_at` - Oluşturulma tarihi
- `updated_at` - Güncellenme tarihi

#### 2. `conversations` Tablosu

```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  last_message TEXT,
  is_read BOOLEAN DEFAULT false,
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Alanlar:**
- `id` - UUID primary key
- `customer_id` - Müşteri ID'si (foreign key)
- `channel` - Kanal tipi ('whatsapp', 'email', 'web')
- `last_message` - Son mesaj önizlemesi
- `is_read` - Okundu mu?
- `last_message_at` - Son mesaj tarihi
- `created_at` - Oluşturulma tarihi
- `updated_at` - Güncellenme tarihi

#### 3. `messages` Tablosu

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender TEXT NOT NULL, -- 'customer' or 'agent'
  content TEXT NOT NULL,
  original_content TEXT,
  original_language TEXT,
  translated_content TEXT,
  is_read BOOLEAN DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Alanlar:**
- `id` - UUID primary key
- `conversation_id` - Konuşma ID'si (foreign key)
- `sender` - Gönderen ('customer' veya 'agent')
- `content` - Mesaj içeriği (Türkçe, CRM'de gösterilecek)
- `original_content` - Orijinal dildeki mesaj içeriği
- `original_language` - Orijinal dil kodu (ISO 639-1, örn: 'en', 'de', 'fr')
- `translated_content` - Çevrilmiş içerik (Türkçe)
- `is_read` - Okundu mu?
- `sent_at` - Gönderilme tarihi
- `created_at` - Oluşturulma tarihi

**Not:** `original_content`, `original_language`, `translated_content` alanları migration ile eklenmiş (`add_translation_fields.sql`).

### Index'ler

```sql
CREATE INDEX idx_conversations_customer_id ON conversations(customer_id);
CREATE INDEX idx_conversations_last_message_at ON conversations(last_message_at DESC);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sent_at ON messages(sent_at DESC);
CREATE INDEX idx_messages_original_language ON messages(original_language);
```

### Trigger'lar

**Otomatik Conversation Güncelleme:**

```sql
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET 
    last_message = COALESCE(NEW.translated_content, NEW.content),
    last_message_at = NEW.sent_at,
    is_read = CASE WHEN NEW.sender = 'agent' THEN true ELSE false END,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_on_message
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_on_message();
```

### Migration Dosyaları

**supabase/migrations/add_translation_fields.sql:**

```sql
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS original_content TEXT,
ADD COLUMN IF NOT EXISTS original_language TEXT,
ADD COLUMN IF NOT EXISTS translated_content TEXT;

CREATE INDEX IF NOT EXISTS idx_messages_original_language ON messages(original_language);
```

### Schema Dosyası

**supabase/schema.sql** - Tüm schema tanımlarını içerir (tablolar, index'ler, trigger'lar, RLS policy'leri).

---

## ÖZET

### Proje Yapısı
- **Frontend:** Next.js 16 (App Router) + TypeScript + Tailwind CSS
- **Backend:** FastAPI (Python 3.11) + Supabase
- **Database:** Supabase (PostgreSQL)
- **Deployment:** Docker + Coolify

### Ana Özellikler
1. **CRM Sistemi:** Müşteri ve konuşma yönetimi
2. **Çoklu Kanal:** WhatsApp, Email, Web desteği
3. **Dil Çevirisi:** Otomatik dil tespiti ve çeviri
4. **E-posta Entegrasyonu:** SMTP ile e-posta gönderme/alma
5. **Realtime:** Supabase Realtime ile anlık güncellemeler

### Güvenlik Notları
- RLS aktif ancak policy'ler çok açık (production'da sıkılaştırılmalı)
- API key/token kontrolü yok (eklenmeli)
- Webhook signature doğrulama yok (eklenmeli)

### Deployment
- Frontend: Port 3000
- Backend: Port 8000
- Her ikisi de ayrı Docker container'lar olarak deploy ediliyor

---

**Rapor Tarihi:** 24 Ocak 2026  
**Hazırlayan:** AI Assistant
