# SHOWROOM PROFESYONEL DÖNÜŞÜM PROMPTU

## GENEL AMAÇ
MLH Showroom'u B2B müşteriler için profesyonel, kurumsal ve kullanıcı dostu bir ürün katalog ve teklif alma platformuna dönüştürmek.

---

## 1. ÜRÜN DETAY SAYFASI YENİDEN TASARIMI

### Mevcut Durum
- URL: https://mlh.heni.com.tr/showroom/tidy-hill-greaseqleen-heavy-duty-degreaser-750ml
- Basit ürün açıklaması ve "Add to Quote Basket" butonu var
- Profesyonel detaylar eksik

### Hedef Yapı

#### 1.1 Ürün Başlık Bölümü
```typescript
// components/showroom/ProductHeader.tsx
- Ürün adı (H1)
- SKU numarası
- Kategori badge'leri
- Stok durumu göstergesi
- Ürün özellikleri icon'ları (750ml, spray, heavy duty vb.)
```

#### 1.2 Medya Galerisi (Sol Taraf)
```typescript
// components/showroom/ProductGallery.tsx
- Ana görsel (büyük)
- Thumbnail'ler (alt/yan tarafta)
- Video oynatıcı (varsa)
- Zoom özelliği
- Tam ekran görüntüleme
- Yükleme fotoğrafları/videoları için ayrı tab
```

**Galeri Yapısı:**
```
[Ana Görsel - Büyük]
[Thumb1][Thumb2][Thumb3][Video][Loading]
```

#### 1.3 Ürün Bilgileri (Sağ Taraf)
```typescript
// components/showroom/ProductInfo.tsx

Bölümler:
1. Temel Bilgiler
   - Ürün adı
   - Kısa açıklama
   - MOQ (Minimum Order Quantity)
   - Fiyat bilgisi (eğer gösterilecekse)
   - Miktar seçici (+/- butonları)
   - "Add to Quote Basket" butonu

2. Özellikler
   - Icon'larla gösterilmiş özellikler
   - Teknik spesifikasyonlar tablosu

3. İhracat Ülkeleri
   - Bayrak icon'ları grid'de
   - Tooltip ile ülke adı
```

#### 1.4 Detaylı Bilgi Sekmeleri (Tabs)
```typescript
// components/showroom/ProductTabs.tsx

Tab 1: Açıklama (Description)
- Detaylı ürün açıklaması
- Kullanım alanları
- Faydaları

Tab 2: Teknik Bilgiler (Technical Info)
- Teknik özellikler tablosu
- Bileşenler
- Kullanım talimatları

Tab 3: Belgeler (Documents)
- MSDS dosyası (indir butonu + önizleme)
- Analiz raporu (indir butonu + önizleme)
- Sertifikalar (indir butonu + önizleme)
- COA (Certificate of Analysis)
- Diğer belgeler

Tab 4: Medya (Media)
- Ürün fotoğrafları galerisi
- Video galerisi
- Yükleme fotoğrafları/videoları
- 3D görsel (varsa)

Tab 5: İhracat Bilgileri (Export Info)
- İhracat yapılan ülkeler (bayraklarla)
- Ülke bazlı özel notlar
- Compliance bilgileri
- HS Code bilgileri
```

---

## 2. SHOWROOM ANA SAYFA YENİLEME

### Mevcut Durum
- Basit ürün grid'i
- Minimal tasarım
- Header/navbar eksik

### Hedef Yapı

#### 2.1 Header Tasarımı
```typescript
// components/showroom/ShowroomHeader.tsx

Sol Taraf:
[← Anasayfa] [Ürünler] [Sepetim]

Orta:
[Logo Alanı - opsiyonel arama]

Sağ Taraf:
[Heni Logo - Grileştirilmiş]

Stil:
- Sticky header
- Şeffaf arkaplan ile başla, scroll'da solid
- Modern, minimal, profesyonel
```

#### 2.2 Ürün Kartları İyileştirmesi
```typescript
// components/showroom/ProductCard.tsx

Kart İçeriği:
- Ürün görseli
- Ürün adı
- SKU
- Kısa açıklama (2 satır)
- Kategori badge
- Miktar seçici (+/- butonları)
- "View Details" butonu
- Sepet badge'i (eklendiyse)

NOT: Her üründe ayrı "Add to Quote" butonu YOK
Miktar seçici ile belirlenen miktarlar otomatik sepete yansır
```

#### 2.3 Sepet Widget'i (Floating)
```typescript
// components/showroom/FloatingCart.tsx

Sağ alt köşede sabit duran mini sepet:
- Sepetteki ürün sayısı badge
- Tıklandığında sepet drawer'ı açılır
- Animasyonlu (sepete ekleme anında pulse efekti)
```

