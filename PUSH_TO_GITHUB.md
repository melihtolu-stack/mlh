# GitHub'a Push Etme Talimatları

## Durum
✅ Git repository başlatıldı
✅ Tüm dosyalar commit edildi (92 dosya)
✅ Remote eklendi: https://github.com/melihtolu-stack/mlh.git

## Push İşlemi

PowerShell'de şu komutları çalıştırın:

```powershell
cd c:\Users\DELL\Desktop\mlh
git push -u origin master
```

## Kimlik Doğrulama

İlk push'ta GitHub kullanıcı adı ve şifre istenecek:

1. **Kullanıcı adı**: GitHub kullanıcı adınızı girin
2. **Şifre**: 
   - Eğer 2FA (İki Faktörlü Doğrulama) aktifse, **Personal Access Token** kullanmanız gerekir
   - Token oluşturmak için: https://github.com/settings/tokens
   - "Generate new token (classic)" tıklayın
   - `repo` yetkisini seçin
   - Token'ı kopyalayın ve şifre yerine kullanın

## Alternatif: SSH Kullanımı

Eğer SSH key'iniz varsa, remote URL'ini değiştirebilirsiniz:

```powershell
git remote set-url origin git@github.com:melihtolu-stack/mlh.git
git push -u origin master
```

## Sorun Giderme

### Eğer repository'de zaten dosyalar varsa:

```powershell
# Önce remote'tan çek
git pull origin main --allow-unrelated-histories

# Conflict varsa çöz, sonra push et
git push -u origin master
```

### Branch ismini main olarak değiştirmek isterseniz:

```powershell
git branch -M main
git push -u origin main
```
