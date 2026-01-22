# Tam Düzeltme Adımları

Yanlış yükleme komutu nedeniyle bozulan kurulumu düzeltmek için:

## 1. Tüm Süreçleri Durdurun

Terminal'de Ctrl+C ile dev server'ı durdurun (varsa)

## 2. Tam Temizlik

```powershell
cd c:\Users\DELL\Desktop\mlh

# node_modules'ı sil
Remove-Item -Recurse -Force node_modules

# package-lock.json'ı sil  
Remove-Item -Force package-lock.json

# .next cache'ini sil
if (Test-Path .next) { Remove-Item -Recurse -Force .next }
```

## 3. Yeniden Kurulum

```powershell
# Dependencies'leri yeniden yükle
npm install
```

Bu işlem 2-3 dakika sürebilir.

## 4. Dev Server'ı Başlat

```powershell
npm run dev
```

## 5. Tarayıcıyı Aç

- **Incognito/Private modda** açın (Ctrl+Shift+N)
- Adres: `http://localhost:3000`
- Hard refresh: Ctrl+Shift+R

## 6. Kontrol Et

Şunu görmelisiniz:
- Sol tarafta "mlh" header'ı olan bir sidebar
- Ana alanda "✓ WhatsApp-Style CRM Çalışıyor!" mesajı

## Eğer Hala Next.js Sayfası Görünüyorsa:

1. **Terminal çıktısını kontrol edin:**
   - `npm run dev` çalıştırdığınızda ne yazıyor?
   - Herhangi bir hata var mı?

2. **Başka bir Next.js projesi çalışıyor olabilir:**
   ```powershell
   netstat -ano | findstr :3000
   ```
   Başka bir process varsa, onu durdurun veya farklı port kullanın:
   ```powershell
   npm run dev -- -p 3001
   ```

3. **Yanlış dizinde olabilirsiniz:**
   ```powershell
   pwd
   ```
   Şunu görmelisiniz: `c:\Users\DELL\Desktop\mlh`

4. **Node sürümünü kontrol edin:**
   ```powershell
   node -v
   ```
   Node.js 18 veya üzeri olmalı.
