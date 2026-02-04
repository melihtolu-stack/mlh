-- Finance transactions table
CREATE TABLE IF NOT EXISTS finance_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  amount NUMERIC(12, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('in', 'out')),
  description TEXT NOT NULL,
  person TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for finance transactions
CREATE INDEX IF NOT EXISTS idx_finance_transactions_created_at ON finance_transactions(created_at DESC);

-- Enable RLS
ALTER TABLE finance_transactions ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now
CREATE POLICY "Allow all operations on finance_transactions" ON finance_transactions
  FOR ALL USING (true) WITH CHECK (true);
