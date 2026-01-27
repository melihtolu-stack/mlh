# Coolify Kontrol Listesi – "404 debug-env, health eski"

**Durum:** `/api/debug-env` 404, `/api/health` eski format => **yeni kod deploy edilmiyor.**

## 1. Coolify Frontend ayarlari

| Ayar | Olmasi gereken | Kontrol |
|------|----------------|--------|
| **Repository** | `melihtolu-stack/mlh` (push yaptiginiz repo) | [ ] |
| **Branch** | `master` (veya `git push origin X` yaptiginiz branch) | [ ] |
| **Build Pack** | **Docker** (Nixpacks / Node degil) | [ ] |
| **Dockerfile Path** | `Dockerfile` (proje kokunde) | [ ] |

## 2. Rebuild (Redeploy degil)

- **Rebuild** / **Build** tetikleyin. Sadece **Redeploy** = mevcut image yeniden baslar, yeni kod gelmez.
- **Build without cache** / **No cache** secili olsun.

## 3. Build log

Rebuild bittikten sonra **Build / Deployment log**a bakin:

- `git clone` veya `git pull` yapiliyor mu? Hangi **commit**?
- `npm run build` veya `docker build` satiri var mi?
- Cok fazla `Using cache` varsa cache’siz build deneyin.

## 4. Push dogru mu?

```powershell
cd c:\Users\DELL\Desktop\mlh
git log -1 --oneline
git remote -v
git push origin master
```

Coolify’in **Branch** ile ayni branch’e push ettiginizden emin olun.

## 5. Basarili deploy sonrasi

- `https://mlh.heni.com.tr/api/health` => `"build": "v2"` olmali
- `https://mlh.heni.com.tr/api/debug-env` => **404 olmamali**, JSON donmeli

404 ve eski health devam ediyorsa Coolify **yeni image’i kullanmiyor** demektir (yanlis kaynak, cache, veya Rebuild yerine Redeploy).
