# Supabase Migration Rehberi - Showroom Dönüşümü

## 🎯 Migration'ları Çalıştırma Adımları

### Yöntem 1: Supabase Dashboard (Web UI) - ÖNERİLEN ✅

#### Adım 1: Dashboard'a Giriş
1. https://supabase.com/dashboard adresine gidin
2. MLH projenizi seçin
3. Sol menüden **"SQL Editor"** tıklayın

#### Adım 2: Migration'ları Sırayla Çalıştırın

Aşağıdaki migration'ları **tam olarak bu sırayla** çalıştırın:

---

### ✅ Migration 1: Product Documents

**Dosya:** `supabase/migrations/add_product_documents.sql`

```sql
-- Aşağıdaki SQL kodunu kopyalayıp SQL Editor'e yapıştırın ve "Run" butonuna basın

-- Ürün belgelerini saklamak için yeni tablo
-- MSDS, COA, analiz raporları, sertifikalar vb.

CREATE TABLE IF NOT EXISTS product_documents (
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

-- Index'ler oluştur (performans için)
CREATE INDEX IF NOT EXISTS idx_product_documents_product_id ON product_documents(product_id);
CREATE INDEX IF NOT EXISTS idx_product_documents_type ON product_documents(document_type);

-- RLS (Row Level Security) politikaları
ALTER TABLE product_documents ENABLE ROW LEVEL SECURITY;

-- Public okuma izni (herkes belgeleri görebilir)
CREATE POLICY "Public can view public documents" ON product_documents
  FOR SELECT USING (is_public = true);

-- Admin'ler tüm işlemleri yapabilir
CREATE POLICY "Admins can do everything" ON product_documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );
```

**✅ Başarılı mesajı görmelisiniz:** `Success. No rows returned`

---

### ✅ Migration 2: Product Media Category

**Dosya:** `supabase/migrations/add_product_media_category.sql`

```sql
-- product_media tablosuna medya kategorisi ekle
-- Bu sayede ürün görselleri, yükleme fotoğrafları, sertifika görselleri vb. ayırabiliriz

-- Önce kolonu ekle
ALTER TABLE product_media 
ADD COLUMN IF NOT EXISTS media_category TEXT CHECK (
  media_category IN ('product', 'loading', 'certificate', 'technical', 'lifestyle')
);

-- Mevcut kayıtlar için varsayılan değer ata
UPDATE product_media 
SET media_category = 'product' 
WHERE media_category IS NULL;

-- display_order ekle (medya sıralaması için)
ALTER TABLE product_media 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Mevcut kayıtlar için sıralama ver
UPDATE product_media 
SET display_order = 0 
WHERE display_order IS NULL;

-- Index ekle (filtreleme performansı için)
CREATE INDEX IF NOT EXISTS idx_product_media_category ON product_media(media_category);
CREATE INDEX IF NOT EXISTS idx_product_media_order ON product_media(display_order);
```

**✅ Başarılı mesajı görmelisiniz**

---

### ✅ Migration 3: Product Export Countries Update

**Dosya:** `supabase/migrations/update_product_export_countries.sql`

```sql
-- product_export_countries tablosuna ek alanlar ekle
-- Bayrak görseli, compliance notları, HS code vb.

-- Bayrak URL'i (ülke bayrağı görseli için)
ALTER TABLE product_export_countries
ADD COLUMN IF NOT EXISTS flag_url TEXT;

-- Compliance notları (ülke bazlı özel gereksinimler)
ALTER TABLE product_export_countries
ADD COLUMN IF NOT EXISTS compliance_notes TEXT;

-- HS Code (Harmonized System Code - gümrük kodu)
ALTER TABLE product_export_countries
ADD COLUMN IF NOT EXISTS hs_code TEXT;

-- Görüntüleme sırası
ALTER TABLE product_export_countries
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Ek metadata (JSON formatında esneklik için)
ALTER TABLE product_export_countries
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Index'ler ekle
CREATE INDEX IF NOT EXISTS idx_product_export_countries_order ON product_export_countries(display_order);
CREATE INDEX IF NOT EXISTS idx_product_export_countries_metadata ON product_export_countries USING GIN(metadata);

-- Mevcut kayıtlar için varsayılan değerler
UPDATE product_export_countries
SET display_order = 0
WHERE display_order IS NULL;

UPDATE product_export_countries
SET metadata = '{}'::jsonb
WHERE metadata IS NULL;
```

**✅ Başarılı mesajı görmelisiniz**

---

### ✅ Migration 4: Cart Tables

**Dosya:** `supabase/migrations/add_cart_tables.sql`

