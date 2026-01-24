# Troubleshooting: Still Seeing Next.js Default Page

If you're still seeing the Next.js default welcome page, follow these steps:

## Step 1: Verify You're in the Right Directory

```powershell
cd c:\Users\DELL\Desktop\mlh
pwd  # Should show: c:\Users\DELL\Desktop\mlh
```

## Step 2: Kill All Node Processes

```powershell
# Kill all node processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
```

## Step 3: Clear Everything

```powershell
# Remove .next folder
if (Test-Path .next) { Remove-Item -Recurse -Force .next }

# Remove node_modules/.cache if exists
if (Test-Path node_modules/.cache) { Remove-Item -Recurse -Force node_modules/.cache }
```

## Step 4: Start Fresh

```powershell
# Install dependencies (if needed)
npm install

# Start dev server
npm run dev
```

## Step 5: Open in Incognito/Private Browser

1. Open Chrome/Firefox in Incognito/Private mode
2. Go to `http://localhost:3000`
3. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

## Step 6: Check the Terminal Output

When you run `npm run dev`, you should see:
```
▲ Next.js 14.2.5
- Local:        http://localhost:3000
- Environments: .env.local

✓ Ready in Xms
```

If you see errors, fix them before continuing.

## Step 7: Verify Files Exist

Run these commands to verify your files:

```powershell
Test-Path src\app\page.tsx      # Should return True
Test-Path src\app\layout.tsx    # Should return True
Test-Path src\components\sidebar\Sidebar.tsx  # Should return True
```

## Step 8: Check Browser Console

1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Check Network tab - make sure requests are going to localhost:3000

## Step 9: Try Different Port

If port 3000 is being used by another app:

```powershell
npm run dev -- -p 3001
```

Then visit: `http://localhost:3001`

## Step 10: Check if Another Next.js App is Running

```powershell
# Check what's running on port 3000
netstat -ano | findstr :3000
```

If you see another process, kill it or use a different port.

## Still Not Working?

1. **Check the URL**: Make sure you're visiting `http://localhost:3000` (not `http://localhost:3000/` with extra paths)

2. **Check terminal output**: When you visit localhost:3000, does the terminal show a GET request?

3. **Try building first**: 
   ```powershell
   npm run build
   npm start
   ```
   Then visit `http://localhost:3000`

4. **Check for conflicting pages directory**: Make sure there's NO `pages` directory at the root level (only `src/app` should exist)

5. **Verify Next.js version**: 
   ```powershell
   npm list next
   ```
   Should show `next@14.2.5`

If none of these work, the issue might be:
- Node.js version (need Node.js 18+)
- Port conflict with another app
- Firewall/antivirus blocking localhost
- Corrupted node_modules (delete and reinstall: `rm -rf node_modules package-lock.json && npm install`)

---

## REST ile yazılanlar Supabase’de görünüyor ama CRM’de yok

**Sebep:** CRM, `conversations` + `customers` tablolarını kullanır. REST `POST /api/leads` hem `leads` tablosuna yazar hem de CRM için `customers` → `conversations` → `messages` oluşturur. Veri Supabase’de (ör. `leads`) var ama CRM’de yoksa genelde şunlardan biri:

1. **Farklı Supabase projesi**  
   Backend `SUPABASE_URL`, Next.js `NEXT_PUBLIC_SUPABASE_URL` (veya `SUPABASE_URL`) **aynı projeyi** göstermeli. Farklıysa backend bir projeye yazar, CRM diğerinden okur.

   - `.env` / `backend/.env`: `SUPABASE_URL=...`  
   - `.env.local`: `NEXT_PUBLIC_SUPABASE_URL=...` ve `SUPABASE_SERVICE_ROLE_KEY=...`  
   - İkisinde de **aynı Supabase proje URL’i** olmalı.

2. **Migration eksik**  
   `messages` için `original_content`, `translated_content` alanları gerekli. Migration çalışmamışsa lead CRM’e eklenirken hata alınır (lead yine `leads`’e yazılır).

   - `supabase/migrations/add_translation_fields.sql` çalıştırıldığından emin olun.

3. **`POST /api/lead-contacts` kullanıyorsanız**  
   Bu endpoint sadece `lead_contacts` tablosuna yazar. CRM **conversations** listeler; lead-contacts CRM’de görünmez. CRM’de görünsün istiyorsanız **`POST /api/leads`** kullanın (name, email, message zorunlu).

4. **Web kanalı filtresi**  
   CRM’de “Web” filtresi seçiliyse yalnızca `channel = 'web'` konuşmalar listelenir. “Tümü” ile deneyin.

**Kontrol:** Backend loglarında `Lead CRM'e eklenirken hata` uyarısı varsa, mesajda migration veya Supabase proje eşleşmesi ipucu olabilir.