---

## 3. YENİ SEPETİM SAYFASI

### Tasarım
```typescript
// app/showroom/cart/page.tsx

Bölümler:

1. Sepet Listesi (Sol - %60)
   - Ürün görseli (küçük)
   - Ürün adı ve SKU
   - Varyant bilgisi (750ml, 1L vb.)
   - Birim fiyat (varsa)
   - Miktar seçici (+/-)
   - Satır toplamı
   - Kaldır butonu

2. Özet ve İletişim Formu (Sağ - %40)
   - Toplam ürün sayısı
   - Toplam miktar
   - Firma bilgileri formu:
     * Firma adı *
     * İletişim kişisi *
     * E-posta *
     * Telefon *
     * Ülke *
     * Özel notlar
   - "Teklif Talebi Gönder" butonu

3. Önerilen Ürünler (Alt)
   - Sepetteki ürünlerle ilgili öneriler
   - 4 ürün carousel
```

---

## 4. DATABASE SCHEMA GÜNCELLEMELERİ

### 4.1 Ürün Medya Kategorileri
```sql
-- product_media tablosuna media_category ekle
ALTER TABLE product_media 
ADD COLUMN media_category TEXT CHECK (
  media_category IN ('product', 'loading', 'certificate', 'technical', 'lifestyle')
);

-- Varsayılan 'product'
UPDATE product_media SET media_category = 'product' WHERE media_category IS NULL;
```

### 4.2 Ürün Belgeleri
```sql
-- Yeni tablo: product_documents
CREATE TABLE product_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (
    document_type IN ('msds', 'coa', 'analysis_report', 'certificate', 'spec_sheet', 'other')
  ),
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  language TEXT DEFAULT 'en',
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_product_documents_product_id ON product_documents(product_id);
CREATE INDEX idx_product_documents_type ON product_documents(document_type);
```

### 4.3 İhracat Ülkeleri - Görsel İyileştirme
```sql
-- product_export_countries tablosuna ek alanlar
ALTER TABLE product_export_countries
ADD COLUMN flag_url TEXT,
ADD COLUMN compliance_notes TEXT,
ADD COLUMN hs_code TEXT,
ADD COLUMN display_order INTEGER DEFAULT 0;
```

---

## 5. FRONTEND COMPONENT YAPISI

### Dizin Yapısı
```
src/
├── app/
│   └── showroom/
│       ├── page.tsx (Ana sayfa)
│       ├── [slug]/
│       │   └── page.tsx (Ürün detay)
│       ├── cart/
│       │   └── page.tsx (Sepet)
│       └── layout.tsx (Showroom layout)
│
├── components/
│   └── showroom/
│       ├── ShowroomHeader.tsx
│       ├── ProductCard.tsx
│       ├── ProductGallery.tsx
│       ├── ProductInfo.tsx
│       ├── ProductTabs.tsx
│       ├── ProductDocuments.tsx
│       ├── ExportCountries.tsx
│       ├── QuantitySelector.tsx
│       ├── FloatingCart.tsx
│       ├── CartDrawer.tsx
│       ├── CartItem.tsx
│       └── QuoteRequestForm.tsx
```

---

## 6. STATE MANAGEMENT - SEPETİM

### Zustand Store Yapısı
```typescript
// lib/stores/useCartStore.ts

interface CartItem {
  productId: string;
  variantId?: string;
  productName: string;
  productSku: string;
  variantName?: string;
  imageUrl?: string;
  quantity: number;
  unitPrice?: number;
  category?: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalQuantity: () => number;
}

// Local Storage'a otomatik kaydet
// Sepet değişince backend'e senkronize et
```

---

## 7. TASARIM PRENSİPLERİ

### Renk Paleti
```css
/* Kurumsal, profesyonel palet */
--primary: #1e40af; /* Koyu mavi - CTA'lar için */
--primary-hover: #1e3a8a;
--secondary: #64748b; /* Gri mavi - ikincil elementler */
--accent: #10b981; /* Yeşil - success/active durumlar */
--text-primary: #1f2937;
--text-secondary: #6b7280;
--border: #e5e7eb;
--bg-light: #f9fafb;
--bg-white: #ffffff;
```

### Typography
```css
/* Moderne, okunabilir fontlar */
--font-primary: 'Inter', 'Segoe UI', sans-serif;
--font-heading: 'Poppins', 'Inter', sans-serif;

/* Font sizes */
--text-xs: 0.75rem;
--text-sm: 0.875rem;
--text-base: 1rem;
--text-lg: 1.125rem;
--text-xl: 1.25rem;
--text-2xl: 1.5rem;
--text-3xl: 1.875rem;
```

