# N8N Workflow: info@heni.com.tr → CRM

## Workflow Yapısı

1. **IMAP Trigger** → Yeni mail geldiğinde tetiklenir
2. **Set Node** → Mail verilerini backend formatına dönüştürür
3. **HTTP Request** → `/api/emails/incoming` endpoint'ine POST eder

## Set Node Konfigürasyonu

### Node Ayarları
- **Mode**: Manual Mapping
- **Keep Only Set Fields**: Kapalı (tüm alanları koru)

### Field Mappings

Aşağıdaki field'ları ekleyin:

#### 1. `from_email` (Email adresi)
**Value:** 
```javascript
{{ $json.from.match(/<(.+)>/)?.[1] || $json.from.split(' ').pop() || $json.from }}
```

**Açıklama:** `from` alanından email'i çıkarır. Format: "Name <email@example.com>" veya "email@example.com"

#### 2. `from_name` (İsim-soyisim)
**Value:**
```javascript
{{ $json.from.match(/^(.+?)\s*</)?.[1]?.trim() || $json.from.includes('@') ? null : $json.from.trim() || null }}
```

**Açıklama:** `from` alanından ismi çıkarır. Email yoksa null döner.

#### 3. `subject` (Konu)
**Value:**
```javascript
{{ $json.subject || '' }}
```

#### 4. `body` (Mesaj içeriği - düz metin)
**Value:**
```javascript
{{ $json.textPlain || $json.textHtml?.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').trim() || '' }}
```

**Açıklama:** Önce `textPlain` varsa onu kullanır, yoksa HTML'den temizlenmiş metni kullanır.

#### 5. `html_body` (HTML içerik - opsiyonel)
**Value:**
```javascript
{{ $json.textHtml || null }}
```

**Açıklama:** HTML içerik varsa gönderilir, yoksa null.

#### 6. `phone` (Telefon numarası - opsiyonel, body'den çıkarılır)
**Value:**
```javascript
{{ ($json.textPlain || $json.textHtml?.replace(/<[^>]*>/g, '') || '').match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{2}[-.\s]?\d{2}|\+90\s?\d{3}\s?\d{3}\s?\d{2}\s?\d{2}|\d{10,11}/)?.[0] || null }}
```

**Açıklama:** Body'den telefon numarası çıkarır (Türkiye formatı: +90 555 123 45 67, 05551234567, vb.)

---

## Alternatif: Daha Basit Set Node (Sadece Gerekli Alanlar)

Eğer telefon numarasını backend'de parse etmek istiyorsanız (backend zaten email parser kullanıyor), sadece şu alanları gönderebilirsiniz:

### Basit Format

| Field | Value |
|-------|-------|
| `from_email` | `{{ $json.from.match(/<(.+)>/)?.[1] || $json.from.split(' ').pop() || $json.from }}` |
| `from_name` | `{{ $json.from.match(/^(.+?)\s*</)?.[1]?.trim() || ($json.from.includes('@') ? null : $json.from.trim()) || null }}` |
| `subject` | `{{ $json.subject || '' }}` |
| `body` | `{{ $json.textPlain || $json.textHtml?.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').trim() || '' }}` |
| `html_body` | `{{ $json.textHtml || null }}` |

---

## HTTP Request Node Konfigürasyonu

### Method
`POST`

### URL
```
https://<siteniz>/api/emails/incoming
```
Örnek: `https://mlh.heni.com.tr/api/emails/incoming`

### Authentication
None (public endpoint)

### Body Content Type
`JSON`

### Body (JSON)
```json
{
  "from_email": "{{ $json.from_email }}",
  "from_name": "{{ $json.from_name }}",
  "subject": "{{ $json.subject }}",
  "body": "{{ $json.body }}",
  "html_body": "{{ $json.html_body }}"
}
```

---

## Örnek: Tam Set Node JSON (Copy-Paste için)

Set node'da **"Keep Only Set Fields"** kapalıyken, aşağıdaki JSON'u **"Add Value"** ile ekleyebilirsiniz:

```json
{
  "from_email": "{{ $json.from.match(/<(.+)>/)?.[1] || $json.from.split(' ').pop() || $json.from }}",
  "from_name": "{{ $json.from.match(/^(.+?)\s*</)?.[1]?.trim() || ($json.from.includes('@') ? null : $json.from.trim()) || null }}",
  "subject": "{{ $json.subject || '' }}",
  "body": "{{ $json.textPlain || $json.textHtml?.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').trim() || '' }}",
  "html_body": "{{ $json.textHtml || null }}"
}
```

---

## Test Senaryosu

### Gelen Mail Örneği:
```
From: Ahmet Yılmaz <ahmet@example.com>
Subject: Ürün Bilgisi
Body: Merhaba, ürünlerinizle ilgileniyorum. Telefonum: +90 555 123 45 67
```

### Set Node Çıktısı:
```json
{
  "from_email": "ahmet@example.com",
  "from_name": "Ahmet Yılmaz",
  "subject": "Ürün Bilgisi",
  "body": "Merhaba, ürünlerinizle ilgileniyorum. Telefonum: +90 555 123 45 67",
  "html_body": null
}
```

### Backend'e Gönderilen:
```json
{
  "from_email": "ahmet@example.com",
  "from_name": "Ahmet Yılmaz",
  "subject": "Ürün Bilgisi",
  "body": "Merhaba, ürünlerinizle ilgileniyorum. Telefonum: +90 555 123 45 67",
  "html_body": null
}
```

Backend bu veriyi alınca:
- Email parser telefon numarasını (`+90 555 123 45 67`) çıkarır
- Dil algılar (Türkçe)
- Müşteri oluşturur/günceller
- Konuşma ve mesaj oluşturur

---

## Notlar

1. **Telefon numarası:** Backend'deki `email_parser` servisi body'den telefon numarasını otomatik çıkarır, bu yüzden Set node'da ayrıca göndermenize gerek yok. Ama isterseniz `phone` field'ını da ekleyebilirsiniz (backend şu an kullanmıyor ama gelecekte kullanılabilir).

2. **HTML içerik:** `html_body` gönderilirse backend HTML'i parse eder ve daha iyi veri çıkarımı yapar.

3. **Hata durumları:** Eğer `from_email` çıkarılamazsa, HTTP Request 400 döner. Set node'da validation ekleyebilirsiniz:
   ```javascript
   {{ $json.from.match(/<(.+)>/)?.[1] || $json.from.split(' ').pop() || $json.from || 'invalid@email.com' }}
   ```

4. **IMAP node ayarları:** IMAP node'da `textPlain` ve `textHtml` alanlarının geldiğinden emin olun (genellikle otomatik gelir).
