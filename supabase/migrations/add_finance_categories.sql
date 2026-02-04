-- Finance categories table
CREATE TABLE IF NOT EXISTS finance_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Finance transactions category reference
ALTER TABLE finance_transactions
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES finance_categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_finance_transactions_category_id ON finance_transactions(category_id);

-- Enable RLS
ALTER TABLE finance_categories ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now
CREATE POLICY "Allow all operations on finance_categories" ON finance_categories
  FOR ALL USING (true) WITH CHECK (true);

-- Seed default categories (idempotent)
INSERT INTO finance_categories (name)
VALUES
  ('Kira'),
  ('Fatura'),
  ('Maaş'),
  ('Lojistik'),
  ('Hammadde'),
  ('Esans'),
  ('Şişe'),
  ('Kapak'),
  ('Etiket'),
  ('Koli'),
  ('Ambalaj'),
  ('Klişe'),
  ('Labaratuvar'),
  ('Yakıt'),
  ('Reklam'),
  ('Vergi'),
  ('Yemek'),
  ('Yol'),
  ('Ağırlama')
ON CONFLICT (name) DO NOTHING;