### Spacing
```css
/* Tutarlı spacing sistemi */
--spacing-xs: 0.25rem; /* 4px */
--spacing-sm: 0.5rem;  /* 8px */
--spacing-md: 1rem;    /* 16px */
--spacing-lg: 1.5rem;  /* 24px */
--spacing-xl: 2rem;    /* 32px */
--spacing-2xl: 3rem;   /* 48px */
```

### Border Radius
```css
--radius-sm: 0.25rem;  /* 4px */
--radius-md: 0.5rem;   /* 8px */
--radius-lg: 0.75rem;  /* 12px */
--radius-xl: 1rem;     /* 16px */
```

### Shadows
```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
```

---

## 8. KULLANICI DENEYİMİ İYİLEŞTİRMELERİ

### 8.1 Miktar Seçimi UX
```
Ürün kartında:
[Product Image]
[Product Name]
[SKU: XXX-XXX]

Miktar: [-] [100] [+]  [0 adet sepette]

- İlk değer: 0
- + basınca: Sepete otomatik ekle/güncelle
- - basınca: Miktarı azalt, 0'a düşünce sepetten kaldır
- Manuel input: Blur'da sepeti güncelle
- Sepetteki miktar realtime göster
```

### 8.2 Bildirimler (Toasts)
```typescript
// Sepet işlemleri için toast mesajları
- "Ürün sepete eklendi"
- "Sepet güncellendi"
- "Ürün sepetten kaldırıldı"
- "Teklif talebi gönderildi"

// react-hot-toast kullan
```

### 8.3 Loading States
```
- Ürün yüklenirken: Skeleton loader
- Sepete eklerken: Miktar inputu disabled + spinner
- Form gönderirken: Button disabled + "Gönderiliyor..."
```

### 8.4 Hata Durumları
```
- Ürün bulunamadı: 404 sayfası
- Network hatası: Retry butonu
- Form hataları: Inline validasyon
```

---

## 9. RESPONSIVE TASARIM

### Breakpoints
```css
/* Mobile First Approach */
--mobile: 0px;      /* < 640px */
--tablet: 640px;    /* 640px - 1024px */
--desktop: 1024px;  /* 1024px - 1280px */
--wide: 1280px;     /* > 1280px */
```

### Mobil Optimizasyonlar
```
- Header: Hamburger menu
- Ürün kartları: 1 sütun (mobile), 2 sütun (tablet), 3-4 sütun (desktop)
- Ürün detay: Galeri üstte, bilgiler altta (mobile)
- Sepet: Stack layout (mobile), side-by-side (desktop)
- Floating cart: Bottom fixed (mobile), right fixed (desktop)
```

---

## 10. PERFORMANs OPTİMİZASYONLARI

### Image Optimization
```typescript
// next/image kullan
import Image from 'next/image';

<Image
  src={product.imageUrl}
  alt={product.name}
  width={600}
  height={600}
  quality={85}
  placeholder="blur"
  loading="lazy"
/>
```

### Code Splitting
```typescript
// Lazy loading için dynamic import
const ProductGallery = dynamic(() => import('@/components/showroom/ProductGallery'));
const ProductTabs = dynamic(() => import('@/components/showroom/ProductTabs'));
```

### Caching
```typescript
// React Query ile data caching
const { data: product } = useQuery({
  queryKey: ['product', slug],
  queryFn: () => fetchProduct(slug),
  staleTime: 5 * 60 * 1000, // 5 dakika
});
```

---

## 11. SEO OPTİMİZASYONLARI

### Meta Tags
```typescript
// app/showroom/[slug]/page.tsx

export async function generateMetadata({ params }) {
  const product = await fetchProduct(params.slug);
  
  return {
    title: `${product.name} | MLH B2B Showroom`,
    description: product.shortDescription,
    keywords: [product.category, 'B2B', 'wholesale', product.name],
    openGraph: {
      title: product.name,
      description: product.shortDescription,
      images: [product.imageUrl],
      type: 'product',
    },
  };
}
```

### Structured Data
```typescript
// JSON-LD schema for products
{
  "@context": "https://schema.org/",
  "@type": "Product",
  "name": "Heavy Duty Degreaser Spray (750 ml)",
  "image": "...",
  "description": "...",
  "brand": {
    "@type": "Brand",
    "name": "Tidy Hill"
  },
  "offers": {
    "@type": "AggregateOffer",
    "availability": "https://schema.org/InStock",
    "priceCurrency": "USD"
  }
}
```

---

## 12. BACKEND API GEREKSİNİMLERİ

