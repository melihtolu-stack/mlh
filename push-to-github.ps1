# GitHub'a Push Script
# Bu scripti çalıştırmadan önce GITHUB_REPO_URL değişkenini kendi repository URL'in ile değiştir

$GITHUB_REPO_URL = "https://github.com/KULLANICI_ADI/REPO_ADI.git"

Write-Host "GitHub Repository URL: $GITHUB_REPO_URL" -ForegroundColor Yellow
Write-Host ""

# Remote ekle
Write-Host "Remote ekleniyor..." -ForegroundColor Cyan
git remote add origin $GITHUB_REPO_URL

if ($LASTEXITCODE -ne 0) {
    Write-Host "Remote zaten mevcut, güncelleniyor..." -ForegroundColor Yellow
    git remote set-url origin $GITHUB_REPO_URL
}

# Branch'i main olarak ayarla
Write-Host "Branch main olarak ayarlanıyor..." -ForegroundColor Cyan
git branch -M main

# Push et
Write-Host "GitHub'a push ediliyor..." -ForegroundColor Cyan
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ Başarılı! Dosyalar GitHub'a yüklendi." -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "✗ Push başarısız oldu. Lütfen GitHub kullanıcı adı ve şifre/token girin." -ForegroundColor Red
    Write-Host "Eğer 2FA aktifse, Personal Access Token kullanmanız gerekebilir." -ForegroundColor Yellow
}
