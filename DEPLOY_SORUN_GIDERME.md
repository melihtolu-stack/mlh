# Deploy Sorun Giderme – “Yeni kod yok, CRM boş”

## 1. “Health eski, Build v2 yok” = Yeni kod deploy edilmiyor

`/api/health` hâlâ su sekildeyse:
```json
{"checks":{"supabase":{"configured":false,"url":"configured"}}}
```
**Yeni kod canliya cikmamis.** `build: "v2"`, `eksik`, vs. yoksa Coolify **eski image**i calistiriyor.

### Yapilacaklar (sira onemli) – Push + Rebuild

1. **Push**
   ```bash
   git add -A && git status
   git commit -m "..."   # bekleyen degisiklik varsa
   git push origin master
   ```
   Coolify’in izledigi **branch** (genelde `master` veya `main`) ile ayni olsun.

2. **Coolify’da “Rebuild”**
   - **Redeploy** degil, **Rebuild** kullanin. Redeploy bazen sadece container’i yeniden baslatir, image’i degistirmez.
   - **Build without cache** / **No cache** / **Clean build** secenegi varsa **mutlaka isaretleyin**.

3. **Branch**
   - Coolify → Frontend servisi → **Branch**: `master` (veya push yaptiginiz branch). Yanlis branch = eski kod.

4. **Build log**
   - Rebuild sonrasi **Build log**a bakin. `npm run build` calisiyor mu? Hata var mi? “Using cache” cok satir varsa cache’siz build deneyin.

5. **Yeni build kontrolu**
   - `https://mlh.heni.com.tr/api/health` → `"build": "v2"` ve `checks` icinde her biri `true`/`false` olmali.
   - `https://mlh.heni.com.tr/api/debug-env` → `"build": "v2"` ve `runtime` gorunuyorsa yeni kod var. Bu endpoint **sadece** env’lerin runtime’da okunup okunmadigini gosterir (deger gondermez).

---

## 2. Env “dogru” ama `configured: false` / veri yok

Env’leri tekrar kontrol ettiniz, hepsi dogru; buna ragmen health’te `configured: false` veya CRM bos.

### Kontrol listesi

1. **Runtime vs Build**
   - Coolify’da **Environment** / **Variables** bazen **Build** ve **Runtime** diye ayrilir.
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` **mutlaka Runtime**’da olmali. Sadece Build’de ise container calisirken goremez; health hep `configured: false` cikar.

2. **Isimler**
   - Tam olarak su isimler kullanilsin (fazla bosluk, farkli isim olmasin):
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`

3. **Degerler**
   - URL sonunda `/` olmasin: `https://xxx.supabase.co`
   - Key’ler tek satir, basinda/sonunda bosluk olmasin. Coolify’da “value” alanina yapistirirken gereksiz satir eklenmemesine dikkat edin.

4. **Hangi servis?**
   - Bu env’ler **Frontend (Next.js)** servisine ait. Backend icin `backend/.env` / BACKEND_DEPLOYMENT.md gecerli; frontend ayarlari ayri.

---

## 3. Ozet

| Belirti | Olası neden | Ne yapin? |
|--------|--------------|-----------|
| Health’te `build: "v2"` yok | Eski image calisiyor | Push → Rebuild (cache’siz) → dogru branch |
| `configured: false`, env “dogru” | Env Runtime’da yok veya yanlis | Env’leri Runtime’a tasiyin, isim/deger kontrolu |
| CRM bos, “Veriler yuklenemedi” yok | Eski frontend | Oncelikle yeni kodu deploy edin (Rebuild) |
| CRM bos, “Veriler yuklenemedi” var | API 503, env eksik | Env + health / debug-env kontrolu |

**Dün calisiyordu** diyorsaniz: Coolify’da env’ler silinmis/degismis veya **Redeploy** ile **Rebuild** karistirilip eski image ile devam edilmis olabilir.  
Once **Rebuild (cache’siz)** + **Runtime env** kontrolu yapin; sonra `/api/health` ve `/api/debug-env` ile dogrulayin.
