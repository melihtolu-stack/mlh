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