```sql
-- Sepet (Cart) ve sepet ürünleri (Cart Items) tabloları

-- Carts tablosu
CREATE TABLE IF NOT EXISTS carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cart Items tablosu
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(cart_id, product_id, variant_id)
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_carts_session_id ON carts(session_id);
CREATE INDEX IF NOT EXISTS idx_carts_user_id ON carts(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);

-- RLS (Row Level Security) politikaları
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Herkes kendi sepetini görebilir (session_id bazlı)
CREATE POLICY "Users can view their own cart" ON carts
  FOR SELECT USING (true);

-- Herkes kendi sepetini güncelleyebilir
CREATE POLICY "Users can update their own cart" ON carts
  FOR ALL USING (true);

-- Herkes kendi sepet ürünlerini görebilir
CREATE POLICY "Users can view their own cart items" ON cart_items
  FOR SELECT USING (true);

-- Herkes kendi sepet ürünlerini yönetebilir
CREATE POLICY "Users can manage their own cart items" ON cart_items
  FOR ALL USING (true);

-- Updated_at otomatik güncelleme trigger'ı
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_carts_updated_at BEFORE UPDATE ON carts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**✅ Başarılı mesajı görmelisiniz**

---

### ✅ Migration 5: Quotes Tables

**Dosya:** `supabase/migrations/add_quotes_tables.sql`

```sql
-- Teklif talepleri (Quotes) ve teklif ürünleri (Quote Items) tabloları

-- Quotes tablosu
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_number TEXT NOT NULL UNIQUE,
  company_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  country TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'reviewing', 'quoted', 'accepted', 'rejected', 'cancelled')
  ),
  total_amount DECIMAL(15, 2),
  currency TEXT DEFAULT 'USD',
  valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quote Items tablosu
CREATE TABLE IF NOT EXISTS quote_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(15, 2),
  total_price DECIMAL(15, 2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_quotes_quote_number ON quotes(quote_number);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_email ON quotes(email);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quote_items_quote_id ON quote_items(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_items_product_id ON quote_items(product_id);

-- RLS (Row Level Security) politikaları
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;

-- Admin'ler tüm quote'ları görebilir
CREATE POLICY "Admins can view all quotes" ON quotes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Herkes quote oluşturabilir
CREATE POLICY "Anyone can create quotes" ON quotes
  FOR INSERT WITH CHECK (true);

-- Admin'ler quote'ları güncelleyebilir
CREATE POLICY "Admins can update quotes" ON quotes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Admin'ler tüm quote items'ları görebilir
CREATE POLICY "Admins can view all quote items" ON quote_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Herkes quote item oluşturabilir
CREATE POLICY "Anyone can create quote items" ON quote_items
  FOR INSERT WITH CHECK (true);

-- Updated_at otomatik güncelleme trigger'ı
CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**✅ Başarılı mesajı görmelisiniz**

---

## ✅ Migration Doğrulama

Tüm migration'ları çalıştırdıktan sonra kontrol edin:

### 1. Tabloları Kontrol Et

SQL Editor'de şu komutu çalıştırın:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'product_documents',
    'carts',
    'cart_items',
    'quotes',
    'quote_items'
  )
ORDER BY table_name;
```

**Görmek istediğiniz sonuç:**
- ✅ cart_items
- ✅ carts
- ✅ product_documents
- ✅ quote_items
- ✅ quotes

### 2. Kolonları Kontrol Et

```sql
-- product_media tablosuna eklenen kolonlar
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'product_media' 
  AND column_name IN ('media_category', 'display_order');

-- product_export_countries tablosuna eklenen kolonlar
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'product_export_countries' 
  AND column_name IN ('flag_url', 'compliance_notes', 'hs_code', 'display_order', 'metadata');
```

---

## 🚨 Hata Durumları ve Çözümleri

### Hata 1: "relation already exists"
**Çözüm:** Migration zaten çalıştırılmış, devam edebilirsiniz.

### Hata 2: "column already exists"
**Çözüm:** Kolon zaten var, devam edebilirsiniz.

### Hata 3: "permission denied"
**Çözüm:** Supabase dashboard'da doğru projeyi seçtiğinizden emin olun.

### Hata 4: "foreign key constraint"
**Çözüm:** `products` tablosunun var olduğundan emin olun:
```sql
SELECT * FROM products LIMIT 1;
```

---

## 📋 Sonraki Adımlar

Migration'lar başarıyla çalıştırıldıktan sonra:

1. ✅ **Backend'i redeploy edin** (Coolify)
2. ✅ **Frontend'i redeploy edin** (Coolify)
3. ✅ **Test edin:** https://mlh.heni.com.tr/showroom

---

## 🆘 Yardım

Sorun yaşarsanız:
1. SQL Editor'deki hata mesajını okuyun
2. Console'u kontrol edin (F12)
3. Migration dosyalarını tek tek çalıştırın

---

**Not:** Tüm migration'larda `IF NOT EXISTS` kullanıldığı için birden fazla çalıştırılsalar bile sorun olmaz. ✅
