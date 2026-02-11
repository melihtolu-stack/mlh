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
