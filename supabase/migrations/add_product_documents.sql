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