### Yeni Endpoint'ler
```python
# routers/showroom.py

GET    /api/showroom/products
GET    /api/showroom/products/{slug}
GET    /api/showroom/products/{id}/documents
GET    /api/showroom/products/{id}/media
GET    /api/showroom/products/{id}/export-countries
POST   /api/showroom/cart
GET    /api/showroom/cart/{session_id}
PUT    /api/showroom/cart/{cart_id}/items
DELETE /api/showroom/cart/{cart_id}/items/{item_id}
POST   /api/showroom/quotes
```

---

## 13. ADIM ADIM UYGULAMA PLANI

### Faz 1: Database (1 gün)
1. product_documents tablosunu oluştur
2. product_media'ya media_category ekle
3. product_export_countries'i güncelle
4. Test verileri ekle

### Faz 2: Backend API (2 gün)
1. Product service'i güncelle (documents, export countries)
2. Showroom router'ı oluştur
3. Cart CRUD endpoint'leri
4. Quote request endpoint

### Faz 3: Showroom Layout & Header (1 gün)
1. ShowroomHeader component
2. Heni logo entegrasyonu
3. Navigation menu
4. Responsive header

### Faz 4: Ürün Kartları & Miktar Seçici (2 gün)
1. ProductCard component yeniden yaz
2. QuantitySelector component
3. Zustand cart store
4. Sepet senkronizasyonu

### Faz 5: Ürün Detay Sayfası (3 gün)
1. ProductGallery component
2. ProductInfo component
3. ProductTabs component (5 tab)
4. ProductDocuments component
5. ExportCountries component

### Faz 6: Sepetim Sayfası (2 gün)
1. Cart page layout
2. CartItem component
3. QuoteRequestForm
4. Form validation
5. Quote submission

### Faz 7: Polish & Testing (1 gün)
1. Toast notifications
2. Loading states
3. Error handling
4. Mobile responsive test
5. UX iyileştirmeleri

---

## 14. KRİTİK NOKTALAR VE BEST PRACTICES

### Accessibility (a11y)
- Tüm görsellerde alt text
- Keyboard navigation desteği
- ARIA labels
- Renk kontrast oranları (WCAG AA)
- Focus states

### Security
- XSS koruması (input sanitization)
- CSRF token'lar
- Rate limiting (quote submission)
- File upload validation (documents)

### Testing
- Unit tests: Components
- Integration tests: Cart flow
- E2E tests: Quote request flow
- Performance tests: Lighthouse score > 90

### Monitoring
- Google Analytics events:
  * Product view
  * Add to cart
  * Quote request
  * Document download
- Error tracking (Sentry)
- Performance monitoring

---

## 15. ÖNERİLEN KÜTÜPHANELER

```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.17.0",
    "zustand": "^4.4.7",
    "react-hook-form": "^7.49.2",
    "zod": "^3.22.4",
    "react-hot-toast": "^2.4.1",
    "framer-motion": "^11.0.0",
    "embla-carousel-react": "^8.0.0",
    "react-country-flag": "^3.1.0",
    "react-dropzone": "^14.2.3",
    "date-fns": "^3.0.6",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.2.0"
  }
}
```

---

## 16. SON KONTROL LİSTESİ

### UI/UX
- [ ] Header'da Heni logo var
- [ ] Ana sayfa, Ürünler, Sepetim navigasyonu var
- [ ] Ürün kartlarında miktar seçici var
- [ ] Sepet floating widget var
- [ ] Ürün detayda 5 tab var (Açıklama, Teknik, Belgeler, Medya, İhracat)
- [ ] Belgeler indirilip önizlenebiliyor
- [ ] İhracat ülkeleri bayraklarla gösteriliyor
- [ ] Sepet sayfası profesyonel
- [ ] Mobilde düzgün çalışıyor

### Functionality
- [ ] Miktar seçimi otomatik sepete yansıyor
- [ ] Sepet local storage'a kaydediliyor
- [ ] Teklif formu çalışıyor
- [ ] Toast bildirimleri gösteriliyor
- [ ] Loading states var
- [ ] Error handling yapılmış

### Performance
- [ ] Images optimize
- [ ] Lazy loading aktif
- [ ] Code splitting yapılmış
- [ ] Lighthouse score > 90

### SEO
- [ ] Meta tags uygun
- [ ] Structured data var
- [ ] Sitemap güncel
- [ ] Robots.txt doğru

---

## BAŞLA!

Lütfen yukarıdaki tüm gereksinimleri dikkate alarak:

1. Önce database migration'ları yap
2. Backend API endpoint'lerini oluştur
3. Frontend component'leri adım adım geliştir
4. Her adımda test et ve doğrula
5. Responsive tasarımı kontrol et
6. Final polish yap

Her component için:
- TypeScript kullan
- Tailwind CSS ile stil ver
- Accessibility standartlarına uy
- Clean code prensiplerini uygula
- Comment'leri Türkçe yaz

Başarılar! 🚀
