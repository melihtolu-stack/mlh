# Backend Deployment Guide - Coolify

## Backend'i Coolify'da Deploy Etme

Backend (Python FastAPI) ayrı bir servis olarak Coolify'da deploy edilmelidir.

## 1. Coolify'da Yeni Servis Oluşturma

**ÇÖZÜM: Root'ta Dockerfile.backend kullanın**

1. Coolify Dashboard → **New Application** (veya mevcut backend servisini düzenleyin)
2. **Repository**: `melihtolu-stack/mlh` (aynı repo)
3. **Build Pack**: Docker
4. **Dockerfile Path**: `Dockerfile.backend` ⚠️ (root'ta, nokta ile!)
5. **Port**: `8000`
6. **Branch**: `main`

### ⚠️ ÖNEMLİ: Dockerfile Path Formatı

Coolify'da Dockerfile path'i yazarken:
- ✅ **DOĞRU**: `Dockerfile.backend` (root'ta, nokta ile)
- ❌ **YANLIŞ**: `backend/Dockerfile` (Coolify bunu dizin olarak yorumluyor)
- ❌ **YANLIŞ**: `backend.Dockerfile` (Coolify bunu da dizin olarak yorumluyor)

`Dockerfile.backend` dosyası root'ta ve `backend/` klasöründen dosyaları kopyalıyor.

## 2. Environment Variables

Backend servisinde şu environment variable'ları ekleyin:

```env
# Supabase
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# SMTP – info@heni.com.tr ile göndermek için
SMTP_SERVER=smtp.hostinger.com
SMTP_PORT=465
SMTP_USERNAME=info@heni.com.tr
SMTP_PASSWORD=your_smtp_password
FROM_EMAIL=info@heni.com.tr
FROM_NAME=Heni

# Python
PYTHONUNBUFFERED=1
```

## 3. Backend URL'ini Alma

Deploy tamamlandıktan sonra:
- Coolify backend servisinin **Public URL**'ini alın
- Örnek: `https://backend-mlh.heni.com.tr` veya `https://api-mlh.heni.com.tr`

## 4. Next.js Servisinde BACKEND_URL'i Güncelleme

Next.js servisinde (ana uygulama) environment variable'ı güncelleyin:

```env
BACKEND_URL=https://backend-mlh.heni.com.tr
```

**ÖNEMLİ:** `localhost:8000` yerine backend'in **canlı URL**'ini kullanın!

## 5. Test

Backend'in çalıştığını test edin:

```bash
curl https://backend-mlh.heni.com.tr/api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "...",
  "environment": "production"
}
```

## Alternatif: Aynı Domain Altında (Subpath)

Eğer backend'i `mlh.heni.com.tr/api` altında çalıştırmak isterseniz:

1. Coolify'da backend servisine **Custom Domain** ekleyin
2. **Path**: `/api` olarak ayarlayın
3. Next.js'te `BACKEND_URL=https://mlh.heni.com.tr/api` kullanın

## Sorun Giderme

- **502 Bad Gateway**: Backend servisi çalışmıyor, logları kontrol edin
- **Connection refused**: `BACKEND_URL` yanlış veya backend erişilebilir değil
- **CORS hatası**: Backend'de CORS ayarlarını kontrol edin (şu an `allow_origins=["*"]`)
