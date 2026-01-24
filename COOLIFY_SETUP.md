# Coolify Deployment – Frontend (Next.js) + Backend

## Frontend (Next.js) – Coolify ayarları

### 1. Build

- **Build Pack**: Docker  
- **Dockerfile Path**: `Dockerfile` (proje kökü)  
- **Build Context**: Proje kökü (varsayılan)

### 2. Build cache’i kapat (önemli)

Yeni commit’lerde kod değişikliği deploy’a yansımıyorsa:

- Coolify’da **Redeploy** / **Rebuild** yapın.  
- **“Build without cache”** / **“No cache”** / **“Clean build”** varsa işaretleyin.  
- Böylece her deploy’da `COPY src` ve `npm run build` yeniden çalışır.

### 3. Environment variables

**Build sırasında** (Build Arguments / Build-time env) – mümkünse ayarlayın:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

**Runtime** (Container env) – mutlaka ayarlayın:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

`SUPABASE_SERVICE_ROLE_KEY` olmadan `/api/conversations` 503 döner, CRM listesi gelmez.

### 4. Port

- **Port**: `3000`

### 5. Branch

- **Branch**: `master` veya Coolify’da kullandığınız branch.  
- Deploy etmeden önce bu branch’e `git push` yapın.

---

## Kontrol listesi

1. **Build v2**  
   CRM ana sayfada başlıkta **“Build v2”** rozeti görünüyorsa yeni frontend deploy’u çalışıyordur. Görünmüyorsa cache’siz rebuild yapın.

2. **Health**  
   `https://your-domain.com/api/health`  
   - 200 + `"supabase": { "configured": true }` → env tamam.  
   - 503 veya `configured: false` → `NEXT_PUBLIC_*` / `SUPABASE_SERVICE_ROLE_KEY` eksik veya yanlış.

3. **Veriler gelmiyor / hata**  
   - CRM’de **“Veriler yüklenemedi”** + hata mesajı görünüyorsa API hata veriyor (genelde 503).  
   - Coolify’da frontend servisinin **Environment** kısmında Supabase değişkenlerini kontrol edin.

4. **Yenile butonu**  
   - Header’da mavi **“Yenile”** butonu olmalı.  
   - Görünmüyorsa yine **Build v2** yok demektir → cache’siz rebuild.

---

## Backend

Backend ayarları için: **[BACKEND_DEPLOYMENT.md](./BACKEND_DEPLOYMENT.md)**  
Aynı Supabase projesini kullanın (`SUPABASE_URL` = frontend’deki `NEXT_PUBLIC_SUPABASE_URL`).
