# info@heni.com.tr → CRM E-posta Kurulumu

Bu rehber, **info@heni.com.tr** adresine gelen maillerin CRM ekranına düşmesi ve yanıtların bu ekrandan e-posta ile iletilmesi için gerekli adımları anlatır.

## Özet Akış

1. **Gelen**: Müşteri **info@heni.com.tr** adresine mail atar → Webhook `POST /api/emails/incoming` → Backend işler → CRM’de konuşma + mesaj oluşur.
2. **Giden**: CRM’de mesaj yazılır → Backend müşteri diline çevirir → **info@heni.com.tr** üzerinden SMTP ile mail gider.

## 1. Environment Variables

### Next.js (Coolify / production)

- `EMAIL_INBOX=info@heni.com.tr`  
  Sadece bu adrese gelen mailler işlenir (Mailgun vb. `recipient` gönderiyorsa).
- `BACKEND_URL`  
  Backend API adresi (örn. `https://api.yourapp.com` veya Coolify’daki backend servis URL’i).

### Backend (`backend/.env`)

```env
# Supabase
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...

# SMTP – info@heni.com.tr ile göndermek için
SMTP_SERVER=smtp.hostinger.com
SMTP_PORT=465
SMTP_USERNAME=info@heni.com.tr
SMTP_PASSWORD=...
FROM_EMAIL=info@heni.com.tr
FROM_NAME=Heni
```

- Hostinger kullanıyorsanız SMTP bilgilerini Hostinger panelinden alın.
- `FROM_EMAIL` mutlaka **info@heni.com.tr** olsun; yanıtlar bu adresten gidecek.

## 2. Webhook URL

E-posta sağlayıcınız (Mailgun, SendGrid, N8N vb.) gelen mailleri şu adrese **POST** etmeli:

```
https://<siteniz>/api/emails/incoming
```

Örnek: `https://mlh.heni.com.tr/api/emails/incoming`

Desteklenen formatlar:

- **JSON**: `{ "from_email", "from_name", "subject", "body", "html_body?" }`
- **Mailgun Inbound Parse**: `application/x-www-form-urlencoded` (sender, recipient, subject, body-plain, body-html, …)

## 3. info@heni.com.tr’yi Webhook’a Bağlama

### Seçenek A: Mailgun Inbound Parse

1. Mailgun’da domain ekleyin (örn. `mg.heni.com.tr` veya `heni.com.tr`).
2. **Receiving → Create Route**:
   - **Expression**: `match_recipient("info@heni.com.tr")`
   - **Action**: `forward("https://<siteniz>/api/emails/incoming")`
3. Domain için **Inbound Parse** ayarlarında bu route’un kullanıldığından emin olun.

Bu sayede **info@heni.com.tr**’ye gelen mailler otomatik olarak `/api/emails/incoming` webhook’una gider.

### Seçenek B: SendGrid Inbound Parse

1. SendGrid **Settings → Inbound Parse**.
2. **Add Host & URL**:
   - **Destination URL**: `https://<siteniz>/api/emails/incoming`
   - **Receiving Domain**: MX kayıtlarına göre ayarlayın (örn. subdomain).
3. **info@heni.com.tr**’yi bu domain altında kullanacak şekilde MX’leri yapılandırın.

### Seçenek C: N8N (IMAP → Webhook)

1. **IMAP** node: info@heni.com.tr posta kutusuna bağlanın.
2. Yeni mail geldiğinde tetikleyin.
3. **HTTP Request** node:  
   `POST https://<siteniz>/api/emails/incoming`  
   Body (JSON):
   - `from_email`: mail from
   - `from_name`: isim (varsa)
   - `subject`: konu
   - `body`: düz metin (veya `html_body`)

## 4. Backend’in Erişilebilir Olması

- Next.js `/api/messages/send` ve `/api/emails/incoming` istekleri **BACKEND_URL**’e yönleniyor.
- Backend ayağa kalkmış ve bu URL’den erişilebilir olmalı (Coolify’da ayrı servis olarak deploy edebilirsiniz).

## 5. CRM Tarafında Kontrol

- Ana sayfa: Tüm konuşmalar listelenir; **channel: email** olanlar “Email” etiketi ile görünür.
- Chat ekranı: İlgili konuşmaya tıklanınca mesajlar ve yanıt kutusu açılır.
- Yanıt yazıldığında backend mesajı kaydeder, müşteri diline çevirir ve **info@heni.com.tr** üzerinden SMTP ile gönderir.

## 6. Test

1. **Gelen mail**:
   - Örnek: `curl -X POST https://<siteniz>/api/emails/incoming -H "Content-Type: application/json" -d '{"from_email":"test@example.com","from_name":"Test","subject":"Test","body":"Merhaba"}'`
   - CRM’de yeni konuşma + mesaj oluşmalı.
2. **Giden mail**:
   - Bu konuşmada CRM’den yanıt yazın.
   - Müşteri mail adresine **info@heni.com.tr**’den mail gitmeli.

## Sorun Giderme

- **Mailler CRM’e düşmüyor**: Webhook URL’i, `EMAIL_INBOX`, `BACKEND_URL` ve Mailgun/SendGrid/N8N yönlendirmesini kontrol edin.
- **Yanıt maili gitmiyor**: Backend `SMTP_*` ve `FROM_EMAIL` ayarlarını, backend loglarını kontrol edin.
- **Sadece belli adrese gelenler işlensin**: `EMAIL_INBOX=info@heni.com.tr` kullanın; webhook’a `recipient` gönderildiğinde sadece bu adres işlenir.
