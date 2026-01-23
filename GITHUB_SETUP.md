# GitHub'a Yükleme Talimatları

## Adım 1: GitHub'da Repository Oluştur
1. https://github.com/new adresine git
2. Repository adını gir (örn: "mlh")
3. Public veya Private seç
4. "Create repository" butonuna tıkla

## Adım 2: Remote Ekle ve Push Et

Repository URL'ini aldıktan sonra şu komutları çalıştır:

```bash
# Remote ekle (URL'yi kendi repository URL'in ile değiştir)
git remote add origin https://github.com/KULLANICI_ADI/REPO_ADI.git

# Ana branch'i main olarak ayarla (eğer master kullanıyorsan)
git branch -M main

# GitHub'a push et
git push -u origin main
```

## Alternatif: Eğer zaten bir repository URL'in varsa

Sadece şu komutları çalıştır:
```bash
git remote add origin GITHUB_REPO_URL
git branch -M main
git push -u origin main
```

## Notlar
- İlk push'ta GitHub kullanıcı adı ve şifre/token isteyebilir
- Eğer 2FA (iki faktörlü doğrulama) aktifse, Personal Access Token kullanman gerekebilir
- Token oluşturmak için: GitHub Settings > Developer settings > Personal access tokens > Tokens (classic)
